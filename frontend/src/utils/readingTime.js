export function getReadingTime(text) {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes;
}

export function detectLanguageName(code) {
  const names = {
    en: "English", fr: "French", ar: "Arabic",
    es: "Spanish", de: "German", it: "Italian",
    pt: "Portuguese", nl: "Dutch", zh: "Chinese",
  };
  return names[code] || code;
}
