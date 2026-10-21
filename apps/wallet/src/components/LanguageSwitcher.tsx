import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-xl bg-stone-100 p-0.5 text-xs font-bold text-stone-600 border border-stone-200 ${className}`}
    >
      <Globe className="h-3 w-3 ml-1 mr-1 text-stone-400" />
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-1.5 py-0.5 rounded-lg transition ${
          language === 'en' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('es')}
        className={`px-1.5 py-0.5 rounded-lg transition ${
          language === 'es' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
        }`}
      >
        ES
      </button>
    </div>
  );
};

export default LanguageSwitcher;