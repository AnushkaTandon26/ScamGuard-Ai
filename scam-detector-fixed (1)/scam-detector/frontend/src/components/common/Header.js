import React from "react";
import { MdNotifications, MdSearch } from "react-icons/md";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हिं" },
  { code: "mr", label: "मरा" },
];

export default function Header({ title, subtitle }) {
  const { i18n } = useTranslation();

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("language", code);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4
                        border-b border-slate-700/60 bg-slate-900/50 backdrop-blur-sm">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-3">
        {/* Language switcher */}
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              onClick={() => changeLanguage(code)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200
                ${i18n.language === code
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Notification bell */}
        <button className="relative w-9 h-9 bg-slate-800 border border-slate-700 rounded-xl
                           flex items-center justify-center text-slate-400 hover:text-white
                           hover:border-slate-600 transition-all">
          <MdNotifications size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
