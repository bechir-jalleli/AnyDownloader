import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';

export default function Header({ onReset, theme, onToggleTheme }) {
  const { i18n, t } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', flag: '🇹🇳' },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setShowLangMenu(false);
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'py-3' : 'py-5'}`}>
      <header className={`mx-auto max-w-[1500px] w-[94%] transition-all duration-500 rounded-[22px] px-6 flex items-center justify-between border transition-all duration-500 ${
        scrolled 
        ? 'bg-[var(--nav-bg)] backdrop-blur-xl border-[var(--border-tertiary)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[64px]' 
        : 'bg-transparent border-transparent h-[72px]'
      }`}>
        
        {/* Branding */}
        <div 
          className="flex items-center gap-3 cursor-pointer group select-none" 
          onClick={onReset}
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-transform group-hover:scale-105 active:scale-95">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight leading-none mb-0.5">VdDownloader</span>
            <span className="text-[10px] font-medium text-indigo-500/80 uppercase tracking-[0.2em] leading-none">Studio</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          {/* Language Control */}
          <div className="relative" ref={menuRef}>
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-[11px] tracking-wider uppercase border ${
                showLangMenu 
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' 
                : 'bg-[var(--surface-secondary)] border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
              }`}
              onClick={() => setShowLangMenu(!showLangMenu)}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.003 9.003 0 008.354-5.646z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>{i18n.language}</span>
              <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className={`transition-transform duration-300 ${showLangMenu ? 'rotate-180' : ''}`}>
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showLangMenu && (
              <div className="absolute top-full mt-3 right-0 w-48 bg-[var(--surface-primary)] border border-[var(--border-tertiary)] rounded-2xl shadow-2xl py-2 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs transition-colors
                      ${i18n.language === lang.code 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold' 
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base grayscale-[0.5]">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                    {i18n.language === lang.code && (
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-[var(--border-tertiary)] mx-1" />

          {/* Theme Toggle */}
          <button 
            className="w-10 h-10 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95 transition-all"
            onClick={onToggleTheme}
            title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
          >
            {theme === 'light' ? (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            )}
          </button>
        </div>
      </header>
    </div>
  );
}
