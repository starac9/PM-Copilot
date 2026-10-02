// /ask — PM AI Chat: a full-page mentor for product-management questions, backed by the
// /chat/mentor endpoint (same LLM service as the rest of the app, with a teaching prompt).
//
// Deep links: /ask?q=<question>&topic=<lesson title> pre-sends a question (used by Learn
// lessons). The conversation is kept in localStorage so a refresh doesn't lose it.
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowUp,
  BookOpen,
  Briefcase,
  Check,
  Copy,
  GraduationCap,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  X,
} from "lucide-react";

import api, { apiErrorMessage } from "../api/client.js";
import Logo from "../components/Logo.jsx";
import Markdown from "../components/Markdown.jsx";
import { Eyebrow } from "../components/PageHeader.jsx";
import SiteLayout from "../components/SiteLayout.jsx";
import Spinner from "../components/Spinner.jsx";

const STORAGE_KEY = "pmcopilot_mentor_chat";
const HISTORY_LIMIT = 12; // messages sent as context per request
const MAX_CHARS = 8000; // mirrors the backend's per-message cap

const SUGGESTIONS = [
  {
    icon: BookOpen,
    title: "Fundamentals",
    questions: ["What does a product manager actually do day to day?", "Explain product–market fit with an example"],
  },
  {
    icon: Target,
    title: "Frameworks",
    questions: ["When should I use RICE vs MoSCoW?", "How do I pick a North Star metric?"],
  },
  {
    icon: Briefcase,
    title: "Career & interviews",
    questions: ["How do I break into product management?", "Give me a product design interview question"],
  },
  {
    icon: GraduationCap,
    title: "Your product",
    questions: ["Help me write a problem statement for my idea", "What should my MVP include?"],
  },
];

function loadChat() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return Array.isArray(saved?.messages) ? saved : { messages: [], topic: "" };
  } catch {
    return { messages: [], topic: "" };
  }
}

function saveChat(chat) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chat));
  } catch {
    /* storage unavailable — the chat just won't survive a refresh */
  }
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked */
        }
      }}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied" : "Copy"}
    </button>
  );
}

function AssistantAvatar() {
  return (
    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink text-grass-400 dark:bg-slate-900 dark:ring-1 dark:ring-slate-800">
      <Logo size={15} />
    </span>
  );
}

export default function AskView() {
  const [params, setParams] = useSearchParams();
  const initial = useRef(loadChat());
  const [messages, setMessages] = useState(initial.current.messages);
  const [topic, setTopic] = useState(params.get("topic") || initial.current.topic || "");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // last failure, with a retry
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const autoSent = useRef(false);

  useEffect(() => {
    saveChat({ messages, topic });
  }, [messages, topic]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, error]);

  // Grow the textarea with its content (up to a cap).
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  async function ask(history, activeTopic = topic) {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/chat/mentor", {
        messages: history.slice(-HISTORY_LIMIT).map((m) => ({
          role: m.role,
          content: m.content.slice(0, MAX_CHARS),
        })),
        topic: activeTopic,
      });
      setMessages([...history, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(apiErrorMessage(err, "PM AI couldn't answer right now."));
    } finally {
      setLoading(false);
    }
  }

  function send(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const history = [...messages, { role: "user", content }];
    setMessages(history);
    setInput("");
    ask(history);
  }

  // Deep link (?q=…): send once, then drop the params so a refresh doesn't resend.
  useEffect(() => {
    const q = params.get("q");
    if (q && !autoSent.current) {
      autoSent.current = true;
      setParams({}, { replace: true });
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function newChat() {
    setMessages([]);
    setTopic("");
    setError(null);
    inputRef.current?.focus();
  }

  const empty = messages.length === 0 && !loading;

  return (
    <SiteLayout bare>
      <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-3xl flex-col px-4 sm:px-6">
        {/* Header row */}
        <div className="flex items-center justify-between gap-3 pb-2 pt-8">
          <Eyebrow>PM AI Chat</Eyebrow>
          {!empty && (
            <button
              type="button"
              onClick={newChat}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Plus size={14} /> New chat
            </button>
          )}
        </div>

        <div className="flex-1 pb-6">
          {empty ? (
            <div className="animate-fade-in-up pt-6 sm:pt-12">
              <span className="logo-mark h-12 w-12 shadow-[0_10px_30px_-12px_rgba(115,194,47,0.6)]">
                <Sparkles size={22} strokeWidth={1.75} />
              </span>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
                Ask anything about{" "}
                <span className="whitespace-nowrap rounded-[3px] bg-grass-400 px-2 text-ink">product management</span>
              </h1>
              <p className="mt-3 max-w-xl text-muted">
                Your always-on PM mentor: frameworks, metrics, interviews, and feedback on your own
                product ideas — with real examples. New to PM?{" "}
                <Link to="/learn" className="font-medium text-grass-700 underline decoration-grass-300 underline-offset-2 dark:text-grass-400">
                  Start the course
                </Link>
                .
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map(({ icon: Icon, title, questions }) => (
                  <div key={title} className="card p-4">
                    <p className="eyebrow flex items-center gap-1.5">
                      <Icon size={12} className="text-grass-500" /> {title}
                    </p>
                    <div className="mt-3 space-y-1.5">
                      {questions.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => send(q)}
                          className="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-body transition hover:bg-grass-50 hover:text-heading dark:hover:bg-grass-500/10"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[15px] text-white dark:bg-slate-800">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex gap-3">
                    <AssistantAvatar />
                    <div className="min-w-0 flex-1">
                      <div className="card px-5 py-4">
                        <Markdown>{m.content}</Markdown>
                      </div>
                      <div className="mt-1 flex justify-end">
                        <CopyButton text={m.content} />
                      </div>
                    </div>
                  </div>
                )
              )}

              {loading && (
                <div className="flex gap-3">
                  <AssistantAvatar />
                  <div className="card flex items-center gap-2.5 px-4 py-3 text-sm text-muted">
                    <Spinner className="h-4 w-4 text-grass-500" /> Thinking it through…
                  </div>
                </div>
              )}

              {error && !loading && (
                <div className="flex gap-3">
                  <AssistantAvatar />
                  <div className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                    <p>{error}</p>
                    <button
                      type="button"
                      onClick={() => ask(messages)}
                      className="mt-2 flex items-center gap-1.5 font-medium underline underline-offset-2"
                    >
                      <RotateCcw size={13} /> Try again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-[#FAFAF7] via-[#FAFAF7] to-transparent px-4 pb-5 pt-3 dark:from-[#0a0d14] dark:via-[#0a0d14] sm:-mx-6 sm:px-6">
          {topic && (
            <div className="mb-2 flex">
              <span className="badge badge-success max-w-full">
                <BookOpen size={12} className="shrink-0" />
                <span className="truncate">Lesson: {topic}</span>
                <button type="button" onClick={() => setTopic("")} aria-label="Remove lesson context">
                  <X size={12} />
                </button>
              </span>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.5)] transition focus-within:border-grass-400 focus-within:ring-4 focus-within:ring-grass-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-grass-500/15"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={MAX_CHARS}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask a product management question…"
              aria-label="Your question"
              className="max-h-[200px] flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-grass-400 text-ink transition hover:bg-grass-500 disabled:opacity-40"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </form>
          <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Enter to send · Shift+Enter for a new line · AI can make mistakes
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}
