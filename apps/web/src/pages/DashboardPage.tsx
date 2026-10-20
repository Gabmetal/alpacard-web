import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Users, CreditCard, Sparkles, ScanLine, RefreshCw, Plus } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

interface StatsData {
  campaignsCount: number;
  staffCount: number;
  cardsCount: number;
  totalStampsIssued: number;
  rewardsRedeemed: number;
  recentTransactions?: Array<{
    id: string;
    type: string;
    amount: number;
    tokenJti: string;
    createdAt: string;
    staff?: { name: string; email: string };
  }>;
}

interface DashboardPageProps {
  businessId?: string;
  onCreateBusiness: () => void;
}

export function DashboardPage({ businessId, onCreateBusiness }: DashboardPageProps) {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isEs = language === 'es';

  useEffect(() => {
    if (!businessId) return;
    async function loadStats() {
      try {
        setLoading(true);
        const data = await api.getStats(businessId!);
        setStats(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to fetch dashboard metrics');
        }
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [businessId]);

  if (!businessId) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">{t.dashboard.welcomeTitle}</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          {t.dashboard.welcomeDesc}
        </p>
        <button
          onClick={onCreateBusiness}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          {t.dashboard.createBusinessBtn}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  const statCards = [
    { label: isEs ? 'Campañas Activas' : 'Active Campaigns', value: stats?.campaignsCount || 0, icon: Award, color: 'text-indigo-600' },
    { label: isEs ? 'Personal Activo' : 'Staff Members', value: stats?.staffCount || 0, icon: Users, color: 'text-blue-600' },
    { label: isEs ? 'Tarjetas Emitidas' : 'Cards Issued', value: stats?.cardsCount || 0, icon: CreditCard, color: 'text-emerald-600' },
    { label: isEs ? 'Sellos Entregados' : 'Stamps Issued', value: stats?.totalStampsIssued || 0, icon: Sparkles, color: 'text-amber-500' },
    { label: isEs ? 'Premios Canjeados' : 'Rewards Redeemed', value: stats?.rewardsRedeemed || 0, icon: Sparkles, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white shadow-lg">
        <div>
          <h2 className="text-2xl font-black">{isEs ? 'Centro de Control del Comercio' : 'Merchant Control Center'}</h2>
          <p className="text-xs text-indigo-100 mt-0.5">
            {isEs ? 'Actividad de tarjetas de fidelidad y retención en tiempo real' : 'Real-time punch card activity and customer retention statistics'}
          </p>
        </div>
        <Link
          to="/scanner"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-600 shadow hover:bg-indigo-50 transition active:scale-95"
        >
          <ScanLine className="h-4 w-4" />
          {isEs ? 'Abrir Escáner QR' : 'Open QR Scanner'}
        </Link>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 truncate">{card.label}</span>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <p className="mt-3 text-3xl font-black text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">{t.dashboard.recentActivity}</h3>
        </div>
        {!stats?.recentTransactions || stats.recentTransactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400">
            {t.dashboard.noTransactionsYet}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3">{isEs ? 'Acción' : 'Action'}</th>
                  <th className="px-6 py-3">{isEs ? 'Personal' : 'Staff'}</th>
                  <th className="px-6 py-3">{isEs ? 'Cantidad' : 'Amount'}</th>
                  <th className="px-6 py-3">{isEs ? 'Hora' : 'Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-semibold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.type === 'EARN'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {tx.type === 'EARN' ? (isEs ? '+ SELLO' : '+ STAMP') : (isEs ? 'PREMIO CANJEADO' : 'REWARD REDEEMED')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-700">{tx.staff?.name || tx.staff?.email || (isEs ? 'Personal' : 'Staff')}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{tx.amount}</td>
                    <td className="px-6 py-3 text-gray-500">{new Date(tx.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
