import { useState, useEffect } from 'react';
import { Plus, QrCode, X, RefreshCw } from 'lucide-react';
import QRCode from 'react-qr-code';
import { api } from '../services/api';

interface Campaign {
  id: string;
  name: string;
  description: string;
  stampsRequired: number;
  reward: string;
  isActive: boolean;
  cardsCount?: number;
}

interface CampaignsPageProps {
  businessId?: string;
}

export function CampaignsPage({ businessId }: CampaignsPageProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stampsRequired, setStampsRequired] = useState(10);
  const [reward, setReward] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // QR Preview Modal State
  const [qrModalCampaign, setQrModalCampaign] = useState<Campaign | null>(null);

  const loadCampaigns = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const data = await api.listCampaigns(businessId);
      setCampaigns(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch campaigns');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, [businessId]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setSubmitting(true);
    try {
      await api.createCampaign({
        businessId,
        name,
        description,
        stampsRequired: Number(stampsRequired),
        reward,
      });
      setShowModal(false);
      setName('');
      setDescription('');
      setReward('');
      loadCampaigns();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to create campaign');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Loyalty Campaigns</h2>
          <p className="text-xs text-gray-500">Configure stamp rules, rewards, and acquisition QR posters</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-xs text-red-600">
          {error}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <h3 className="text-sm font-bold text-gray-800">No campaigns created</h3>
          <p className="mt-1 text-xs text-gray-500">Create your first campaign to start issuing punch cards.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((camp) => (
            <div key={camp.id} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                    {camp.stampsRequired} Stamps
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    {camp.cardsCount || 0} Cards Active
                  </span>
                </div>
                <h3 className="mt-3 text-base font-bold text-gray-900">{camp.name}</h3>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">{camp.description}</p>
                <div className="mt-3 rounded-lg bg-gray-50 p-2 text-xs font-medium text-gray-700">
                  🎁 Reward: <strong>{camp.reward || 'Free Item'}</strong>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setQrModalCampaign(camp)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  <QrCode className="h-4 w-4" />
                  Print QR Poster
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-gray-900">Create New Campaign</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Coffee Club Loyalty"
                  className="mt-1 block w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Buy 9 coffees, get the 10th one on us!"
                  className="mt-1 block w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Stamps Required</label>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    required
                    value={stampsRequired}
                    onChange={(e) => setStampsRequired(Number(e.target.value))}
                    className="mt-1 block w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Reward Description</label>
                  <input
                    type="text"
                    required
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                    placeholder="Free Latte"
                    className="mt-1 block w-full rounded-xl border border-gray-300 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Poster Modal */}
      {qrModalCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <div className="flex justify-end">
              <button onClick={() => setQrModalCampaign(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Acquisition QR Poster</span>
            <h3 className="mt-1 text-xl font-black text-gray-900">{qrModalCampaign.name}</h3>
            <p className="mt-1 text-xs text-gray-500">Scan to join the loyalty program and collect stamps</p>

            <div className="mt-6 flex justify-center rounded-2xl bg-gray-50 p-6 border border-gray-100">
              <QRCode
                value={`${window.location.origin.replace('5173', '5174')}/claim/${qrModalCampaign.id}`}
                size={200}
              />
            </div>

            <p className="mt-4 text-[11px] text-gray-400 break-all">
              {`${window.location.origin.replace('5173', '5174')}/claim/${qrModalCampaign.id}`}
            </p>

            <button
              onClick={() => window.print()}
              className="mt-6 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-500"
            >
              Print Counter Poster
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
