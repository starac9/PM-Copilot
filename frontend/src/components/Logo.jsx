// The PM Copilot mark: three ascending bars — a compact stand-in for a prioritized backlog
// / roadmap climbing toward ship. It's monochrome and drawn with `currentColor`, so it
// simply inherits the surrounding text color and adapts to light/dark automatically.
export default function Logo({ size = 28, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="PM Copilot logo"
    >
      <rect x="2" y="13" width="5" height="9" rx="1.5" />
      <rect x="9.5" y="7" width="5" height="15" rx="1.5" />
      <rect x="17" y="2" width="5" height="20" rx="1.5" />
    </svg>
  );
}
