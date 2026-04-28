import { useEffect } from "react";

export function useKeyboard(handlers) {
  useEffect(() => {
    const handleKey = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const isTyping = ["input", "textarea"].includes(tag);

      handlers.forEach(({ key, ctrl, shift, action, allowTyping }) => {
        if (!allowTyping && isTyping && !ctrl) return;
        const ctrlMatch = ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shift ? e.shiftKey : true;
        const keyMatch = e.key === key || e.code === key;
        if (ctrlMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          action(e);
        }
      });
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handlers]);
}
