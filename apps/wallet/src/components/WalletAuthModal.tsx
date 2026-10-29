import { useState } from 'react';
import { X, Sparkles, LogIn, UserPlus, AlertCircle, RefreshCw, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { walletApi, WalletUser } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useToast, flashToast } from './Toast';
import { getMerchantUrl } from '../utils/urls';

interface WalletAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: WalletUser) => void;
  defaultTab?: 'login' | 'register' | 'forgot';
}

export function WalletAuthModal({
  isOpen,
  onClose,
  onSuccess,
  defaultTab = 'login',
}: WalletAuthModalProps) {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const toast = useToast();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tab === 'forgot') {
      if (!email.trim()) {
        setError(isEs ? 'El correo es obligatorio' : 'Email is required');
        return;
      }
      setLoading(true);
      try {
        await walletApi.forgotPassword(email.trim());
        setForgotSent(true);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            isEs
              ? 'No pudimos procesar la solicitud de recuperación'
              : 'Failed to process password recovery request'
          );
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (tab === 'register') {
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
      if (tab === 'login') {
        const res = await walletApi.login({ email, password });
        if (res.user && (res.user.role === 'OWNER' || res.user.role === 'STAFF')) {
          localStorage.setItem('alpacard_merchant_token', res.token);
          flashToast(
            isEs
              ? '¡Bienvenido! Redirigiendo a tu Consola de Comercio...'
              : 'Welcome! Redirecting to Merchant Console...',
            'success'
          );
          window.location.href = getMerchantUrl('/dashboard');
          return;
        }
        onSuccess(res.user);
      } else {
        const res = await walletApi.register({ email, password, name });
        onSuccess(res.user);
        toast.success(
          isEs
            ? '¡Cuenta creada con éxito! Hemos enviado un enlace de confirmación a tu correo.'
            : 'Account created successfully! We sent a verification email to your inbox.',
          6000
        );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white border border-stone-200 shadow-2xl transition-all">
        {/* Header */}
        <div className="relative bg-[#2C221E] px-6 pt-6 pb-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-white/15 p-1.5 text-white/80 transition hover:bg-white/25 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs">
              {tab === 'forgot' ? (
                <KeyRound className="h-4 w-4 text-amber-300" />
              ) : (
                <Sparkles className="h-4 w-4 text-amber-300" />
              )}
            </div>
            <h2 className="text-lg font-bold">
              {tab === 'login'
                ? t.authModalTitleSignIn
                : tab === 'register'
                ? t.authModalTitleRegister
                : isEs
                ? 'Recuperar Contraseña'
                : 'Reset Password'}
            </h2>
          </div>
          <p className="mt-1 text-xs text-stone-300">
            {tab === 'login'
              ? t.authModalDescSignIn
              : tab === 'register'
              ? t.authModalDescRegister
              : isEs
              ? 'Ingresa tu correo para recibir un enlace de restablecimiento'
              : 'Enter your email to receive a password reset link'}
          </p>

          {/* Tab Switcher */}
          {tab !== 'forgot' ? (
            <div className="mt-4 flex rounded-xl bg-black/25 p-1">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                  tab === 'login'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-300 hover:text-white'
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
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                {t.authTabRegister}
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                  setForgotSent(false);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>{isEs ? 'Volver a iniciar sesión' : 'Back to sign in'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        {tab === 'forgot' && forgotSent ? (
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                {isEs ? '¡Correo enviado!' : 'Email sent!'}
              </h3>
              <p className="mt-1 text-xs text-stone-600 leading-relaxed">
                {isEs
                  ? `Si ${email} está registrado, recibirás un enlace para crear una nueva contraseña.`
                  : `If ${email} is registered, you will receive a link to set a new password.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setForgotSent(false);
                setError(null);
              }}
              className="w-full rounded-xl bg-[#3D2B1F] py-2.5 text-xs font-bold text-white transition hover:bg-[#2A1D15]"
            >
              {isEs ? 'Ir a Iniciar Sesión' : 'Back to Sign In'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {t.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isEs ? 'Ej. Juan Pérez' : 'e.g. John Doe'}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs font-medium text-stone-900 focus:border-[#4A3525] focus:outline-none focus:ring-1 focus:ring-[#4A3525] transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {t.emailLabel}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs font-medium text-stone-900 focus:border-[#4A3525] focus:outline-none focus:ring-1 focus:ring-[#4A3525] transition"
              />
            </div>

            {tab !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    {t.passwordLabel}
                  </label>
                  {tab === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setTab('forgot');
                        setError(null);
                        setForgotSent(false);
                      }}
                      className="text-[11px] font-semibold text-[#5C4028] hover:text-[#3D2B1F] hover:underline transition"
                    >
                      {isEs ? '¿Olvidaste tu contraseña?' : 'Forgot password?'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 pr-10 text-xs font-medium text-stone-900 focus:border-[#4A3525] focus:outline-none focus:ring-1 focus:ring-[#4A3525] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {isEs ? 'Confirmar Contraseña' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 pr-10 text-xs font-medium text-stone-900 focus:border-[#4A3525] focus:outline-none focus:ring-1 focus:ring-[#4A3525] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 transition"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#3D2B1F] py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#2A1D15] active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
              ) : tab === 'login' ? (
                t.signInBtn
              ) : tab === 'register' ? (
                t.registerBtn
              ) : (
                isEs ? 'Enviar Enlace de Recuperación' : 'Send Reset Link'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
