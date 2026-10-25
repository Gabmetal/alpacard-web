import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Sparkles, RefreshCw, User, LogIn, LogOut, Store, BookOpen, Globe, Instagram } from 'lucide-react';
import { walletApi, getStoredUser, WalletUser } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import { getWalletCardStyle, getActiveStampColor } from '../components/CardTheme';
import { WalletAuthModal } from '../components/WalletAuthModal';
import { MenuModal } from '../components/MenuModal';

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
      logoUrl?: string;
      brandColor?: string;
      menuType?: string;
      menuUrl?: string;
      menuItems?: string;
      website?: string;
      instagram?: string;
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
  const [menuBusiness, setMenuBusiness] = useState<Card['campaign']['business'] | null>(null);

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
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-stone-950 pb-20 text-stone-900 dark:text-stone-100 transition-colors">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-10 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-3.5 text-stone-900 dark:text-stone-100 shadow-xs transition-colors">
        <div className="mx-auto max-w-lg flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/alpacard-logo.jpg"
              alt="Alpacard"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-cover border border-stone-200 dark:border-stone-700 shadow-xs shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-stone-900 dark:text-stone-100 truncate">
                {t.title}
              </h1>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{t.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <ThemeToggle />
            <LanguageSwitcher className="dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300" />

            {/* Auth / Profile Button */}
            {isGuest ? (
              <button
                onClick={() => {
                  setAuthModalTab('login');
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-[#3D2B1F] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-950 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#2A1D15] active:scale-95 shadow-xs"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">{t.authTabSignIn}</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <div
                  className="flex items-center gap-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2.5 py-1 text-xs font-semibold text-stone-800 dark:text-stone-200 max-w-[110px] truncate"
                  title={`${user?.name || user?.email}`}
                >
                  <User className="h-3.5 w-3.5 shrink-0 text-[#5C4028] dark:text-amber-400" />
                  <span className="truncate">{user?.name || user?.email?.split('@')[0]}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-1.5 text-stone-600 dark:text-stone-300 transition hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100"
                  title={t.logoutBtn}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={loadCards}
              className="rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-1.5 text-stone-600 dark:text-stone-300 transition hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-stone-100 active:rotate-180"
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
          <div className="rounded-2xl border border-[#E6D9C6] bg-[#F5EFE6]/70 p-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3D2B1F] text-white shadow-xs">
                <Sparkles className="h-4 w-4 text-amber-200" />
              </div>
              <div className="flex-1">
                <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                  {t.guestBadge}
                </h2>
                <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">
                  {t.guestSyncPrompt}
                </p>
                <button
                  onClick={() => {
                    setAuthModalTab('register');
                    setIsAuthModalOpen(true);
                  }}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-[#3D2B1F] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#2A1D15] active:scale-95"
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
                  ? 'bg-[#3D2B1F] text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
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
                      ? 'bg-[#3D2B1F] text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span>{merchantName}</span>
                  <span className="ml-1 rounded-full bg-stone-100 text-stone-600 px-1.5 py-0.2 text-[10px]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Cards Presentation Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <RefreshCw className="h-8 w-8 animate-spin text-[#4A3525]" />
            <p className="mt-2 text-sm font-medium">
              {isEs ? 'Abriendo tu billetera...' : 'Opening your wallet...'}
            </p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {error}
          </div>
        ) : displayedCards.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-stone-200 bg-white p-8 text-center shadow-xs">
            <CreditCard className="mx-auto h-12 w-12 text-stone-400" />
            <h3 className="mt-3 text-base font-semibold text-stone-800">{t.noCardsTitle}</h3>
            <p className="mt-1 text-sm text-stone-500">{t.noCardsDesc}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedCards.map((card) => {
              const progressPct = Math.min(
                100,
                Math.round((card.stamps / card.campaign.stampsRequired) * 100)
              );
              const isReady = card.stamps >= card.campaign.stampsRequired;
              const hasMenu = Boolean(
                card.campaign.business &&
                  (card.campaign.business.menuType !== 'none' ||
                    card.campaign.business.menuUrl ||
                    card.campaign.business.menuItems)
              );
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
                  className={`group block overflow-hidden rounded-3xl bg-white shadow-xs transition hover:shadow-md border ${
                    isReady ? 'border-amber-300 ring-2 ring-amber-400/40 shadow-amber-500/15' : 'border-stone-200/80'
                  }`}
                >
                  <div style={cardStyle} className="p-5 text-white transition duration-300">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {card.campaign.logoUrl ? (
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur-xs p-1 shadow-xs shrink-0">
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
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-85 truncate">
                          {card.campaign.business?.name || (isEs ? 'Comercio' : 'Store')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {card.campaign.business?.instagram && (
                          <span
                            className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 backdrop-blur-xs text-white"
                            title="Instagram"
                          >
                            <Instagram className="h-3 w-3" />
                          </span>
                        )}
                        {card.campaign.business?.website && (
                          <span
                            className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 backdrop-blur-xs text-white"
                            title={t.visitWebsiteBtn}
                          >
                            <Globe className="h-3 w-3" />
                          </span>
                        )}
                        {hasMenu && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMenuBusiness(card.campaign.business);
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xs px-2.5 py-0.5 text-[11px] font-bold text-white transition active:scale-95 shadow-xs"
                            title={t.viewMenuBtn}
                          >
                            <BookOpen className="h-3 w-3" />
                            <span>{t.viewMenuBtn}</span>
                          </button>
                        )}
                        {isReady && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 px-2.5 py-0.5 text-[10px] font-black text-stone-900 shadow-xs animate-pulse">
                            <Sparkles className="h-3 w-3 fill-stone-900" /> {t.rewardReadyBadge}
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="mt-2 text-lg font-black leading-tight">{card.campaign.name}</h3>
                    <p className="mt-0.5 text-xs opacity-90 line-clamp-1">
                      🎁 {card.campaign.reward || card.campaign.description}
                    </p>

                    {/* View Menu Button in Card Banner */}
                    {hasMenu && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuBusiness(card.campaign.business);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white transition active:scale-95 shadow-xs border border-white/20"
                          title={t.viewMenuBtn}
                        >
                          <BookOpen className="h-3 w-3" />
                          <span>{t.viewMenuBtn}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between text-xs text-stone-600 mb-2 font-medium">
                      <span>{isEs ? 'Progreso' : 'Progress'}</span>
                      <span className="font-bold" style={{ color: isReady ? '#059669' : activeColor }}>
                        {card.stamps} / {card.campaign.stampsRequired} {t.stampsCount.toLowerCase()}
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPct}%`,
                          backgroundColor: isReady ? '#059669' : activeColor,
                        }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Viral Merchant Discovery Footer */}
        <div className="pt-6 pb-2 text-center">
          <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-4 shadow-2xs backdrop-blur-xs transition-colors">
            <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
              {isEs
                ? '¿Tienes una cafetería, pastelería o comercio?'
                : 'Own a coffee shop, bakery, or local business?'}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              {isEs
                ? 'Crea tu tarjeta de fidelidad digital 100% gratis con Alpacard.'
                : 'Launch your 100% free digital punch card with Alpacard.'}
            </p>
            <a
              href="https://alpacard.app"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-[#3D2B1F] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-950 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#2A1D15] active:scale-95 shadow-xs"
            >
              <span>{isEs ? 'Crear mi tarjeta gratis' : 'Create Free Store Card'}</span>
              <span className="text-stone-300 dark:text-stone-900">→</span>
            </a>
          </div>
          <p className="mt-3 text-[10px] text-stone-400 dark:text-stone-500">
            Alpacard • Open-Source Digital Loyalty Platform
          </p>
        </div>
      </main>

      {/* Business Menu Modal */}
      {menuBusiness && (
        <MenuModal
          isOpen={Boolean(menuBusiness)}
          onClose={() => setMenuBusiness(null)}
          business={menuBusiness}
        />
      )}

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
