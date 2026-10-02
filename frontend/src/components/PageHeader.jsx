// Shared page/section headings so every screen in the app opens the same way the landing
// page's sections do: a monospace "— EYEBROW", a tight headline, a muted description, and
// actions aligned to the right.

// "— LABEL" in monospace with a green dash (the landing page's section marker).
export function Eyebrow({ children, className = "" }) {
  return (
    <p className={`eyebrow ${className}`}>
      <span className="text-grass-500">— </span>
      {children}
    </p>
  );
}

// Top-of-page header (Dashboard, project pages).
export default function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// Heading for the content area of a tab (PRD / Stories / Roadmap / Workspace).
export function SectionHeader({ title, description, actions }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-tight text-heading">{title}</h2>
        {description && <div className="mt-0.5 text-sm text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
