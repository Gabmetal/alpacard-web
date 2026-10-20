import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-xl bg-indigo-700/60 p-0.5 text-xs font-bold text-indigo-100 border border-indigo-400/30 ${className}`}
    >
      <Globe className="h-3 w-3 ml-1 mr-1 text-indigo-200" />
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-1.5 py-0.5 rounded-lg transition ${
          language === 'en' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('es')}
        className={`px-1.5 py-0.5 rounded-lg transition ${
          language === 'es' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-white'
        }`}
      >
        ES
      </button>
    </div>
  );
};

export default LanguageSwitcher;