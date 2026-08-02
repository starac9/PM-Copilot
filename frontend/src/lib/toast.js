// Toast notifications, backed by Sonner (a tiny, accessible toast library that renders in
// a portal above everything). We expose the same `useToast()` API the app already used, so
// call sites keep doing `const toast = useToast(); toast.success("...")` unchanged.
//
// Sonner's `toast` is a singleton — it doesn't need React context or a provider hook — but
// keeping useToast() as the entry point means components don't import a third-party name
// directly and we could swap the library again from this one file.
import { toast } from "sonner";

export function useToast() {
  return toast;
}

export { toast };
