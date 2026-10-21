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
} from 'lucide-react';
import { walletApi, getStoredUser, WalletUser } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { getWalletCardStyle, getActiveStampColor, WalletStampIcon } from '../components/CardTheme';
import { WalletAuthModal } from '../components/WalletAuthModal';
import { MenuModal } from '../components/MenuModal';

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
      };
    };
  };
}

// Pleasant celebratory audio chime & haptic feedback on receiving a stamp
function playCelebrationSound(isEarn: boolean) {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(isEarn ? [150, 70, 180] : [200, 100, 200, 100, 300]);
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const freqs = isEarn ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25, 880];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.35);
    });
  } catch {
    // Audio not allowed without gesture or unsupported
  }
}

export function CardDetailPage() {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(300);

  // User auth state & modal for guest banner
  const [user, setUser] = useState<WalletUser | null>(getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('register');

  // Business Menu modal state
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

  // Real-time autoupdate toast notification
  const [stampAlert, setStampAlert] = useState<{ message: string; type: 'earn' | 'redeem' } | null>(
    null
  );

  const prevStampsRef = useRef<number | null>(null);

  const fetchQR = useCallback(
    async (silent = false) => {
      if (!id) return;
      try {
        if (!silent) {
          setLoading(true);
          setError(null);
        }
        const res = await walletApi.getCardQR(id);

        // Check if stamps changed during background autoupdate
        if (prevStampsRef.current !== null && res.card.stamps !== prevStampsRef.current) {
          if (res.card.stamps > prevStampsRef.current) {
            playCelebrationSound(true);
            setStampAlert({
              type: 'earn',
              message: isEs
                ? `¡Sello recibido! Ahora tienes ${res.card.stamps} de ${res.card.campaign.stampsRequired} sellos.`
                : `Stamp added! You now have ${res.card.stamps} of ${res.card.campaign.stampsRequired} stamps.`,
            });
          } else {
            playCelebrationSound(false);
            setStampAlert({
              type: 'redeem',
              message: isEs
                ? '¡Premio canjeado con éxito! Tu tarjeta ha sido reiniciada.'
                : 'Reward redeemed successfully! Your card has been reset.',
            });
          }
          setTimeout(() => setStampAlert(null), 6000);
        }

        prevStampsRef.current = res.card.stamps;
        setData(res);
        setSecondsLeft(res.expiresIn || 300);
      } catch (err: unknown) {
        if (!silent) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError(isEs ? 'Error al cargar la tarjeta' : 'Failed to load card');
          }
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [id, isEs]
  );

  // Initial load
  useEffect(() => {
    fetchQR(false);
  }, [fetchQR]);

  // Autoupdate real-time polling (every 3 seconds when document is visible)
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchQR(true);
      }
    }, 3000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchQR(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, fetchQR]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) {
      fetchQR(true);
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, fetchQR]);

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
        <Link to="/wallet" className="mt-4 text-sm font-semibold text-[#4A3525] hover:underline">
          &larr; {t.backToWallet}
        </Link>
      </div>
    );
  }

  const { card } = data;
  const stampsRequired = card.campaign.stampsRequired || 10;
  const stamps = card.stamps || 0;
  const isRewardReady = stamps >= stampsRequired;

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
          <Link to="/wallet" className="rounded-full p-2 text-stone-600 hover:bg-stone-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-base sm:text-lg font-bold text-stone-900">
            {isEs ? 'Tarjeta de Fidelidad' : 'Punch Card'}
          </h1>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="mx-auto max-w-sm px-4 pt-5">
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

        {/* The Digital Punch Card */}
        <div className="overflow-hidden rounded-3xl bg-white border border-stone-200/80 shadow-md">
          {/* Card Top Branding */}
          <div style={cardStyle} className="p-6 text-center transition duration-300">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              {card.campaign.logoUrl ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/20 backdrop-blur-md p-1.5 shadow-sm shrink-0">
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
                className={`text-xs font-bold uppercase tracking-wider ${
                  isLightText ? 'text-white/85' : 'text-stone-700'
                }`}
              >
                {card.campaign.business?.name || (isEs ? 'Comercio' : 'Store')}
              </span>
            </div>
            <h2 className="text-2xl font-black">{card.campaign.name}</h2>
            <p
              className={`mt-1 text-xs ${
                isLightText ? 'text-white/90' : 'text-stone-600'
              }`}
            >
              🎁 {card.campaign.reward || card.campaign.description}
            </p>
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
              <div className="rounded-2xl bg-white p-3 shadow-xs border border-stone-200/60">
                <QRCode
                  value={
                    data.scanUrl ||
                    `${window.location.origin}/scanner?token=${data.token}`
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

            {/* Business Menu CTA Button */}
            {card.campaign.business &&
              card.campaign.business.menuType &&
              card.campaign.business.menuType !== 'none' && (
                <div className="mt-5 pt-4 border-t border-stone-100">
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
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{t.viewMenuBtn}</span>
                    </div>
                    {card.campaign.business.menuType === 'link' ||
                    card.campaign.business.menuType === 'file' ? (
                      <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                    )}
                  </button>
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
    </div>
  );
}
