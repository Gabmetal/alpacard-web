import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Users,
  CreditCard,
  Sparkles,
  ScanLine,
  RefreshCw,
  Plus,
  Gift,
  ShieldCheck,
  User,
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

interface StatsData {
  campaignsCount: number;
  staffCount: number;
  cardsCount: number;
  totalStampsIssued: number;
  rewardsRedeemed: number;
  totalCustomers?: number;
  registeredCustomers?: number;
  recentTransactions?: Array<{
    id: string;
    type: string;
    amount: number;
    tokenJti: string;
    createdAt: string;
    clientName?: string;
    clientEmail?: string;
    customer?: { id: string; name: string; email: string; isAnonymous: boolean };
    card?: {
      id: string;
      user?: { id: string; name: string; email: string; isAnonymous: boolean };
      campaign?: { name: string };
    };
    staff?: { name: string; email: string };
  }>;
}

interface DashboardPageProps {
  businessId?: string;
  onCreateBusiness: () => void;
}

function getClientDisplay(
  tx: NonNullable<StatsData['recentTransactions']>[number],
  isEs: boolean
) {
  const user = tx.customer || tx.card?.user;
  if (user) {
    if (!user.isAnonymous && user.name) {
      return {
        name: user.name,
        email: user.email,
        isGuest: false,
      };
    }
    if (user.isAnonymous) {
      const shortId = user.email ? user.email.replace('guest_', '').split('@')[0] : user.id.slice(0, 6);
      return {
        name: `${isEs ? 'Invitado' : 'Guest'} #${shortId}`,
        email: user.email,
        isGuest: true,
      };
    }
  }
  if (tx.clientName) {
    const isGuest = tx.clientEmail?.includes('@alpacard.local') ?? false;
    return {
      name: tx.clientName,
      email: tx.clientEmail || '',
      isGuest,
    };
  }
  return {
    name: isEs ? 'Cliente' : 'Customer',
    email: '',
    isGuest: true,
  };
}

export function DashboardPage({ businessId, onCreateBusiness }: DashboardPageProps) {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getStats(businessId);
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
  };

  useEffect(() => {
    loadStats();
  }, [businessId]);

  if (!businessId) {
    return (
      <div className="rounded-3xl bg-white p-12 text-center shadow-xs border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">{t.dashboard.welcomeTitle}</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
          {t.dashboard.welcomeDesc}
        </p>
        <button
          onClick={onCreateBusiness}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition"
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
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  const statCards = [
    {
      label: isEs ? 'Sellos Entregados' : 'Stamps Issued',
      value: stats?.totalStampsIssued || 0,
      icon: Sparkles,
      color: 'text-amber-500',
      bg: 'bg-amber-50',
    },
    {
      label: isEs ? 'Premios Canjeados' : 'Rewards Redeemed',
      value: stats?.rewardsRedeemed || 0,
      icon: Gift,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: isEs ? 'Tarjetas Emitidas' : 'Cards Issued',
      value: stats?.cardsCount || 0,
      icon: CreditCard,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: isEs ? 'Clientes Únicos' : 'Unique Customers',
      value: stats?.totalCustomers ?? stats?.cardsCount ?? 0,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: isEs ? 'Clientes Registrados' : 'Registered Members',
      value: stats?.registeredCustomers || 0,
      icon: ShieldCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: isEs ? 'Campañas Activas' : 'Active Campaigns',
      value: stats?.campaignsCount || 0,
      icon: Award,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 sm:p-8 text-white shadow-lg">
        <div>
          <h2 className="text-2xl font-black">
            {isEs ? 'Centro de Control del Comercio' : 'Merchant Control Center'}
          </h2>
          <p className="text-xs text-indigo-100 mt-1 max-w-md">
            {isEs
              ? 'Métricas de retención de clientes, sellos entregados y business intelligence en tiempo real.'
              : 'Real-time punch card activity, stamp metrics, and customer retention intelligence.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            className="rounded-xl bg-white/15 p-2.5 text-white hover:bg-white/25 transition active:scale-95"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            to="/scanner"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-indigo-600 shadow-md hover:bg-indigo-50 transition active:scale-95"
          >
            <ScanLine className="h-4 w-4" />
            {isEs ? 'Abrir Escáner QR' : 'Open QR Scanner'}
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-3xl bg-white p-5 shadow-xs border border-gray-100 transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 truncate">{card.label}</span>
                <div className={`p-2 rounded-xl ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className="mt-3 text-3xl font-black text-gray-900 tracking-tight">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Table with Customer Tracking */}
      <div className="rounded-3xl bg-white shadow-xs border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">{t.dashboard.recentActivity}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {isEs
                ? 'Historial de sellos y canjes con identificación del cliente para trazabilidad'
                : 'Customer stamp logs and redemptions with client tracking'}
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            {stats?.recentTransactions?.length || 0} {isEs ? 'registros' : 'records'}
          </span>
        </div>

        {!stats?.recentTransactions || stats.recentTransactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            {t.dashboard.noTransactionsYet}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
              <thead className="bg-gray-50/75 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">{isEs ? 'Acción' : 'Action'}</th>
                  <th className="px-6 py-3.5">{isEs ? 'Cliente' : 'Client / Customer'}</th>
                  <th className="px-6 py-3.5">{isEs ? 'Campaña' : 'Campaign'}</th>
                  <th className="px-6 py-3.5">{isEs ? 'Personal' : 'Staff'}</th>
                  <th className="px-6 py-3.5">{isEs ? 'Cantidad' : 'Amount'}</th>
                  <th className="px-6 py-3.5">{isEs ? 'Fecha y Hora' : 'Date & Time'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentTransactions.map((tx) => {
                  const client = getClientDisplay(tx, isEs);
                  const isEarn = tx.type === 'EARN';

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50/60 transition">
                      {/* Action Pill */}
                      <td className="px-6 py-3.5 font-semibold">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isEarn
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}
                        >
                          {isEarn ? (
                            <>
                              <Sparkles className="h-3 w-3" />
                              <span>{isEs ? '+ SELLO' : '+ STAMP'}</span>
                            </>
                          ) : (
                            <>
                              <Gift className="h-3 w-3" />
                              <span>{isEs ? 'PREMIO CANJEADO' : 'REWARD REDEEMED'}</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Client / Customer Tracking */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-bold shrink-0 ${
                              client.isGuest
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {client.isGuest ? (
                              <User className="h-3.5 w-3.5" />
                            ) : (
                              client.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate max-w-[140px]">
                              {client.name}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[150px]">
                              {client.email || (client.isGuest ? 'Anónimo' : '')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Campaign */}
                      <td className="px-6 py-3.5 text-gray-700 font-medium">
                        {tx.card?.campaign?.name || '—'}
                      </td>

                      {/* Staff */}
                      <td className="px-6 py-3.5 text-gray-600">
                        <span className="font-medium text-gray-800">
                          {tx.staff?.name || tx.staff?.email?.split('@')[0] || (isEs ? 'Personal' : 'Staff')}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-3.5 font-bold text-gray-900">
                        {isEarn ? `+${tx.amount}` : `-${tx.amount}`}
                      </td>

                      {/* Timestamp */}
                      <td className="px-6 py-3.5 text-gray-500 font-mono text-[11px]">
                        {new Date(tx.createdAt).toLocaleDateString()}{' '}
                        {new Date(tx.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
