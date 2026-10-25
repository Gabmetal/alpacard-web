import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Award,
  Users,
  ScanLine,
  LogOut,
  Store,
  ChevronDown,
  Check,
  Plus,
  Palette,
} from 'lucide-react';
import { clearMerchantToken } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import { BusinessItem } from './BusinessesPage';

interface LayoutProps {
  onLogout: () => void;
  businesses: BusinessItem[];
  activeBusiness: BusinessItem | null;
  onSelectBusiness: (biz: BusinessItem) => void;
  onCreateBusiness: () => void;
}

export function Layout({
  onLogout,
  businesses,
  activeBusiness,
  onSelectBusiness,
  onCreateBusiness,
}: LayoutProps) {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: t.nav.dashboard, path: '/dashboard', icon: LayoutDashboard },
    { label: t.nav.campaigns, path: '/campaigns', icon: Award },
    { label: t.nav.businesses, path: '/businesses', icon: Store },
    { label: t.nav.staff, path: '/staff', icon: Users },
    { label: t.nav.scanner, path: '/scanner', icon: ScanLine },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors">
      {/* Top Bar */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 sticky top-0 z-20 transition-colors">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center gap-2">
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              <Link to="/" className="flex items-center gap-2 shrink-0">
                <img
                  src="/alpacard-logo.jpg"
                  alt="Alpacard"
                  className="h-8 w-8 rounded-lg object-cover border border-stone-200 dark:border-stone-700 shadow-2xs"
                />
                <span className="hidden xs:inline text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Alpacard
                </span>
              </Link>

              {/* Business Switcher Dropdown */}
              <div className="relative min-w-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-750 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 transition active:scale-[0.99]"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: activeBusiness?.brandColor || '#4A3525' }}
                  />
                  <span className="max-w-[110px] sm:max-w-[170px] truncate">
                    {activeBusiness?.name || (isEs ? 'Comercio' : 'Store')}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 sm:w-72 rounded-2xl bg-white dark:bg-stone-900 p-2 shadow-xl border border-stone-200 dark:border-stone-800 z-50">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase text-stone-400 tracking-wider">
                      {t.businesses.allStores}
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {businesses.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            onSelectBusiness(b);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-left transition ${
                            b.id === activeBusiness?.id
                              ? 'bg-[#F5EFE6] text-[#3D2B1F] font-semibold'
                              : 'text-stone-700 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {b.logoUrl ? (
                              <img
                                src={b.logoUrl}
                                alt={b.name}
                                className="h-5 w-5 rounded-md object-contain shrink-0 border border-stone-200"
                              />
                            ) : (
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: b.brandColor || '#4A3525' }}
                              />
                            )}
                            <span className="truncate">{b.name}</span>
                          </div>
                          {b.id === activeBusiness?.id && (
                            <Check className="h-3.5 w-3.5 text-[#5C4028] shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 border-t border-stone-100 pt-1.5 space-y-1">
                      <Link
                        to="/businesses"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                      >
                        <Palette className="h-3.5 w-3.5 text-[#5C4028]" />
                        <span>
                          {isEs ? 'Personalizar Marca y Colores' : 'Manage Branding & Colors'}
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          onCreateBusiness();
                        }}
                        className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs font-semibold text-[#5C4028] hover:bg-[#F5EFE6]/60 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{t.businesses.createBusiness}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition ${
                      isActive
                        ? 'bg-[#F5EFE6] text-[#3D2B1F]'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <ThemeToggle />
              <LanguageSwitcher variant="light" className="dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300" />

              <Link
                to="/docs"
                className="hidden lg:inline-flex items-center text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition"
              >
                {t.nav.docs}
              </Link>
              <Link
                to="/demo"
                className="hidden lg:inline-flex items-center text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition"
              >
                {t.nav.liveDemo}
              </Link>
              <button
                onClick={() => {
                  clearMerchantToken();
                  onLogout();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
                title={t.nav.signOut}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.nav.signOut}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden border-t border-stone-200 dark:border-stone-800 divide-x divide-stone-200/70 dark:divide-stone-800 bg-white dark:bg-stone-900 overflow-x-auto scrollbar-none transition-colors">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 min-w-[68px] py-2.5 px-1 text-center text-[11px] font-semibold flex flex-col items-center gap-1 transition ${
                  isActive
                    ? 'text-[#3D2B1F] dark:text-amber-400 bg-[#F5EFE6]/70 dark:bg-stone-800 border-b-2 border-[#3D2B1F] dark:border-amber-400'
                    : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate max-w-[72px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
