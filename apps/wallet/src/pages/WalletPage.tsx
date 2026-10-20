import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Sparkles, RefreshCw, User, LogIn, LogOut, Store } from 'lucide-react';
import { walletApi, getStoredUser, WalletUser } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { getWalletCardStyle, getActiveStampColor } from '../components/CardTheme';
import { WalletAuthModal } from '../components/WalletAuthModal';

interface Card {
  id: string;
  stamps: number;
  campaign: {
    id: string;
    name: string;
    description: string;
    stampsRequired: number;
    reward: string;
    logoUrl?: string;
    bgType?: string;
    bgValue?: string;
    bgImageUrl?: string;
    textColor?: string;
    stampIcon?: string;
    business?: {
      name: string;
    };
  };
}

export function WalletPage() {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<WalletUser | null>(getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [selectedMerchant, setSelectedMerchant] = useState<string>('ALL');

  const loadCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await walletApi.getMyCards();
      setCards(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(isEs ? 'Error al cargar la billetera' : 'Failed to load wallet');
      }
    } finally {
      setLoading(false);
    }
  };

  const syncUser = async () => {
    try {
      const me = await walletApi.getMe();
      setUser(me);
    } catch {
      // Keep existing stored user or guest state
    }
  };

  useEffect(() => {
    syncUser();
    loadCards();
  }, []);

  const handleAuthSuccess = (authenticatedUser: WalletUser) => {
    setUser(authenticatedUser);
    loadCards();
  };

  const handleLogout = () => {
    walletApi.logout();
    setUser(null);
    loadCards();
  };

  // Distinct merchant names for multi-merchant filtering
  const merchants = useMemo(() => {
    const names = new Set<string>();
    cards.forEach((c) => {
      if (c.campaign.business?.name) {
        names.add(c.campaign.business.name);
      }
    });
    return Array.from(names);
  }, [cards]);

  // Filtered cards based on selected merchant
  const displayedCards = useMemo(() => {
    if (selectedMerchant === 'ALL') return cards;
    return cards.filter((c) => c.campaign.business?.name === selectedMerchant);
  }, [cards, selectedMerchant]);

  const isGuest = !user || user.isAnonymous;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-10 bg-indigo-600 px-6 py-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/alpacard-logo.jpg"
              alt="Alpacard"
              className="h-10 w-10 rounded-xl object-cover border border-white/20 shadow-sm"
            />
            <div>
              <h1 className="text-xl font-black tracking-tight">{t.title}</h1>
              <p className="text-xs text-indigo-200">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            {/* Auth / Profile Button */}
            {isGuest ? (
              <button
                onClick={() => {
                  setAuthModalTab('login');
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/25 active:scale-95"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.authTabSignIn}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white max-w-[120px] truncate"
                  title={`${user?.name || user?.email}`}
                >
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{user?.name || user?.email?.split('@')[0]}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-indigo-500/50 p-2 text-indigo-100 transition hover:bg-indigo-500 hover:text-white"
                  title={t.logoutBtn}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={loadCards}
              className="rounded-full bg-indigo-500/50 p-2 text-indigo-100 transition hover:bg-indigo-500 active:rotate-180"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-5 space-y-4">
        {/* Guest Sync Banner */}
        {isGuest && (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h2 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                  {t.guestBadge}
                </h2>
                <p className="mt-0.5 text-xs text-indigo-900 leading-relaxed">
                  {t.guestSyncPrompt}
                </p>
                <button
                  onClick={() => {
                    setAuthModalTab('register');
                    setIsAuthModalOpen(true);
                  }}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  {t.syncCardsBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Merchant Filter Tabs (Shown when customer has cards from multiple stores) */}
        {merchants.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
            <button
              onClick={() => setSelectedMerchant('ALL')}
              className={`flex items-center gap-1 shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                selectedMerchant === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Store className="h-3.5 w-3.5" />
              <span>{t.allMerchantsFilter}</span>
              <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                {cards.length}
              </span>
            </button>
            {merchants.map((merchantName) => {
              const count = cards.filter((c) => c.campaign.business?.name === merchantName).length;
              return (
                <button
                  key={merchantName}
                  onClick={() => setSelectedMerchant(merchantName)}
                  className={`flex items-center gap-1 shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    selectedMerchant === merchantName
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span>{merchantName}</span>
                  <span className="ml-1 rounded-full bg-gray-100 text-gray-600 px-1.5 py-0.2 text-[10px]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Cards Presentation Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <p className="mt-2 text-sm font-medium">
              {isEs ? 'Abriendo tu billetera...' : 'Opening your wallet...'}
            </p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        ) : displayedCards.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-3 text-base font-semibold text-gray-800">{t.noCardsTitle}</h3>
            <p className="mt-1 text-sm text-gray-500">{t.noCardsDesc}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedCards.map((card) => {
              const progressPct = Math.min(
                100,
                Math.round((card.stamps / card.campaign.stampsRequired) * 100)
              );
              const isReady = card.stamps >= card.campaign.stampsRequired;
              const cardStyle = getWalletCardStyle({
                bgType: card.campaign.bgType,
                bgValue: card.campaign.bgValue,
                bgImageUrl: card.campaign.bgImageUrl,
                textColor: card.campaign.textColor,
              });
              const activeColor = getActiveStampColor(card.campaign.bgValue);

              return (
                <Link
                  key={card.id}
                  to={`/card/${card.id}`}
                  className="group block overflow-hidden rounded-3xl bg-white shadow-sm transition hover:shadow-lg border border-gray-100"
                >
                  <div style={cardStyle} className="p-5 text-white transition duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {card.campaign.logoUrl ? (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-xs p-1 shadow-sm shrink-0">
                            <img
                              src={card.campaign.logoUrl}
                              alt="Logo"
                              className="max-h-full max-w-full object-contain object-center"
                            />
                          </div>
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs text-xs font-bold shrink-0">
                            🦙
                          </div>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                          {card.campaign.business?.name || (isEs ? 'Comercio' : 'Store')}
                        </span>
                      </div>
                      {isReady && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-xs font-bold text-emerald-200 backdrop-blur-xs border border-emerald-400/30">
                          <Sparkles className="h-3 w-3" /> {t.rewardReadyBadge}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-lg font-black leading-tight">{card.campaign.name}</h3>
                    <p className="mt-0.5 text-xs opacity-90 line-clamp-1">
                      🎁 {card.campaign.reward || card.campaign.description}
                    </p>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2 font-medium">
                      <span>{isEs ? 'Progreso' : 'Progress'}</span>
                      <span className="font-bold" style={{ color: isReady ? '#10b981' : activeColor }}>
                        {card.stamps} / {card.campaign.stampsRequired} {t.stampsCount.toLowerCase()}
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPct}%`,
                          backgroundColor: isReady ? '#10b981' : activeColor,
                        }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <WalletAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        defaultTab={authModalTab}
      />
    </div>
  );
}
