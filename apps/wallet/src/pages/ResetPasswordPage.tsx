import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { walletApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useToast } from '../components/Toast';

export function ResetPasswordPage() {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
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
      await walletApi.resetPassword({ token, password });
      setSuccess(true);
      toast.success(
        isEs
          ? '¡Contraseña restablecida con éxito! Bienvenido a tu billetera.'
          : 'Password reset successfully! Welcome back to your wallet.',
        5000
      );

      setTimeout(() => {
        navigate('/');
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
      <div className="mb-4 flex items-center justify-start w-full max-w-md px-1">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {isEs ? 'Volver a la billetera' : 'Back to wallet'}
        </Link>
      </div>

      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl transition-all">
        {/* Header */}
        <div className="relative bg-[#2C221E] dark:bg-stone-950 px-6 pt-8 pb-6 text-white text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xs">
            <KeyRound className="h-6 w-6 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            {isEs ? 'Nueva Contraseña' : 'New Password'}
          </h1>
          <p className="mt-1 text-xs text-stone-300">
            {isEs
              ? 'Introduce tu nueva contraseña para acceder a tus tarjetas'
              : 'Enter your new password to access your cards'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="py-6 text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {isEs ? '¡Contraseña actualizada!' : 'Password updated!'}
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                {isEs
                  ? 'Redirigiendo a tu billetera...'
                  : 'Redirecting to your wallet...'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 p-3 text-xs text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  {isEs ? 'Nueva Contraseña' : 'New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 pr-10 text-xs font-medium text-stone-900 dark:text-stone-100 focus:border-[#4A3525] dark:focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-[#4A3525] dark:focus:ring-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  {isEs ? 'Confirmar Nueva Contraseña' : 'Confirm New Password'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 pr-10 text-xs font-medium text-stone-900 dark:text-stone-100 focus:border-[#4A3525] dark:focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-[#4A3525] dark:focus:ring-amber-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#3D2B1F] dark:bg-amber-500 py-3 text-xs font-bold text-white dark:text-stone-950 shadow-sm transition hover:bg-[#2A1D15] dark:hover:bg-amber-400 active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {loading
                  ? isEs
                    ? 'Restableciendo...'
                    : 'Resetting...'
                  : isEs
                  ? 'Guardar Contraseña'
                  : 'Save Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
