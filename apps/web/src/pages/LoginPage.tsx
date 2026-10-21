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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] px-4 py-8 text-stone-900">
      <div className="mb-4 flex items-center justify-between w-full max-w-md px-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.auth.backToHome}
        </Link>
        <LanguageSwitcher variant="light" />
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 shadow-sm">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <img
              src="/alpacard-logo.jpg"
              alt="Alpacard"
              className="mx-auto h-14 w-14 rounded-xl object-cover shadow-2xs border border-stone-200"
            />
          </Link>
          <h2 className="mt-4 text-xl sm:text-2xl font-bold text-stone-900">
            {isRegister ? t.auth.registerTitle : t.auth.signInTitle}
          </h2>
          <p className="mt-1 text-xs text-stone-500">{t.auth.tagline}</p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-stone-700">
                {t.auth.fullNameLabel}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-[#4A3525] focus:outline-none focus:ring-1 focus:ring-[#4A3525]"
                placeholder="Jane Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700">
              {t.auth.emailLabel}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-[#4A3525] focus:outline-none focus:ring-1 focus:ring-[#4A3525]"
              placeholder="owner@cafe.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700">
              {t.auth.passwordLabel}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-[#4A3525] focus:outline-none focus:ring-1 focus:ring-[#4A3525]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#3D2B1F] py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#2C1F16] transition active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? t.auth.processing : isRegister ? t.auth.registerBtn : t.auth.signInBtn}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-stone-500">
          {isRegister ? t.auth.alreadyHaveAccount : t.auth.noAccountYet}{' '}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="font-semibold text-[#5C4028] hover:text-[#3D2B1F] transition hover:underline"
          >
            {isRegister ? t.auth.switchToSignIn : t.auth.switchToRegister}
          </button>
        </div>
      </div>
    </div>
  );
}
