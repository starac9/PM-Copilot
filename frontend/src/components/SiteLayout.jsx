// Shared page shell for every in-app screen (workspace, Learn, PM AI Chat): the platform nav,
// a faint blueprint grid fading out behind the top of the page, and a centered container.
import SiteNav from "./SiteNav.jsx";

export default function SiteLayout({ children, bare = false }) {
  return (
    <div className="relative min-h-screen">
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-80 [mask-image:linear-gradient(to_bottom,#000,transparent)]"
      />
      <SiteNav />
      {bare ? (
        // Full-bleed pages (e.g. chat) manage their own width and height.
        <div className="relative">{children}</div>
      ) : (
        <main className="relative mx-auto max-w-6xl animate-fade-in-up px-4 py-10 sm:px-6">
          {children}
        </main>
      )}
    </div>
  );
}
