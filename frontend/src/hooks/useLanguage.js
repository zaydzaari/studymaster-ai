import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export function useLanguage() {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language?.slice(0, 2) || "en");

  const changeLanguage = (code) => {
    setLang(code);
    i18n.changeLanguage(code);
    const dir = code === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", code);
  };

  useEffect(() => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  return { lang, changeLanguage };
}
