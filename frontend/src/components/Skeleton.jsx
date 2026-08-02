// Skeleton loaders: greyed-out placeholders shaped like the content that's coming. They
// feel faster and more polished than a lone centered spinner because the layout doesn't
// jump when data arrives — the page is already the right shape. React Query's `isLoading`
// drives when these show.

// Base building block: a pulsing rounded bar. Compose these to mimic any layout.
export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 dark:bg-slate-700/50 ${className}`} />;
}

// Dashboard: a grid of project-card placeholders.
export function ProjectGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card flex flex-col gap-3 p-5">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      ))}
    </div>
  );
}

// PRD tab: a stack of section-card placeholders.
export function PrdSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card space-y-3 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}

// Stories tab: two epic columns of story-card placeholders.
export function StoriesSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-1/2" />
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="card space-y-3 p-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
