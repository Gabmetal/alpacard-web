import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import {
  ArrowLeft,
  Gift,
  RefreshCw,
  Clock,
  Smartphone,
  Sparkles,
  LogIn,
  BookOpen,
  ExternalLink,
  ChevronRight,
  Globe,
  Instagram,
  WifiOff,
} from 'lucide-react';
import { walletApi, getStoredUser, ensureAuthToken, WalletUser } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import { getWalletCardStyle, getActiveStampColor, WalletStampIcon } from '../components/CardTheme';
import { WalletAuthModal } from '../components/WalletAuthModal';
import { MenuModal } from '../components/MenuModal';
import { RedeemCelebrationModal } from '../components/RedeemCelebrationModal';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { playStampCelebrationSound } from '../utils/audio';
import { getMerchantUrl } from '../utils/urls';

interface QRData {
  token: string;
  expiresIn: number;
  scanUrl: string;
  card: {
    id: string;
    stamps: number;
    campaign: {
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
  };
}

function formatWebsiteUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function formatInstagramUrl(handleOrUrl?: string): string {
  if (!handleOrUrl) return '';
  const trimmed = handleOrUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanHandle = trimmed.replace(/^@/, '');
  return `https://instagram.com/${cleanHandle}`;
}

function formatInstagramDisplay(handleOrUrl?: string): string {
  if (!handleOrUrl) return '';
  const trimmed = handleOrUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const u = new URL(trimmed);
      const pathname = u.pathname.replace(/^\//, '').replace(/\/$/, '');
      if (pathname) return `@${pathname}`;
    } catch {
      // fallback
    }
    return 'Instagram';
  }
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function formatWebsiteDisplay(url?: string): string {
  if (!url) return '';
  try {
    const raw = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    const u = new URL(raw);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

export function CardDetailPage() {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [secondsLeft, setSecondsLeft] = useState<number>(300);

  // User auth state & modal for guest banner
  const [user, setUser] = useState<WalletUser | null>(getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('register');

  // Business Menu modal state
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

  // Addictive prize redemption celebration modal state
  const [isRedeemCelebrating, setIsRedeemCelebrating] = useState(false);

  // Real-time autoupdate toast notification
  const [stampAlert, setStampAlert] = useState<{ message: string; type: 'earn' | 'redeem' } | null>(
    null
  );

  const prevStampsRef = useRef<number | null>(null);
  const isFetchingQRRef = useRef<boolean>(false);
  const isEsRef = useRef<boolean>(isEs);
  useEffect(() => {
    isEsRef.current = isEs;
  }, [isEs]);

  const notifyStampChange = useCallback(
    (newStamps: number, stampsRequired: number, action?: string) => {
      if (prevStampsRef.current === null || (newStamps === prevStampsRef.current && action !== 'REDEEM')) {
        prevStampsRef.current = newStamps;
        return false;
      }

      const isRedeem = action === 'REDEEM' || (prevStampsRef.current !== null && newStamps < prevStampsRef.current);
      prevStampsRef.current = newStamps;

      if (isRedeem) {
        // Trigger celebration only when prize is claimed and stamps restart
        setIsRedeemCelebrating(true);
        setStampAlert({
          type: 'redeem',
          message: isEsRef.current
            ? '¡Premio canjeado con éxito! Tu tarjeta ha sido reiniciada.'
            : 'Reward redeemed successfully! Your card has been reset.',
        });
      } else {
        playStampCelebrationSound(true);
        setStampAlert({
          type: 'earn',
          message: isEsRef.current
            ? `¡Sello recibido! Ahora tienes ${newStamps} de ${stampsRequired} sellos.`
            : `Stamp added! You now have ${newStamps} of ${stampsRequired} stamps.`,
        });
      }
      setTimeout(() => setStampAlert(null), 6000);
      return true;
    },
    []
  );

  // Fetches a single-use 5-minute QR token ONLY on initial load, manual refresh,
  // token expiration (0:00), or after a stamp is scanned.
  const fetchQR = useCallback(
    async (silent = false) => {
      if (!id || isFetchingQRRef.current) return;
      isFetchingQRRef.current = true;
      try {
        if (!silent) {
          setLoading(true);
          setError(null);
        }
        const res = await walletApi.getCardQR(id);
        notifyStampChange(res.card.stamps, res.card.campaign.stampsRequired || 10);
        setData(res);
        setSecondsLeft(res.expiresIn && res.expiresIn > 0 ? res.expiresIn : 300);
        setIsOffline(false);
        try {
          localStorage.setItem(`alpacard_card_cache_${id}`, JSON.stringify(res));
        } catch {}
      } catch (err: unknown) {
        const cached = id ? localStorage.getItem(`alpacard_card_cache_${id}`) : null;
        if (cached) {
          try {
            const cachedRes: QRData = JSON.parse(cached);
            setData(cachedRes);
            setIsOffline(true);
            setError(null);
          } catch {
            if (!silent) {
              setError(isEsRef.current ? 'Error al cargar la tarjeta' : 'Failed to load card');
            }
          }
        } else if (!silent) {
          if (!navigator.onLine) {
            setIsOffline(true);
            setError(null);
          } else if (err instanceof Error) {
            setError(err.message);
          } else {
            setError(isEsRef.current ? 'Error al cargar la tarjeta' : 'Failed to load card');
          }
        }
      } finally {
        isFetchingQRRef.current = false;
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [id, notifyStampChange]
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      fetchQR(true);
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchQR]);

  // 1. Initial QR token load: runs ONLY ONCE per card ID
  useEffect(() => {
    prevStampsRef.current = null;
    fetchQR(false);
  }, [fetchQR]);

  // 2. Real-time stamp auto-update via Server-Sent Events (SSE) — zero /qr polling loop
  useEffect(() => {
    if (!id) return;
    let eventSource: EventSource | null = null;
    let cancelled = false;

    const connectSSE = async () => {
      try {
        const token = await ensureAuthToken();
        if (cancelled) return;
        const url = `/api/v1/cards/${encodeURIComponent(id)}/events?token=${encodeURIComponent(token)}`;
        eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as { stamps?: number; action?: string };
            if (typeof payload.stamps === 'number') {
              // Update card stamps in-place and rotate consumed QR token once if stamps changed
              setData((prev) => {
                if (!prev) return prev;
                const reqStamps = prev.card.campaign.stampsRequired || 10;
                const changed = notifyStampChange(payload.stamps!, reqStamps, payload.action);
                if (changed) {
                  // Rotate the single-use QR token once after the scan was processed
                  setTimeout(() => fetchQR(true), 150);
                }
                return {
                  ...prev,
                  card: {
                    ...prev.card,
                    stamps: payload.stamps!,
                  },
                };
              });
            }
          } catch {
            // Ignore malformed SSE payloads
          }
        };
      } catch {
        // Ignore SSE connection setup errors
      }
    };

    connectSSE();

    // When returning to tab from background, check card state without resetting QR timer
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && id) {
        try {
          const updatedCard = await walletApi.getCard(id);
          if (updatedCard && typeof updatedCard.stamps === 'number') {
            const changed = notifyStampChange(
              updatedCard.stamps,
              updatedCard.campaign?.stampsRequired || 10
            );
            if (changed) {
              fetchQR(true);
            }
          }
        } catch {
          // Ignore background check error
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      if (eventSource) {
        eventSource.close();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, fetchQR, notifyStampChange]);

  // 3. Stable 1-second countdown timer (5:00 -> 0:00)
  const hasData = Boolean(data);
  useEffect(() => {
    if (!hasData) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [hasData]);

  // 4. Refresh QR token ONLY when the 5-minute countdown reaches 0:00
  useEffect(() => {
    if (hasData && secondsLeft === 0 && !isFetchingQRRef.current) {
      fetchQR(true);
    }
  }, [hasData, secondsLeft, fetchQR]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleAuthSuccess = (authenticatedUser: WalletUser) => {
    setUser(authenticatedUser);
    fetchQR(true);
  };

  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAF8F5]">
        <RefreshCw className="h-8 w-8 animate-spin text-[#4A3525]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#FAF8F5] p-6 text-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || (isEs ? 'Tarjeta no encontrada' : 'Card not found')}
        </div>
        <Link to="/" className="mt-4 text-sm font-semibold text-[#4A3525] hover:underline">
          &larr; {t.backToWallet}
        </Link>
      </div>
    );
  }

  const { card } = data;
  const stampsRequired = card.campaign.stampsRequired || 10;
  const stamps = card.stamps || 0;
  const isRewardReady = stamps >= stampsRequired;

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
  const isLightText =
    !card.campaign.textColor ||
    card.campaign.textColor.toLowerCase() === '#ffffff' ||
    card.campaign.textColor.toLowerCase() === '#fff';

  const isGuest = !user || user.isAnonymous;

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-12 text-stone-900">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-stone-200 px-4 py-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/" className="rounded-full p-2 text-stone-600 hover:bg-stone-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base sm:text-lg font-bold text-stone-900">
            {isEs ? 'Tarjeta de Fidelidad' : 'Punch Card'}
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-sm px-4 pt-5">
        {/* PWA Mobile App Install Promotion */}
        <div className="mb-3.5">
          <PWAInstallPrompt />
        </div>

        {/* Offline Mode Banner */}
        {isOffline && (
          <div className="mb-3.5 flex items-center gap-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 p-3 text-xs text-amber-800 dark:text-amber-200 shadow-2xs">
            <WifiOff className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              {isEs
                ? 'Modo sin conexión: mostrando tus sellos guardados. La rotación de código QR se reanudará al conectarte.'
                : 'Offline mode: displaying cached stamps. QR rotation will resume once connected.'}
            </span>
          </div>
        )}

        {/* Real-time stamp received celebration banner */}
        {stampAlert && (
          <div className="mb-3.5 flex items-center justify-between rounded-2xl bg-emerald-800 px-4 py-3 text-white shadow-md animate-bounce">
            <div className="flex items-center gap-2 font-bold text-xs">
              <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
              <span>{stampAlert.message}</span>
            </div>
            <button
              onClick={() => setStampAlert(null)}
              className="text-white/80 hover:text-white text-xs font-bold shrink-0 ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Compact Guest Sync Banner (Shown if not logged in) */}
        {isGuest && (
          <div className="mb-4 rounded-2xl border border-[#E6D9C6] bg-[#F5EFE6]/70 p-3 shadow-xs">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#3D2B1F] text-white shadow-xs">
                  <Sparkles className="h-4 w-4 text-amber-200" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-stone-900 uppercase tracking-wide leading-tight">
                    {t.guestBadge}
                  </h4>
                  <p className="text-[11px] text-stone-600 leading-tight">
                    {t.guestCardPrompt}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAuthModalTab('register');
                  setIsAuthModalOpen(true);
                }}
                className="shrink-0 flex items-center gap-1 rounded-xl bg-[#3D2B1F] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs transition hover:bg-[#2A1D15] active:scale-95"
              >
                <LogIn className="h-3 w-3" />
                <span>{t.authTabSignIn}</span>
              </button>
            </div>
          </div>
        )}

        {/* The Digital Punch Card - glows when reward is ready to claim, resets with stamps */}
        <div
          className={`relative overflow-hidden rounded-3xl bg-white border border-stone-200/80 shadow-md transition-all duration-500 ${
            isRewardReady
              ? 'animate-card-glow ring-4 ring-amber-400/60 scale-[1.01]'
              : ''
          }`}
        >
          {/* Subtle golden shimmer while reward is ready to claim */}
          {isRewardReady && (
            <div className="absolute inset-0 z-20 pointer-events-none animate-shimmer-slide opacity-35 rounded-3xl" />
          )}

          {/* Card Top Branding */}
          <div style={cardStyle} className="p-6 transition duration-300 relative text-center">
            {/* Top row with Store branding & View Menu pill in card */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {card.campaign.logoUrl ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/20 backdrop-blur-md p-1 shadow-xs shrink-0">
                    <img
                      src={card.campaign.logoUrl}
                      alt="Logo"
                      className="max-h-full max-w-full object-contain object-center"
                    />
                  </div>
                ) : (
                  <span className="text-xl">🦙</span>
                )}
                <span
                  className={`text-xs font-bold uppercase tracking-wider truncate text-left ${
                    isLightText ? 'text-white/85' : 'text-stone-700'
                  }`}
                >
                  {card.campaign.business?.name || (isEs ? 'Comercio' : 'Store')}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {card.campaign.business?.instagram && (
                  <a
                    href={formatInstagramUrl(card.campaign.business.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition active:scale-95 shadow-xs border border-white/25"
                    title="Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {card.campaign.business?.website && (
                  <a
                    href={formatWebsiteUrl(card.campaign.business.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white transition active:scale-95 shadow-xs border border-white/25"
                    title={t.visitWebsiteBtn}
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-black">{card.campaign.name}</h2>
            <p
              className={`mt-1 text-xs ${
                isLightText ? 'text-white/90' : 'text-stone-600'
              }`}
            >
              🎁 {card.campaign.reward || card.campaign.description}
            </p>

            {/* Prominent badge letting user know reward is ready to claim */}
            {isRewardReady && (
              <div className="mt-3 flex justify-center">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 px-4 py-1.5 text-xs font-black text-stone-900 shadow-lg shadow-amber-500/30 animate-pulse">
                  <Sparkles className="h-3.5 w-3.5 fill-stone-900" />
                  <span>
                    {isEs
                      ? '¡Premio Listo para Canjear!'
                      : 'Reward Ready to Claim!'}
                  </span>
                </div>
              </div>
            )}

            {/* Quick button in card banner */}
            {hasMenu && (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsMenuModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/25 hover:bg-white/35 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white transition active:scale-95 shadow-xs border border-white/30"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{t.viewMenuBtn}</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            {/* Visual Stamp Circles */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500 mb-3">
                <span>{isEs ? 'Sellos Coleccionados' : 'Stamps Collected'}</span>
                <span className="font-bold" style={{ color: activeColor }}>
                  {stamps} / {stampsRequired}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {Array.from({ length: stampsRequired }).map((_, idx) => {
                  const isStamped = idx < stamps;
                  const isLast = idx === stampsRequired - 1;

                  return (
                    <div
                      key={idx}
                      className={`flex aspect-square items-center justify-center rounded-2xl border-2 transition-all duration-300 ${
                        isStamped
                          ? 'text-white shadow-xs scale-100'
                          : isLast
                          ? 'border-dashed border-amber-400 bg-amber-50/70 text-amber-600'
                          : 'border-dashed border-stone-300 bg-stone-50 text-stone-300'
                      }`}
                      style={
                        isStamped
                          ? { backgroundColor: activeColor, borderColor: activeColor }
                          : undefined
                      }
                    >
                      {isStamped ? (
                        <div className="flex items-center justify-center w-full h-full animate-in zoom-in-75 duration-300">
                          <WalletStampIcon
                            icon={card.campaign.stampIcon}
                            className="h-5 w-5 stroke-[2.5]"
                          />
                        </div>
                      ) : isLast ? (
                        <div className="flex items-center justify-center w-full h-full">
                          <Gift className="h-5 w-5 animate-pulse" />
                        </div>
                      ) : (
                        <span className="text-xs font-bold">{idx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic QR Presentation - Contains full scanner URL for native cellphone camera scanning */}
            <div className="flex flex-col items-center rounded-2xl border border-stone-200/80 bg-[#FAF8F5] p-5 sm:p-6">
              <div className="keep-light rounded-2xl bg-white p-3 shadow-xs border border-stone-200/60">
                <QRCode
                  value={
                    data.scanUrl ||
                    getMerchantUrl(`/scanner?token=${data.token}`)
                  }
                  size={180}
                />
              </div>

              {/* Countdown & Refresh */}
              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-stone-500">
                <Clock className="h-3.5 w-3.5 text-stone-400" />
                <span>
                  {t.expiresIn} <strong className="text-stone-700">{formatTime(secondsLeft)}</strong>
                </span>
                <button
                  onClick={() => fetchQR(false)}
                  className="ml-2 text-[#4A3525] hover:text-[#2A1D15] font-semibold"
                  title="Refresh Token"
                >
                  <RefreshCw className="h-3.5 w-3.5 inline" />
                </button>
              </div>

              {/* Live Autoupdate Active Indicator */}
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{t.liveAutoUpdate}</span>
              </div>

              {/* Phone Camera Compatibility Pill */}
              <div className="mt-2.5 flex items-center gap-1.5 rounded-full bg-[#F5EFE6] border border-[#E6D9C6] px-3 py-1 text-[11px] font-semibold text-[#4A3525]">
                <Smartphone className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {isEs
                    ? 'Escanéalo con la cámara del celular o app'
                    : 'Scan with phone camera or merchant app'}
                </span>
              </div>

              <p className="mt-2 text-center text-[11px] text-stone-400">
                {isRewardReady
                  ? isEs
                    ? '¡Muestra al personal para reclamar tu premio gratis!'
                    : 'Show to staff to claim your free reward!'
                  : isEs
                  ? 'Muestra este código QR al cajero para recibir un sello.'
                  : 'Show this QR to the cashier to receive a stamp.'}
              </p>
            </div>

            {/* Store Actions & Links (Menu, Website, Instagram) */}
            {(hasMenu || card.campaign.business?.website || card.campaign.business?.instagram) && (
              <div className="mt-5 pt-4 border-t border-stone-100 space-y-2.5">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  {t.storeLinks}
                </span>

                {/* Primary Menu Button if configured */}
                {hasMenu && card.campaign.business && (
                  <button
                    onClick={() => setIsMenuModalOpen(true)}
                    className="w-full flex items-center justify-between rounded-2xl py-3 px-4 text-xs font-bold shadow-xs transition active:scale-95 border"
                    style={{
                      backgroundColor: card.campaign.business.brandColor
                        ? `${card.campaign.business.brandColor}12`
                        : '#F5EFE6',
                      borderColor: card.campaign.business.brandColor
                        ? `${card.campaign.business.brandColor}40`
                        : '#E6D9C6',
                      color: card.campaign.business.brandColor || '#4A3525',
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white border border-stone-200/80 shadow-2xs">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <span className="font-bold">{t.viewMenuBtn}</span>
                    </div>
                    {card.campaign.business.menuType === 'link' ||
                    card.campaign.business.menuType === 'file' ? (
                      <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                    )}
                  </button>
                )}

                {/* Website & Instagram Buttons */}
                {(card.campaign.business?.website || card.campaign.business?.instagram) && (
                  <div className={`grid gap-2.5 ${card.campaign.business.website && card.campaign.business.instagram ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {card.campaign.business.website && (
                      <a
                        href={formatWebsiteUrl(card.campaign.business.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 p-2.5 sm:p-3 text-xs font-bold text-stone-800 transition active:scale-95 shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white border border-stone-200 text-[#4A3525] shrink-0 shadow-2xs">
                            <Globe className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 text-left">
                            <span className="block text-[9px] text-stone-500 font-semibold uppercase tracking-wider leading-none">
                              {t.visitWebsiteBtn}
                            </span>
                            <span className="block truncate text-xs font-bold text-stone-900 mt-0.5">
                              {formatWebsiteDisplay(card.campaign.business.website)}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-stone-400 shrink-0 ml-1" />
                      </a>
                    )}

                    {card.campaign.business.instagram && (
                      <a
                        href={formatInstagramUrl(card.campaign.business.instagram)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between rounded-2xl border border-pink-200/80 bg-gradient-to-r from-pink-50/70 to-rose-50/70 hover:from-pink-100 hover:to-rose-100 p-2.5 sm:p-3 text-xs font-bold text-stone-800 transition active:scale-95 shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white border border-pink-200 text-pink-600 shrink-0 shadow-2xs">
                            <Instagram className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 text-left">
                            <span className="block text-[9px] text-pink-700/80 font-semibold uppercase tracking-wider leading-none">
                              {t.visitInstagramBtn}
                            </span>
                            <span className="block truncate text-xs font-bold text-stone-900 mt-0.5">
                              {formatInstagramDisplay(card.campaign.business.instagram)}
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-pink-400 shrink-0 ml-1" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Menu Modal */}
      {card.campaign.business && (
        <MenuModal
          isOpen={isMenuModalOpen}
          onClose={() => setIsMenuModalOpen(false)}
          business={card.campaign.business}
        />
      )}

      {/* Auth Modal for guest customer */}
      <WalletAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        defaultTab={authModalTab}
      />

      {/* Addictive Reward Redemption Celebration Modal */}
      <RedeemCelebrationModal
        isOpen={isRedeemCelebrating}
        onClose={() => setIsRedeemCelebrating(false)}
        reward={card.campaign.reward || card.campaign.description}
        businessName={card.campaign.business?.name || (isEs ? 'Comercio' : 'Store')}
        logoUrl={card.campaign.logoUrl || card.campaign.business?.logoUrl}
        brandColor={card.campaign.business?.brandColor}
      />
    </div>
  );
}
