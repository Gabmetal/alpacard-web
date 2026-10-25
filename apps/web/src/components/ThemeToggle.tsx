import React from 'react';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { mode, setTheme } = useTheme();
  const { language } = useLanguage();
  const isEs = language === 'es';

  const options: { mode: ThemeMode; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { mode: 'light', icon: Sun, label: isEs ? 'Claro' : 'Light' },
    { mode: 'dark', icon: Moon, label: isEs ? 'Oscuro' : 'Dark' },
    { mode: 'system', icon: Monitor, label: isEs ? 'Automático' : 'Auto' },
  ];

  return (
    <div
      role="group"
      aria-label="Theme mode"
      className={`inline-flex items-center rounded-lg p-0.5 text-xs font-semibold bg-stone-100 border border-stone-200/80 text-stone-600 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300 transition-colors ${className}`}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = mode === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            onClick={() => setTheme(opt.mode)}
            title={`${opt.label}${opt.mode === 'system' ? (isEs ? ' (según tu sistema)' : ' (follows system)') : ''}`}
            aria-pressed={isActive}
            className={`flex items-center gap-1 px-1.5 py-1 rounded-md transition-all ${
              isActive
                ? 'bg-white text-stone-900 shadow-2xs dark:bg-stone-700 dark:text-stone-100'
                : 'hover:text-stone-900 dark:hover:text-stone-100 text-stone-500 dark:text-stone-400'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:text-[11px] pr-0.5">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};
