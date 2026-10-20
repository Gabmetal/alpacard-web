import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, setMerchantToken } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { t } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('mode=register')) {
      setIsRegister(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let res;
      if (isRegister) {
        res = await api.register({ email, password, name, role: 'OWNER' });
      } else {
        res = await api.login({ email, password });
      }

      setMerchantToken(res.token);
      onLoginSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 py-8">
      <div className="mb-4 flex items-center justify-between w-full max-w-md px-1">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" />
          {t.auth.backToHome}
        </Link>
        <LanguageSwitcher variant="dark" />
      </div>

      <div className="w-full max-w-md rounded-3xl bg-slate-800/90 border border-slate-700/80 p-8 shadow-2xl backdrop-blur-md">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <img
              src="/alpacard-logo.jpg"
              alt="Alpacard"
              className="mx-auto h-16 w-16 rounded-2xl object-cover shadow-lg border border-indigo-500/30"
            />
          </Link>
          <h2 className="mt-4 text-2xl font-black text-white">
            {isRegister ? t.auth.registerTitle : t.auth.signInTitle}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {t.auth.tagline}
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-400 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300">{t.auth.fullNameLabel}</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Jane Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300">{t.auth.emailLabel}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="owner@cafe.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">{t.auth.passwordLabel}</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? t.auth.processing : isRegister ? t.auth.registerBtn : t.auth.signInBtn}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          {isRegister ? t.auth.alreadyHaveAccount : t.auth.noAccountYet}{' '}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="font-bold text-indigo-400 hover:text-indigo-300 transition hover:underline"
          >
            {isRegister ? t.auth.switchToSignIn : t.auth.switchToRegister}
          </button>
        </div>
      </div>
    </div>
  );
}
