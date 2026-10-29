import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { api, setMerchantToken } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import { flashToast } from '../components/Toast';
import { getMerchantUrl, isMerchantHost } from '../utils/urls';

export function ResetPasswordPage() {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(
        isEs
          ? 'Token de restablecimiento no proporcionado o inválido'
          : 'Missing or invalid password reset token'
      );
      return;
    }

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

    setLoading(true);
    try {
      const res = await api.resetPassword({ token, password });
      setSuccess(true);
      if (res.token) {
        setMerchantToken(res.token);
      }
      flashToast(
        isEs
          ? '¡Contraseña restablecida con éxito! Bienvenido.'
          : 'Password reset successfully! Welcome back.',
        'success'
      );

      setTimeout(() => {
        if (!isMerchantHost() && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          window.location.href = getMerchantUrl('/dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          isEs
            ? 'Error al restablecer la contraseña. El enlace puede haber expirado.'
            : 'Failed to reset password. The link may have expired.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] dark:bg-stone-950 px-4 py-8 text-stone-900 dark:text-stone-100 transition-colors">
      <div className="mb-4 flex items-center justify-between w-full max-w-md px-1">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEs ? 'Volver al inicio de sesión' : 'Back to sign in'}
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher variant="light" className="dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300" />
        </div>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 sm:p-8 shadow-sm transition-colors">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 mb-3 border border-amber-200 dark:border-amber-900/50">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
            {isEs ? 'Restablecer Contraseña' : 'Reset Password'}
          </h2>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            {isEs
              ? 'Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.'
              : 'Enter your new password to regain access to your account.'}
          </p>
        </div>

        {!token ? (
          <div className="mt-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-center">
            <p className="text-xs text-red-700 dark:text-red-300 font-medium">
              {isEs
                ? 'El enlace de restablecimiento es inválido o no contiene un token.'
                : 'Invalid password reset link. No token was provided.'}
            </p>
            <Link
              to="/login"
              className="mt-3 inline-block rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 px-4 py-2 text-xs font-bold transition hover:bg-stone-800"
            >
              {isEs ? 'Ir al Inicio de Sesión' : 'Go to Sign In'}
            </Link>
          </div>
        ) : success ? (
          <div className="mt-6 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-5 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              {isEs ? '¡Contraseña actualizada!' : 'Password updated!'}
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              {isEs
                ? 'Redirigiendo a tu panel de control...'
                : 'Redirecting to your dashboard...'}
            </p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-center text-xs text-red-700 dark:text-red-300 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  {isEs ? 'Nueva Contraseña' : 'New Password'}
                </label>
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

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  {isEs ? 'Confirmar Nueva Contraseña' : 'Confirm New Password'}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#3D2B1F] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-950 py-3 text-sm font-semibold text-white shadow-xs hover:bg-[#2C1F16] transition active:scale-[0.99] disabled:opacity-50"
              >
                {loading
                  ? isEs
                    ? 'Actualizando contraseña...'
                    : 'Updating password...'
                  : isEs
                  ? 'Guardar Nueva Contraseña'
                  : 'Save New Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
export default ResetPasswordPage;
