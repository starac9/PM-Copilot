// A floating FAQ chatbot in the bottom-right corner. It talks to the public /chat endpoint,
// which is backed by Groq — so it can answer questions about PM Copilot and general product
// questions in real time. Conversation state lives here; we send the recent history each turn.
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles } from "lucide-react";

import api, { apiErrorMessage } from "../api/client.js";
import Spinner from "./Spinner.jsx";

const GREETING = {
  role: "assistant",
  content: "Hi — I'm the PM Copilot assistant. Ask me anything about the product or product management.",
};

const SUGGESTIONS = ["What can PM Copilot do?", "How does RICE scoring work?", "Is it free?"];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Keep the latest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  async function send(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      // Send recent history (drop the canned greeting; cap length server-side too).
      const history = nextMessages
        .filter((m) => m !== GREETING)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));
      const { data } = await api.post("/chat", { messages: history });
      setMessages((cur) => [...cur, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setMessages((cur) => [
        ...cur,
        { role: "assistant", content: apiErrorMessage(err, "Sorry, I couldn't reach the server.") },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Launcher button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-grass-400 shadow-lift ring-1 ring-white/10 transition hover:brightness-125 active:scale-95"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] animate-fade-in-up flex-col overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 shadow-lift backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95">
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-slate-800 bg-ink px-4 py-3 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-grass-400/15 text-grass-400">
              <Sparkles size={16} />
            </span>
            <div>
              <p className="text-sm font-semibold">PM Copilot Assistant</p>
              <p className="text-[11px] text-white/80">Ask about the product · FAQ</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.role === "user"
                      ? "whitespace-pre-wrap rounded-br-sm bg-ink text-white"
                      : "rounded-bl-sm bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {/* User text is shown as-is; the assistant replies in markdown, which we
                      render (bold, bullets, etc.) via the `.chat-md` styles in index.css. */}
                  {m.role === "user" ? (
                    m.content
                  ) : (
                    <div className="chat-md">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-slate-100 px-3.5 py-2 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <Spinner className="h-4 w-4" /> thinking…
                </div>
              </div>
            )}

            {/* Quick suggestions (only before the first user message). */}
            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-body transition hover:border-grass-400 hover:text-grass-600 dark:border-slate-700 dark:bg-slate-800"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-slate-200/70 p-3 dark:border-slate-800"
          >
            <input
              className="input py-2"
              placeholder="Ask a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-grass-400 text-ink shadow-sm transition hover:bg-grass-500 disabled:opacity-50"
              aria-label="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
