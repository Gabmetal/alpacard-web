import React, { useState } from 'react';
import {
  X,
  Mail,
  AlertTriangle,
  Trash2,
  Save,
  CheckCircle2,
  ExternalLink,
  Store,
} from 'lucide-react';
import { walletApi, WalletUser } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useToast } from './Toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: WalletUser;
  onUserUpdated: (user: WalletUser) => void;
  onAccountDeleted: () => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onAccountDeleted,
}: ProfileModalProps) {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const toast = useToast();

  const [name, setName] = useState(user.name || '');
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const updated = await walletApi.updateProfile({ name: name.trim() });
      onUserUpdated(updated);
      toast.success(isEs ? 'Perfil actualizado correctamente' : 'Profile updated successfully');
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : isEs
          ? 'Error al actualizar el perfil'
          : 'Failed to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const res = await walletApi.resendVerification(user.email);
      toast.success(
        res.message ||
          (isEs
            ? 'Correo de verificación reenviado. Revisa tu bandeja de entrada.'
            : 'Verification email sent. Check your inbox.')
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : isEs
          ? 'Error al reenviar el correo'
          : 'Failed to resend email'
      );
    } finally {
      setResending(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await walletApi.deleteAccount();
      toast.success(
        isEs
          ? 'Tu cuenta y tarjetas han sido eliminadas correctamente'
          : 'Your account and loyalty cards have been permanently deleted'
      );
      onAccountDeleted();
      onClose();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : isEs
          ? 'Error al eliminar la cuenta'
          : 'Failed to delete account'
      );
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative bg-[#2C221E] dark:bg-stone-950 px-6 pt-6 pb-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-white/15 p-1.5 text-white/80 transition hover:bg-white/25 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-stone-950 font-black text-xl shadow-xs">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEs ? 'Mi Perfil y Ajustes' : 'My Profile & Settings'}
              </h2>
              <p className="text-xs text-stone-300">
                {user.email || (isEs ? 'Cuenta Anónima' : 'Anonymous Account')}
              </p>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-900 dark:text-stone-100 text-sm">
          {/* Verification Status */}
          {user.isAnonymous ? (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-3.5 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{isEs ? 'Billetera Invitado' : 'Guest Wallet'}</span>
              </div>
              <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                {isEs
                  ? 'Tus tarjetas están guardadas en este dispositivo. Inicia sesión o regístrate para sincronizarlas permanentemente.'
                  : 'Your cards are stored locally on this device. Sign in or register to sync them permanently.'}
              </p>
            </div>
          ) : user.emailVerified ? (
            <div className="flex items-center justify-between rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3.5 text-xs text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">
                  {isEs ? 'Correo Electrónico Verificado' : 'Email Address Verified'}
                </span>
              </div>
              <span className="rounded-lg bg-emerald-200/60 dark:bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                ✓ OK
              </span>
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{isEs ? 'Correo Pendiente de Verificación' : 'Email Pending Verification'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1 text-[11px] transition disabled:opacity-50"
                >
                  {resending
                    ? isEs
                      ? 'Enviando...'
                      : 'Sending...'
                    : isEs
                    ? 'Reenviar Enlace'
                    : 'Resend Link'}
                </button>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80 leading-relaxed">
                {isEs
                  ? 'Hemos enviado un enlace de confirmación a tu correo. Haz clic en el enlace para verificar tu cuenta.'
                  : 'We sent a verification link to your email. Click the link to confirm your account.'}
              </p>
            </div>
          )}

          {/* Edit Name Form */}
          {!user.isAnonymous && (
            <form onSubmit={handleSaveName} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  {isEs ? 'Nombre Completo' : 'Full Name'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="block w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-[#3D2B1F] dark:focus:border-amber-400 focus:outline-none"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving || !name.trim() || name.trim() === user.name}
                className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#3D2B1F] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-950 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#2A1D15] transition disabled:opacity-40"
              >
                <Save className="h-3.5 w-3.5" />
                <span>
                  {saving
                    ? isEs
                      ? 'Guardando...'
                      : 'Saving...'
                    : isEs
                    ? 'Guardar Cambios'
                    : 'Save Changes'}
                </span>
              </button>
            </form>
          )}

          {/* Account Details Box */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
              <span>{isEs ? 'Rol de Cuenta' : 'Account Role'}</span>
              <span className="font-bold text-stone-800 dark:text-stone-200 uppercase">
                {user.role === 'CONSUMER'
                  ? isEs
                    ? 'Cliente (Billetera)'
                    : 'Customer (Wallet)'
                  : user.role}
              </span>
            </div>
            {user.email && (
              <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                <span>{isEs ? 'Correo' : 'Email'}</span>
                <span className="font-medium text-stone-800 dark:text-stone-200 truncate max-w-[200px]">
                  {user.email}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
              <span>ID</span>
              <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
                {user.id ? `${user.id.substring(0, 8)}...` : 'Local'}
              </span>
            </div>
          </div>

          {/* Merchant Console Link (only for OWNER/STAFF) */}
          {(user.role === 'OWNER' || user.role === 'STAFF') && (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-amber-600" />
                  {isEs ? 'Consola de Comercio' : 'Merchant Console'}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                  {isEs ? 'Administra tus comercios y campañas' : 'Manage your stores & campaigns'}
                </p>
              </div>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1.5 text-xs transition"
              >
                <span>{isEs ? 'Ir al Panel' : 'Go to Panel'}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Danger Zone: Autonomous Account Deletion */}
          {!user.isAnonymous && (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
                <Trash2 className="h-4 w-4 shrink-0" />
                <span>{isEs ? 'Zona de Peligro' : 'Danger Zone'}</span>
              </div>
              <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 leading-relaxed">
                {isEs
                  ? 'Puedes eliminar tu cuenta de forma autónoma. Se borrarán permanentemente tus tarjetas de fidelidad y sellos.'
                  : 'You can autonomously delete your account. All your loyalty cards and collected stamps will be permanently deleted.'}
              </p>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full rounded-xl border border-rose-300 dark:border-rose-800 py-2 px-3 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition"
                >
                  {isEs ? 'Eliminar mi Cuenta' : 'Delete My Account'}
                </button>
              ) : (
                <div className="rounded-xl bg-white dark:bg-stone-900 p-3 border border-rose-300 dark:border-rose-800 space-y-2">
                  <p className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                    {isEs
                      ? '¿Confirmas la eliminación definitiva? Esta acción no se puede deshacer.'
                      : 'Confirm permanent account deletion? This action cannot be undone.'}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      className="flex-1 rounded-lg border border-stone-300 dark:border-stone-700 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                    >
                      {isEs ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-700 py-1.5 text-xs font-bold text-white transition disabled:opacity-50"
                    >
                      {deleting
                        ? isEs
                          ? 'Eliminando...'
                          : 'Deleting...'
                        : isEs
                        ? 'Sí, Eliminar'
                        : 'Yes, Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
