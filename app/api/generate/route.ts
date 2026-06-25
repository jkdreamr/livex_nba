import { answersSchema } from '@/lib/engine/answers-schema';
import { generate } from '@/lib/engine/generate';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return jsonResponse({ error: 'invalid JSON' }, 400); }
  const parsed = answersSchema.safeParse(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error.flatten() }, 400);
  try {
    return jsonResponse({ spec: generate(parsed.data) }, 200);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
}
