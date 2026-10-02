// End-of-lesson quiz: pick an answer per question, then "Check answers" reveals right/wrong
// with an explanation. Getting everything right marks the lesson complete. Resets when the
// lesson changes (the parent keys it by slug).
import { useState } from "react";
import { CheckCircle2, ListChecks, RotateCcw, XCircle } from "lucide-react";

import Button from "../components/Button.jsx";

export default function LessonQuiz({ questions, onPassed }) {
  const [picked, setPicked] = useState({}); // question index -> option index
  const [checked, setChecked] = useState(false);

  const allAnswered = questions.every((_, i) => picked[i] !== undefined);
  const score = questions.filter((q, i) => picked[i] === q.answer).length;
  const passed = checked && score === questions.length;

  function check() {
    setChecked(true);
    if (score === questions.length) onPassed?.();
  }

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="quiz-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="quiz-title" className="flex items-center gap-2 font-semibold text-heading">
          <span className="icon-tile h-8 w-8">
            <ListChecks size={15} />
          </span>
          Check your understanding
        </h2>
        {checked && (
          <span className={`badge font-mono ${passed ? "badge-success" : "badge-neutral"}`}>
            {score}/{questions.length}
          </span>
        )}
      </div>

      <ol className="mt-5 space-y-6">
        {questions.map((question, qi) => (
          <li key={qi}>
            <p className="font-medium text-heading">
              <span className="mr-2 font-mono text-sm text-grass-600 dark:text-grass-400">Q{qi + 1}</span>
              {question.q}
            </p>
            <div className="mt-3 grid gap-2" role="radiogroup" aria-label={`Question ${qi + 1}`}>
              {question.options.map((option, oi) => {
                const selected = picked[qi] === oi;
                const isAnswer = oi === question.answer;
                let tone =
                  "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600";
                if (selected && !checked) tone = "border-grass-400 bg-grass-50 dark:bg-grass-500/10";
                if (checked && isAnswer) tone = "border-grass-500 bg-grass-50 dark:bg-grass-500/10";
                if (checked && selected && !isAnswer) tone = "border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10";
                return (
                  <button
                    key={oi}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={checked}
                    onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                    className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-left text-sm text-body transition disabled:cursor-default ${tone}`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        selected ? "border-grass-500 bg-grass-500" : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="flex-1">{option}</span>
                    {checked && isAnswer && <CheckCircle2 size={16} className="shrink-0 text-grass-600" />}
                    {checked && selected && !isAnswer && <XCircle size={16} className="shrink-0 text-red-500" />}
                  </button>
                );
              })}
            </div>
            {checked && (
              <p className="mt-2 text-sm text-muted">
                <span className="font-medium text-heading">
                  {picked[qi] === question.answer ? "Correct. " : "Not quite. "}
                </span>
                {question.why}
              </p>
            )}
          </li>
        ))}
      </ol>

      <div className="rule mt-6 flex flex-wrap items-center justify-between gap-3 pt-4">
        <p className="text-sm text-muted">
          {passed
            ? "All correct — lesson marked complete."
            : checked
              ? "Review the explanations, then try again."
              : "Answer every question, then check."}
        </p>
        {checked ? (
          !passed && (
            <Button
              variant="secondary"
              onClick={() => {
                setPicked({});
                setChecked(false);
              }}
            >
              <RotateCcw size={14} /> Try again
            </Button>
          )
        ) : (
          <Button onClick={check} disabled={!allAnswered}>
            Check answers
          </Button>
        )}
      </div>
    </section>
  );
}
