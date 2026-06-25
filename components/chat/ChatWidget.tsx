'use client';

import { useEffect, useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant'; content: string };

const SUGGESTIONS = [
  'What is the NBA Summer League?',
  'How does the hoodie designer work?',
  'What is LiveX?',
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: 'user', content: q }];
    setMessages([...next, { role: 'assistant', content: '' }]);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      let acc = '';
      if (reader) {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          setMessages((m) => {
            const c = [...m];
            c[c.length - 1] = { role: 'assistant', content: acc };
            return c;
          });
        }
      }
      if (!acc.trim()) {
        setMessages((m) => {
          const c = [...m];
          c[c.length - 1] = { role: 'assistant', content: 'Sorry, I had trouble responding — please try again.' };
          return c;
        });
      }
    } catch {
      setMessages((m) => {
        const c = [...m];
        c[c.length - 1] = { role: 'assistant', content: 'Connection issue — please try again.' };
        return c;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        data-cursor="grow"
        className="fixed bottom-5 right-5 z-[120] grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-[0_14px_44px_-10px_rgba(40,69,231,0.8)] ring-1 ring-white/15 transition hover:brightness-110"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 9 9 0 0 1-3.8-.8L3 21l1.3-5a8.5 8.5 0 1 1 16.7-4.5z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-[120] flex h-[min(72vh,560px)] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="font-display text-sm font-semibold text-ink">Ask the Drop</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-muted">NBA · Summer League · LiveX</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-[#15B981] shadow-[0_0_10px_#15B981]" aria-hidden />
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <div className="space-y-2.5">
                <p className="font-sans text-sm text-ink-muted">
                  Hey! I can help with the NBA, the Summer League, LiveX, or designing your hoodie.
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="block w-full rounded-xl border border-line bg-surface-raised px-3 py-2 text-left font-sans text-xs text-ink transition hover:border-brand"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 font-sans text-sm leading-relaxed ${
                      m.role === 'user' ? 'bg-brand text-white' : 'bg-surface-raised text-ink'
                    }`}
                  >
                    {m.content || (busy && i === messages.length - 1 ? '…' : '')}
                  </div>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-line p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 rounded-full border border-line bg-surface-raised px-4 py-2 font-sans text-sm text-ink outline-none placeholder:text-ink-muted/60 focus:border-brand"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-full bg-brand px-4 py-2 font-sans text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
