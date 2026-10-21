import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'dark' | 'light';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'light', className = '' }) => {
  const { language, setLanguage } = useLanguage();

  const isDark = variant === 'dark';

  return (
    <div
      className={`inline-flex items-center rounded-lg p-0.5 text-xs font-semibold transition ${
        isDark
          ? 'bg-stone-800 border border-stone-700 text-stone-300'
          : 'bg-stone-100 border border-stone-200/80 text-stone-600'
      } ${className}`}
    >
      <Globe className={`h-3.5 w-3.5 ml-1.5 mr-1 ${isDark ? 'text-stone-400' : 'text-stone-400'}`} />
      
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-md transition ${
          language === 'en'
            ? isDark
              ? 'bg-stone-100 text-stone-900 shadow-2xs'
              : 'bg-white text-stone-900 shadow-2xs'
            : isDark
            ? 'hover:text-white'
            : 'hover:text-stone-900'
        }`}
        title="Switch to English"
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => setLanguage('es')}
        className={`px-2 py-1 rounded-md transition ${
          language === 'es'
            ? isDark
              ? 'bg-stone-100 text-stone-900 shadow-2xs'
              : 'bg-white text-stone-900 shadow-2xs'
            : isDark
            ? 'hover:text-white'
            : 'hover:text-stone-900'
        }`}
        title="Cambiar a Español"
      >
        ES
      </button>
    </div>
  );
};

export default LanguageSwitcher;