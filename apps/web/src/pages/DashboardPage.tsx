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
      <div className="rounded-2xl bg-white p-8 sm:p-12 text-center shadow-2xs border border-stone-200">
        <h2 className="text-xl font-bold text-stone-900">{t.dashboard.welcomeTitle}</h2>
        <p className="mt-2 text-sm text-stone-500 max-w-sm mx-auto">
          {t.dashboard.welcomeDesc}
        </p>
        <button
          onClick={onCreateBusiness}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#3D2B1F] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#2C1F16] transition"
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
        <RefreshCw className="h-7 w-7 animate-spin text-[#5C4028]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
        {error}
      </div>
    );
  }

  const statCards = [
    {
      label: isEs ? 'Sellos Entregados' : 'Stamps Issued',
      value: stats?.totalStampsIssued || 0,
      icon: Sparkles,
      color: 'text-[#5C4028]',
      bg: 'bg-[#F5EFE6]',
    },
    {
      label: isEs ? 'Premios Canjeados' : 'Rewards Redeemed',
      value: stats?.rewardsRedeemed || 0,
      icon: Gift,
      color: 'text-amber-800',
      bg: 'bg-amber-50',
    },
    {
      label: isEs ? 'Tarjetas Emitidas' : 'Cards Issued',
      value: stats?.cardsCount || 0,
      icon: CreditCard,
      color: 'text-stone-700',
      bg: 'bg-stone-100',
    },
    {
      label: isEs ? 'Clientes Únicos' : 'Unique Customers',
      value: stats?.totalCustomers ?? stats?.cardsCount ?? 0,
      icon: Users,
      color: 'text-stone-700',
      bg: 'bg-stone-100',
    },
    {
      label: isEs ? 'Clientes Registrados' : 'Registered Members',
      value: stats?.registeredCustomers || 0,
      icon: ShieldCheck,
      color: 'text-emerald-800',
      bg: 'bg-emerald-50/80',
    },
    {
      label: isEs ? 'Campañas Activas' : 'Active Campaigns',
      value: stats?.campaignsCount || 0,
      icon: Award,
      color: 'text-[#5C4028]',
      bg: 'bg-[#F5EFE6]',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-[#2C221E] p-5 sm:p-7 text-white shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {isEs ? 'Centro de Control del Comercio' : 'Merchant Control Center'}
          </h2>
          <p className="text-xs text-stone-300 mt-1 max-w-lg leading-relaxed">
            {isEs
              ? 'Métricas de retención de clientes, sellos entregados y actividad en tiempo real.'
              : 'Real-time punch card activity, stamp metrics, and customer retention intelligence.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={loadStats}
            className="rounded-xl border border-stone-700 bg-stone-800/80 p-2.5 text-stone-200 hover:bg-stone-700 transition active:scale-95"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            to="/scanner"
            className="keep-light inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 sm:px-5 py-2.5 text-xs font-semibold text-stone-900 shadow-2xs hover:bg-stone-100 transition active:scale-[0.99]"
          >
            <ScanLine className="h-4 w-4 text-[#5C4028]" />
            {isEs ? 'Abrir Escáner QR' : 'Open QR Scanner'}
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl bg-white p-4 sm:p-5 shadow-2xs border border-stone-200/90 transition hover:border-stone-300"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-stone-500 leading-tight">
                  {card.label}
                </span>
                <div className={`p-2 rounded-xl shrink-0 ${card.bg}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>
              <p className="mt-3 text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Table with Customer Tracking */}
      <div className="rounded-2xl bg-white shadow-2xs border border-stone-200/90 overflow-hidden">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 px-5 sm:px-6 py-4 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-stone-900">{t.dashboard.recentActivity}</h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              {isEs
                ? 'Historial de sellos y canjes con identificación del cliente'
                : 'Customer stamp logs and redemptions with client tracking'}
            </p>
          </div>
          <span className="text-xs font-semibold text-stone-500">
            {stats?.recentTransactions?.length || 0} {isEs ? 'registros' : 'records'}
          </span>
        </div>

        {!stats?.recentTransactions || stats.recentTransactions.length === 0 ? (
          <div className="p-10 sm:p-12 text-center text-xs text-stone-400">
            {t.dashboard.noTransactionsYet}
          </div>
        ) : (
          <>
            {/* Mobile Stacked List */}
            <div className="divide-y divide-stone-100 md:hidden">
              {stats.recentTransactions.map((tx) => {
                const client = getClientDisplay(tx, isEs);
                const isEarn = tx.type === 'EARN';
                return (
                  <div key={tx.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold ${
                          isEarn
                            ? 'bg-[#F5EFE6] text-[#4A3525] border border-[#E6D9C6]'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
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
                      <span className="text-xs font-bold text-stone-900">
                        {isEarn ? `+${tx.amount}` : `-${tx.amount}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-bold shrink-0 ${
                            client.isGuest
                              ? 'bg-stone-100 text-stone-600'
                              : 'bg-[#F5EFE6] text-[#4A3525]'
                          }`}
                        >
                          {client.isGuest ? (
                            <User className="h-3 w-3" />
                          ) : (
                            client.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="font-semibold text-stone-900 truncate">{client.name}</span>
                      </div>
                      <span className="text-[11px] text-stone-500 truncate max-w-[140px]">
                        {tx.card?.campaign?.name || '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span>
                        {isEs ? 'Por: ' : 'By: '}
                        {tx.staff?.name ||
                          tx.staff?.email?.split('@')[0] ||
                          (isEs ? 'Personal' : 'Staff')}
                      </span>
                      <span className="font-mono">
                        {new Date(tx.createdAt).toLocaleDateString()}{' '}
                        {new Date(tx.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-100 text-left text-xs">
                <thead className="bg-stone-50/80 text-stone-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">{isEs ? 'Acción' : 'Action'}</th>
                    <th className="px-6 py-3.5">{isEs ? 'Cliente' : 'Client / Customer'}</th>
                    <th className="px-6 py-3.5">{isEs ? 'Campaña' : 'Campaign'}</th>
                    <th className="px-6 py-3.5">{isEs ? 'Personal' : 'Staff'}</th>
                    <th className="px-6 py-3.5">{isEs ? 'Cantidad' : 'Amount'}</th>
                    <th className="px-6 py-3.5">{isEs ? 'Fecha y Hora' : 'Date & Time'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {stats.recentTransactions.map((tx) => {
                    const client = getClientDisplay(tx, isEs);
                    const isEarn = tx.type === 'EARN';

                    return (
                      <tr key={tx.id} className="hover:bg-stone-50/70 transition">
                        <td className="px-6 py-3.5 font-semibold">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold ${
                              isEarn
                                ? 'bg-[#F5EFE6] text-[#4A3525] border border-[#E6D9C6]'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
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

                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${
                                client.isGuest
                                  ? 'bg-stone-100 text-stone-600'
                                  : 'bg-[#F5EFE6] text-[#4A3525]'
                              }`}
                            >
                              {client.isGuest ? (
                                <User className="h-3.5 w-3.5" />
                              ) : (
                                client.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-stone-900 truncate max-w-[140px]">
                                {client.name}
                              </p>
                              <p className="text-[10px] text-stone-400 truncate max-w-[150px]">
                                {client.email || (client.isGuest ? 'Anónimo' : '')}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-3.5 text-stone-700 font-medium">
                          {tx.card?.campaign?.name || '—'}
                        </td>

                        <td className="px-6 py-3.5 text-stone-600">
                          <span className="font-medium text-stone-800">
                            {tx.staff?.name ||
                              tx.staff?.email?.split('@')[0] ||
                              (isEs ? 'Personal' : 'Staff')}
                          </span>
                        </td>

                        <td className="px-6 py-3.5 font-bold text-stone-900">
                          {isEarn ? `+${tx.amount}` : `-${tx.amount}`}
                        </td>

                        <td className="px-6 py-3.5 text-stone-500 font-mono text-[11px]">
                          {new Date(tx.createdAt).toLocaleDateString()}{' '}
                          {new Date(tx.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
