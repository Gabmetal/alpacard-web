import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, setMerchantToken, clearMerchantToken } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import { ArrowLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { flashToast } from '../components/Toast';
import { setCookie } from '../utils/cookies';
import { getWalletUrl, getMerchantUrl, isMerchantHost } from '../utils/urls';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    const search = window.location.search;
    if (search.includes('mode=register')) {
      setMode('register');
    } else if (search.includes('mode=forgot')) {
      setMode('forgot');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (password.length < 6) {
        setError(
          isEs
            ? 'La contraseña debe tener al menos 6 caracteres'
            : 'Password must be at least 6 characters'
        );
        return;
      }
      if (password !== confirmPassword) {
        setError(isEs ? 'Las contraseñas no coinciden' : 'Passwords do not match');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'forgot') {
        await api.forgotPassword(email);
        setForgotSent(true);
        return;
      }

      let res;
      if (mode === 'register') {
        res = await api.register({ email, password, name, role: 'OWNER' });
      } else {
        res = await api.login({ email, password });
      }

      // Role Isolation: Consumer accounts must NOT enter merchant console
      if (res.user?.role === 'CONSUMER') {
        clearMerchantToken();
        setCookie('alpacard_wallet_token', res.token);
        try {
          localStorage.setItem('alpacard_wallet_token', res.token);
          localStorage.setItem('alpacard_wallet_user', JSON.stringify(res.user));
        } catch {
          // Ignore
        }
        flashToast(
          isEs
            ? '¡Bienvenido a tu Billetera! Sesión iniciada con éxito.'
            : 'Welcome to your Wallet! Signed in successfully.',
          'success'
        );
        window.location.href = getWalletUrl();
        return;
      }

      setMerchantToken(res.token);
      flashToast(
        mode === 'register'
          ? isEs
            ? '¡Cuenta creada con éxito! Hemos enviado un enlace a tu correo.'
            : 'Account created successfully! We sent a confirmation email.'
          : isEs
          ? '¡Bienvenido! Sesión iniciada con éxito.'
          : 'Welcome back! Signed in successfully.',
        'success'
      );

      // If user logged in from marketing domain (e.g. dev.alpacard.app), redirect directly to merchant subdomain!
      if (!isMerchantHost() && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        window.location.href = getMerchantUrl('/dashboard');
        return;
      }

      onLoginSuccess();
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] dark:bg-stone-950 px-4 py-8 text-stone-900 dark:text-stone-100 transition-colors">
      <div className="mb-4 flex items-center justify-between w-full max-w-md px-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.auth.backToHome}
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher variant="light" className="dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300" />
        </div>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm transition-colors">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <img
              src="/alpacard-logo.jpg"
              alt="Alpacard"
              className="mx-auto h-14 w-14 rounded-xl object-cover shadow-2xs border border-stone-200 dark:border-stone-700"
            />
          </Link>
          <h2 className="mt-4 text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            {mode === 'forgot'
              ? isEs
                ? 'Recuperar Contraseña'
                : 'Recover Password'
              : mode === 'register'
              ? t.auth.registerTitle
              : t.auth.signInTitle}
          </h2>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {mode === 'forgot'
              ? isEs
                ? 'Te enviaremos un enlace seguro para restablecer tu contraseña.'
                : "We'll send you a secure link to reset your password."
              : t.auth.tagline}
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-center text-xs text-red-700 dark:text-red-300 font-medium">
            {error}
          </div>
        )}

        {mode === 'forgot' && forgotSent ? (
          <div className="mt-6 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-5 text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
              {isEs ? '¡Enlace enviado!' : 'Reset Link Sent!'}
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
              {isEs
                ? `Si existe una cuenta asociada a ${email}, recibirás un correo con las instrucciones para crear una nueva contraseña en unos momentos.`
                : `If an account exists for ${email}, you will receive an email shortly with instructions to create a new password.`}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setForgotSent(false);
                  setError(null);
                }}
                className="w-full rounded-xl bg-[#3D2B1F] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-950 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#2C1F16] transition"
              >
                {isEs ? 'Volver al Inicio de Sesión' : 'Return to Sign In'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  {t.auth.fullNameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:border-[#4A3525] dark:focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-[#4A3525] dark:focus:ring-amber-400"
                  placeholder="Jane Doe"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                {t.auth.emailLabel}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:border-[#4A3525] dark:focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-[#4A3525] dark:focus:ring-amber-400"
                placeholder="owner@cafe.com"
              />
            </div>

            {mode !== 'forgot' && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      {t.auth.passwordLabel}
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError(null);
                        }}
                        className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition hover:underline"
                      >
                        {isEs ? '¿Olvidaste tu contraseña?' : 'Forgot password?'}
                      </button>
                    )}
                  </div>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 pr-10 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:border-[#4A3525] dark:focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-[#4A3525] dark:focus:ring-amber-400"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                      {isEs ? 'Confirmar Contraseña' : 'Confirm Password'}
                    </label>
                    <div className="relative mt-1">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 pr-10 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:border-[#4A3525] dark:focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-[#4A3525] dark:focus:ring-amber-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#3D2B1F] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-950 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#2C1F16] transition active:scale-[0.99] disabled:opacity-50"
            >
              {loading
                ? t.auth.processing
                : mode === 'forgot'
                ? isEs
                  ? 'Enviar Enlace de Recuperación'
                  : 'Send Reset Link'
                : mode === 'register'
                ? t.auth.registerBtn
                : t.auth.signInBtn}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-stone-500 dark:text-stone-400">
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setForgotSent(false);
              }}
              className="font-semibold text-[#5C4028] dark:text-amber-400 hover:text-[#3D2B1F] dark:hover:text-amber-300 transition hover:underline"
            >
              {isEs ? '← Volver a Iniciar Sesión' : '← Back to Sign In'}
            </button>
          ) : mode === 'register' ? (
            <>
              {t.auth.alreadyHaveAccount}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="font-semibold text-[#5C4028] dark:text-amber-400 hover:text-[#3D2B1F] dark:hover:text-amber-300 transition hover:underline"
              >
                {t.auth.switchToSignIn}
              </button>
            </>
          ) : (
            <>
              {t.auth.noAccountYet}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="font-semibold text-[#5C4028] dark:text-amber-400 hover:text-[#3D2B1F] dark:hover:text-amber-300 transition hover:underline"
              >
                {t.auth.switchToRegister}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
export default LoginPage;
