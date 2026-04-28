import { useState } from "react";

export function useHistory() {
  const [history, setHistory] = useState(() => {
    const stored = localStorage.getItem("sm-history");
    return stored ? JSON.parse(stored) : [];
  });

  const addEntry = (content, type = "text") => {
    const entry = {
      id: Date.now(),
      content: content.slice(0, 100),
      type,
      date: new Date().toISOString(),
    };
    setHistory(prev => {
      const next = [entry, ...prev.filter(e => e.content !== entry.content)].slice(0, 3);
      localStorage.setItem("sm-history", JSON.stringify(next));
      return next;
    });
  };

  const removeEntry = (id) => {
    setHistory(prev => {
      const next = prev.filter(e => e.id !== id);
      localStorage.setItem("sm-history", JSON.stringify(next));
      return next;
    });
  };

  return { history, addEntry, removeEntry };
}
