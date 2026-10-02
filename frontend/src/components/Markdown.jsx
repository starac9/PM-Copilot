// Shared long-form Markdown renderer (Learn lessons and PM AI Chat answers), styled by the
// `.prose-pm` rules in index.css. GitHub-flavored Markdown adds tables; tables get their own
// scroll box so they never widen the page on phones, and in-app links use the router.
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";

const COMPONENTS = {
  table: ({ node, ...props }) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table {...props} />
    </div>
  ),
  a: ({ node, href = "", children, ...props }) =>
    href.startsWith("/") ? (
      <Link to={href}>{children}</Link>
    ) : (
      <a href={href} target="_blank" rel="noreferrer" {...props}>
        {children}
      </a>
    ),
};

export default function Markdown({ children, className = "" }) {
  return (
    <div className={`prose-pm ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
