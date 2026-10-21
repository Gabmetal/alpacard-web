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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-5">
              <Link to="/" className="flex items-center gap-2.5 shrink-0">
                <img
                  src="/alpacard-logo.jpg"
                  alt="Alpacard"
                  className="h-8 w-8 rounded-lg object-cover shadow-sm"
                />
                <span className="text-xl font-black text-indigo-600 tracking-tight">Alpacard</span>
              </Link>

              {/* Business Switcher Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 hover:bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-800 transition active:scale-95"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs"
                    style={{ backgroundColor: activeBusiness?.brandColor || '#4f46e5' }}
                  />
                  <span className="max-w-[130px] sm:max-w-[180px] truncate">
                    {activeBusiness?.name || (isEs ? 'Comercio' : 'Store')}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                </button>

                {dropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white p-2 shadow-2xl border border-gray-100 z-50 animate-in fade-in duration-100">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
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
                          className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-left transition ${
                            b.id === activeBusiness?.id
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {b.logoUrl ? (
                              <img
                                src={b.logoUrl}
                                alt={b.name}
                                className="h-5 w-5 rounded-md object-contain shrink-0 border border-gray-200"
                              />
                            ) : (
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: b.brandColor || '#4f46e5' }}
                              />
                            )}
                            <span className="truncate">{b.name}</span>
                          </div>
                          {b.id === activeBusiness?.id && (
                            <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="mt-2 border-t border-gray-100 pt-1.5 space-y-1">
                      <Link
                        to="/businesses"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                      >
                        <Palette className="h-3.5 w-3.5 text-indigo-600" />
                        <span>{isEs ? 'Personalizar Marca y Colores' : 'Manage Branding & Colors'}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          onCreateBusiness();
                        }}
                        className="flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition"
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
                    className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="light" />

              <Link
                to="/docs"
                className="hidden lg:inline-flex items-center text-xs font-semibold text-gray-500 hover:text-indigo-600 transition"
              >
                {t.nav.docs}
              </Link>
              <Link
                to="/demo"
                className="hidden lg:inline-flex items-center text-xs font-semibold text-gray-500 hover:text-indigo-600 transition"
              >
                {t.nav.liveDemo}
              </Link>
              <button
                onClick={() => {
                  clearMerchantToken();
                  onLogout();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                {t.nav.signOut}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden border-t border-gray-200 divide-x divide-gray-200 bg-white">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 py-3 text-center text-[11px] font-bold flex flex-col items-center gap-1 ${
                  isActive ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-500'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate max-w-[65px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
