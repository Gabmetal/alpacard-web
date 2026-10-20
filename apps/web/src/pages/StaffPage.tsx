import { useState, useEffect } from 'react';
import { UserPlus, Trash2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface StaffPageProps {
  businessId?: string;
}

export function StaffPage({ businessId }: StaffPageProps) {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStaff = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const data = await api.listStaff(businessId);
      setStaff(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch staff');
      }
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Staff Members</h2>
        <p className="text-xs text-gray-500">
          Staff members are authorized to scan customer QR codes and validate rewards
        </p>
      </div>

      {/* Add Staff Card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Invite Team Member</h3>
        <form onSubmit={handleAddStaff} className="flex gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="barista@yourcafe.com"
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {submitting ? 'Adding...' : 'Add Staff'}
          </button>
        </form>
        {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}
      </div>

      {/* Staff Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : staff.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            No staff members added yet. Add team members to let them scan loyalty cards.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {staff.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">{member.name || member.email}</h4>
                  <p className="text-[11px] text-gray-500">{member.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                    {member.role}
                  </span>
                  <button
                    onClick={() => handleRemoveStaff(member.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
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
