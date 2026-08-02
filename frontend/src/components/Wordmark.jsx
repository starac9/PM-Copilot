// The PM Copilot wordmark: the three-bar mark + "PM" (bold sans) and "copilot" (serif
// italic). Shared by the landing page, the app navbar, and footers so the brand reads
// identically everywhere.
import Logo from "./Logo.jsx";

export default function Wordmark({ size = 22, className = "" }) {
  return (
    <span className={`flex items-center gap-2 text-ink dark:text-white ${className}`}>
      <Logo size={size} />
      <span className="text-[17px] font-bold tracking-tight">
        PM <span className="font-serif text-[19px] font-normal italic">copilot</span>
      </span>
    </span>
  );
}
