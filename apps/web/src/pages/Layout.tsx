import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Award, Users, ScanLine, LogOut } from 'lucide-react';
import { clearMerchantToken } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

interface LayoutProps {
  onLogout: () => void;
  businessName?: string;
}

export function Layout({ onLogout, businessName }: LayoutProps) {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { label: t.nav.dashboard, path: '/dashboard', icon: LayoutDashboard },
    { label: t.nav.campaigns, path: '/campaigns', icon: Award },
    { label: t.nav.staff, path: '/staff', icon: Users },
    { label: t.nav.scanner, path: '/scanner', icon: ScanLine },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2.5">
                <img src="/alpacard-logo.jpg" alt="Alpacard" className="h-8 w-8 rounded-lg object-cover shadow-sm" />
                <span className="text-xl font-black text-indigo-600 tracking-tight">Alpacard</span>
              </Link>
              {businessName && (
                <span className="hidden sm:inline-block rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  {businessName}
                </span>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition ${
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
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
                className={`flex-1 py-3 text-center text-xs font-semibold flex flex-col items-center gap-1 ${
                  isActive ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-500'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
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
