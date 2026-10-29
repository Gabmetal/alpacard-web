import React, { useState } from 'react';
import {
  X,
  Mail,
  Trash2,
  Save,
  CheckCircle2,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api, clearMerchantToken, MerchantUser } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useToast, flashToast } from './Toast';
import { getWalletUrl } from '../utils/urls';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: MerchantUser;
  onUserUpdated: (user: MerchantUser) => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}: ProfileModalProps) {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const toast = useToast();

  const [name, setName] = useState(user.name || '');
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError(
        isEs
          ? 'La nueva contraseña debe tener al menos 6 caracteres'
          : 'New password must be at least 6 characters'
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError(isEs ? 'Las contraseñas no coinciden' : 'Passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      toast.success(isEs ? '¡Contraseña cambiada con éxito!' : 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowChangePassword(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError(isEs ? 'Error al cambiar la contraseña' : 'Failed to change password');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const updated = await api.updateProfile({ name: name.trim() });
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
      const res = await api.resendVerification(user.email);
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
      await api.deleteAccount();
      clearMerchantToken();
      flashToast(
        isEs
          ? 'Tu cuenta ha sido eliminada correctamente'
          : 'Your account has been successfully deleted',
        'success'
      );
      window.location.href = '/login';
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
              {user.name ? user.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEs ? 'Perfil y Cuenta de Comercio' : 'Merchant Profile & Account'}
              </h2>
              <p className="text-xs text-stone-300">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 text-stone-900 dark:text-stone-100 text-sm">
          {/* Verification Status */}
          {user.emailVerified ? (
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
                  ? 'Hemos enviado un enlace de confirmación a tu correo. Haz clic en el enlace para verificar tu cuenta de comercio.'
                  : 'We sent a verification link to your email. Click the link to confirm your merchant account.'}
              </p>
            </div>
          )}

          {/* Edit Name Form */}
          <form onSubmit={handleSaveName} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                {isEs ? 'Nombre del Administrador' : 'Administrator Name'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="block w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-[#3D2B1F] dark:focus:border-amber-400 focus:outline-none"
                placeholder="Jane Doe"
              />
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

          {/* Account Details Box */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
              <span>{isEs ? 'Rol de Plataforma' : 'Platform Role'}</span>
              <span className="font-bold text-stone-800 dark:text-stone-200 uppercase">
                {user.role === 'OWNER'
                  ? isEs
                    ? 'Dueño de Comercio (Owner)'
                    : 'Business Owner'
                  : isEs
                  ? 'Personal / Staff'
                  : 'Store Staff'}
              </span>
            </div>
            <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
              <span>{isEs ? 'Correo' : 'Email'}</span>
              <span className="font-medium text-stone-800 dark:text-stone-200 truncate max-w-[200px]">
                {user.email}
              </span>
            </div>
            <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
              <span>ID</span>
              <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
                {user.id ? `${user.id.substring(0, 8)}...` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Consumer Wallet Link */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-800/20 p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-amber-600" />
                {isEs ? 'Billetera de Clientes' : 'Customer Wallet'}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                {isEs ? 'Visualiza la experiencia del cliente' : 'View customer card experience'}
              </p>
            </div>
            <a
              href={getWalletUrl()}
              className="inline-flex items-center gap-1 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold px-3 py-1.5 text-xs transition"
            >
              <span>{isEs ? 'Abrir' : 'Open'}</span>
            </a>
          </div>

          {/* Security: Change Password */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-800/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-stone-900 dark:text-stone-100 font-bold text-xs">
                <Lock className="h-4 w-4 text-stone-600 dark:text-stone-400" />
                <span>{isEs ? 'Seguridad y Contraseña' : 'Security & Password'}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(!showChangePassword);
                  setPasswordError(null);
                }}
                className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline"
              >
                {showChangePassword
                  ? isEs
                    ? 'Cancelar'
                    : 'Cancel'
                  : isEs
                  ? 'Cambiar'
                  : 'Change'}
              </button>
            </div>

            {showChangePassword && (
              <form onSubmit={handleChangePassword} className="space-y-3 pt-2 border-t border-stone-200 dark:border-stone-800">
                {passwordError && (
                  <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-2.5 text-xs text-red-700 dark:text-red-300">
                    {passwordError}
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                    {isEs ? 'Contraseña Actual' : 'Current Password'}
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-2 text-xs focus:border-[#4A3525] dark:focus:border-amber-400 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                    {isEs ? 'Nueva Contraseña (mínimo 6 caracteres)' : 'New Password (min 6 chars)'}
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-2 text-xs focus:border-[#4A3525] dark:focus:border-amber-400 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                    {isEs ? 'Confirmar Nueva Contraseña' : 'Confirm New Password'}
                  </label>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-2 text-xs focus:border-[#4A3525] dark:focus:border-amber-400 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-[11px] text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 inline-flex items-center gap-1"
                  >
                    {showPasswords ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span>{showPasswords ? (isEs ? 'Ocultar' : 'Hide') : (isEs ? 'Mostrar' : 'Show')}</span>
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="rounded-xl bg-[#3D2B1F] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-[#2C1F16] transition disabled:opacity-50"
                  >
                    {passwordLoading
                      ? isEs
                        ? 'Guardando...'
                        : 'Saving...'
                      : isEs
                      ? 'Actualizar Contraseña'
                      : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Danger Zone: Autonomous Account Deletion */}
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-4 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
              <Trash2 className="h-4 w-4 shrink-0" />
              <span>{isEs ? 'Zona de Peligro' : 'Danger Zone'}</span>
            </div>
            <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 leading-relaxed">
              {isEs
                ? 'Puedes eliminar tu cuenta de forma autónoma. Tus membresías y accesos asociados serán revocados.'
                : 'You can autonomously delete your account. Associated memberships and access will be revoked.'}
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
                    ? '¿Confirmas la eliminación definitiva? Esta acción es irreversible.'
                    : 'Confirm permanent account deletion? This action is irreversible.'}
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
        </div>
      </div>
    </div>
  );
}
