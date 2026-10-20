import { useState } from 'react';
import { X, Sparkles, LogIn, UserPlus, AlertCircle, RefreshCw } from 'lucide-react';
import { walletApi, WalletUser } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

interface WalletAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: WalletUser) => void;
  defaultTab?: 'login' | 'register';
}

export function WalletAuthModal({
  isOpen,
  onClose,
  onSuccess,
  defaultTab = 'login',
}: WalletAuthModalProps) {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await walletApi.login({ email, password });
        onSuccess(res.user);
      } else {
        const res = await walletApi.register({ email, password, name });
        onSuccess(res.user);
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(isEs ? 'Error en la autenticación' : 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 px-6 pt-6 pb-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-white/20 p-1.5 text-white/80 transition hover:bg-white/30 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <h2 className="text-lg font-bold">
              {tab === 'login' ? t.authModalTitleSignIn : t.authModalTitleRegister}
            </h2>
          </div>
          <p className="mt-1 text-xs text-indigo-100">
            {tab === 'login' ? t.authModalDescSignIn : t.authModalDescRegister}
          </p>

          {/* Tab Switcher */}
          <div className="mt-4 flex rounded-xl bg-black/20 p-1">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                tab === 'login'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-indigo-100 hover:text-white'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              {t.authTabSignIn}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                tab === 'register'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-indigo-100 hover:text-white'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              {t.authTabRegister}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t.nameLabel}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isEs ? 'Ej. Juan Pérez' : 'e.g. John Doe'}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t.emailLabel}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t.passwordLabel}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
            ) : tab === 'login' ? (
              t.signInBtn
            ) : (
              t.registerBtn
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
