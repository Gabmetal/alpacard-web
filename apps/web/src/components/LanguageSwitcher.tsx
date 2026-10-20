import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'dark' | 'light';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'dark', className = '' }) => {
  const { language, setLanguage } = useLanguage();

  const isDark = variant === 'dark';

  return (
    <div
      className={`inline-flex items-center rounded-xl p-1 text-xs font-bold transition ${
        isDark
          ? 'bg-slate-800/80 border border-slate-700/80 text-slate-300'
          : 'bg-gray-100 border border-gray-200 text-gray-700'
      } ${className}`}
    >
      <Globe className={`h-3.5 w-3.5 ml-1 mr-1.5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
      
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-lg transition ${
          language === 'en'
            ? isDark
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-indigo-600 shadow-sm'
            : isDark
            ? 'hover:text-white'
            : 'hover:text-gray-900'
        }`}
        title="Switch to English"
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => setLanguage('es')}
        className={`px-2 py-1 rounded-lg transition ${
          language === 'es'
            ? isDark
              ? 'bg-indigo-600 text-white shadow'
              : 'bg-white text-indigo-600 shadow-sm'
            : isDark
            ? 'hover:text-white'
            : 'hover:text-gray-900'
        }`}
        title="Cambiar a Español"
      >
        ES
      </button>
    </div>
  );
};

export default LanguageSwitcher;