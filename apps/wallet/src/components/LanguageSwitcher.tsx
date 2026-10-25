import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-lg bg-stone-100 dark:bg-stone-800 p-0.5 text-xs font-bold text-stone-600 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700 shrink-0 ${className}`}
    >
      <Globe className="h-3.5 w-3.5 ml-1.5 mr-1 text-stone-400" />
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-1.5 py-1 rounded-md transition ${
          language === 'en'
            ? 'bg-white text-stone-900 shadow-2xs dark:bg-stone-700 dark:text-stone-100'
            : 'hover:text-stone-900 dark:hover:text-stone-100 text-stone-500 dark:text-stone-400'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('es')}
        className={`px-1.5 py-1 rounded-md transition ${
          language === 'es'
            ? 'bg-white text-stone-900 shadow-2xs dark:bg-stone-700 dark:text-stone-100'
            : 'hover:text-stone-900 dark:hover:text-stone-100 text-stone-500 dark:text-stone-400'
        }`}
      >
        ES
      </button>
    </div>
  );
};

export default LanguageSwitcher;
