// Sonner's <Toaster>, wired to our theme so toasts render light or dark to match the app.
// It's a separate component (not inline in main.jsx) purely so it can call useTheme().
import { Toaster } from "sonner";

import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemedToaster() {
  const { isDark } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={isDark ? "dark" : "light"}
      richColors
      closeButton
    />
  );
}
