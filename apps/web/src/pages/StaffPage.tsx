import { useState, useEffect } from 'react';
import { UserPlus, Trash2, RefreshCw, Users, Plus } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface StaffPageProps {
  businessId?: string;
  onCreateBusiness?: () => void;
}

export function StaffPage({ businessId, onCreateBusiness }: StaffPageProps) {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = async () => {
    if (!businessId) {
      setStaff([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await api.listStaff(businessId);
      setStaff(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch staff');
      }
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [businessId]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !email) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.addStaff(businessId, email);
      setEmail('');
      loadStaff();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add staff');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!businessId) return;
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await api.removeStaff(businessId, staffId);
      loadStaff();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to remove staff');
      }
    }
  };

  if (!businessId) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
            {isEs ? 'Equipo y Personal' : 'Staff Members'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500">
            {isEs
              ? 'Los miembros del personal pueden escanear tarjetas y validar recompensas.'
              : 'Staff members are authorized to scan customer QR codes and validate rewards.'}
          </p>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-white p-10 sm:p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#4A3525] mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-800">
            {isEs ? 'No tienes una tienda seleccionada' : 'No store selected'}
          </h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto">
            {isEs
              ? 'Crea o selecciona una tienda para gestionar el equipo y autorizar escaneos.'
              : 'Create or select a store to manage team members and authorize card scans.'}
          </p>
          {onCreateBusiness && (
            <button
              onClick={onCreateBusiness}
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#3D2B1F] px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#2C1F16]"
            >
              <Plus className="h-4 w-4" />
              {isEs ? 'Crear Tienda' : 'Create Store'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
          {isEs ? 'Equipo y Personal' : 'Staff Members'}
        </h2>
        <p className="text-xs sm:text-sm text-stone-500">
          {isEs
            ? 'Los miembros del personal pueden escanear tarjetas y validar recompensas.'
            : 'Staff members are authorized to scan customer QR codes and validate rewards.'}
        </p>
      </div>

      {/* Add Staff Card */}
      <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-2xs border border-stone-200">
        <h3 className="text-sm font-bold text-stone-900 mb-3">Invite Team Member</h3>
        <form onSubmit={handleAddStaff} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="barista@yourcafe.com"
            className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2.5 text-xs focus:border-[#4A3525] focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#3D2B1F] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#2C1F16] disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {submitting ? 'Adding...' : 'Add Staff'}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-red-600 font-medium">{error}</p>}
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl bg-white shadow-2xs border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-[#5C4028]" />
          </div>
        ) : staff.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            No staff members added yet. Add team members to let them scan loyalty cards.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {staff.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 hover:bg-stone-50/70 gap-3"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-stone-900 truncate">
                    {member.name || member.email}
                  </h4>
                  <p className="text-[11px] text-stone-500 truncate">{member.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="rounded-md bg-[#F5EFE6] border border-[#E6D9C6] px-2 py-0.5 text-[10px] font-semibold text-[#4A3525]">
                    {member.role}
                  </span>
                  <button
                    onClick={() => handleRemoveStaff(member.id)}
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600"
                    title="Remove staff"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
