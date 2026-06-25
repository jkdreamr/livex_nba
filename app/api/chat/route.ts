import type { NextRequest } from 'next/server';

// Server-only: the OpenRouter key never reaches the client. The browser talks
// only to this route, which proxies to OpenRouter and streams text back.
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// .trim() guards against stray whitespace/tabs pasted into the env var value
// (a leading tab makes OpenRouter reject the model ID with a 400).
const MODEL = (process.env.OPENROUTER_CHAT_MODEL || 'openrouter/owl-alpha').trim();
const MAX_HISTORY = 16; // last N turns kept (bounds prompt size / cost)
const MAX_CHARS = 4000; // per-message clamp
const MAX_TOKENS = 600; // response cap

const SYSTEM_PROMPT = `You are the LiveX × NBA Summer League assistant, a friendly guide embedded in the "Design Your Drop" custom-hoodie web app.

You ONLY help with these four topics:
1. The NBA — teams, players, the league, general basketball.
2. The NBA Summer League — the 2026 Las Vegas Summer League event.
3. LiveX — the company building this experience.
4. This product — the fan hoodie designer in this app.

Product facts you can rely on:
- A fan answers a few quick questions (team, hoodie color, style/vibe, how many patches, and optional must-have patches) and instantly previews a custom Summer League hoodie on a rotating 3D model. The hoodies are physically made for real, so the preview matches what gets embroidered.
- The #1 team a fan picks becomes the large back graphic; their other team picks and patches fill the chest, upper back, and sleeves. Auto-chosen "surprise" patches are colour-matched to the fan's team and every patch is contrast-checked against the fabric so nothing disappears.
- Hoodie colors: Bone, Black, and Grey.
- Built by LiveX for the 2026 NBA Summer League in Las Vegas.

Style: concise, upbeat, and helpful — short paragraphs, no walls of text. Do not invent specific stats, rosters, schedules, or prices; if you are not sure, say so.

If a question is clearly OUTSIDE those four topics (e.g. unrelated coding help, other sports, personal or medical advice, homework), do NOT answer it. Briefly say it's outside what you can help with here, then suggest 2–3 on-topic questions the user could ask instead (about the NBA, the Summer League, LiveX, or designing their hoodie).`;

type Msg = { role: string; content: string };

function textResponse(text: string): Response {
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(c) {
        c.enqueue(enc.encode(text));
        c.close();
      },
    }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } },
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    return textResponse(
      "The assistant isn't switched on yet — an OPENROUTER_API_KEY needs to be set. In the meantime, head to Design and build your Summer League hoodie!",
    );
  }

  let body: { messages?: Msg[] };
  try {
    body = await req.json();
  } catch {
    return textResponse("Sorry, I couldn't read that message — mind trying again?");
  }

  const history = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  if (history.length === 0) {
    return textResponse('Ask me anything about the NBA, the Summer League, LiveX, or designing your hoodie.');
  }

  let upstream: Response;
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': (process.env.OPENROUTER_SITE_URL || 'https://livex.ai').trim(),
        'X-Title': 'LiveX x NBA Summer League', // ASCII only — header values must not carry non-Latin-1 chars
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      }),
    });
  } catch {
    return textResponse('The assistant is unavailable right now — please try again in a moment.');
  }

  if (!upstream.ok || !upstream.body) {
    // Surface the real reason: log the full upstream error (visible in Vercel
    // function logs) and return an actionable message instead of a generic one.
    const detail = await upstream.text().catch(() => '');
    console.error(`[chat] OpenRouter ${upstream.status} for model "${MODEL}": ${detail.slice(0, 800)}`);
    let msg = 'The assistant hit a snag reaching the model. Please try again.';
    if (upstream.status === 400) {
      msg = 'The assistant is misconfigured — the chat model id looks invalid (check OPENROUTER_CHAT_MODEL).';
    } else if (upstream.status === 401 || upstream.status === 403) {
      msg = 'The assistant is misconfigured — the OpenRouter API key looks invalid.';
    } else if (upstream.status === 404) {
      // Free / stealth models (owl-alpha) need prompt logging enabled.
      msg = 'No model endpoint is available. For a free model, enable prompt logging under OpenRouter → Settings → Privacy, then try again.';
    } else if (upstream.status === 429) {
      msg = 'The assistant is busy right now (rate limited) — please try again in a moment.';
    }
    return textResponse(msg);
  }

  // Parse OpenRouter's SSE and re-stream just the text deltas as plain text.
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data:')) continue; // skip SSE comments / keep-alives
            const data = t.slice(5).trim();
            if (data === '[DONE]') {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const delta: string | undefined = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(enc.encode(delta));
            } catch {
              /* partial / non-JSON keep-alive line — ignore */
            }
          }
        }
      } catch {
        /* upstream dropped — end the stream */
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
