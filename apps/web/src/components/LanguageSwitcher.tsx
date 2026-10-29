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
      className={`inline-flex items-center rounded-lg p-0.5 text-xs font-semibold transition shrink-0 ${
        isDark
          ? 'bg-stone-800 border border-stone-700 text-stone-300'
          : 'bg-stone-100 border border-stone-200/80 text-stone-600 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300'
      } ${className}`}
    >
      <Globe className="h-3.5 w-3.5 ml-1.5 mr-1 text-stone-400" />
      
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-md cursor-pointer transition ${
          language === 'en'
            ? isDark
              ? 'bg-stone-700 text-stone-100 shadow-2xs'
              : 'bg-white text-stone-900 shadow-2xs dark:bg-stone-700 dark:text-stone-100'
            : isDark
            ? 'hover:text-white'
            : 'hover:text-stone-900 dark:hover:text-stone-100 text-stone-500 dark:text-stone-400'
        }`}
        title="Switch to English"
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => setLanguage('es')}
        className={`px-2 py-1 rounded-md cursor-pointer transition ${
          language === 'es'
            ? isDark
              ? 'bg-stone-700 text-stone-100 shadow-2xs'
              : 'bg-white text-stone-900 shadow-2xs dark:bg-stone-700 dark:text-stone-100'
            : isDark
            ? 'hover:text-white'
            : 'hover:text-stone-900 dark:hover:text-stone-100 text-stone-500 dark:text-stone-400'
        }`}
        title="Cambiar a Español"
      >
        ES
      </button>
    </div>
  );
};

export default LanguageSwitcher;
