import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { ArrowLeft, Gift, RefreshCw, Clock, Smartphone } from 'lucide-react';
import { walletApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { getWalletCardStyle, getActiveStampColor, WalletStampIcon } from '../components/CardTheme';

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
      };
    };
  };
}

export function CardDetailPage() {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<QRData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(300);

  const fetchQR = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await walletApi.getCardQR(id);
      setData(res);
      setSecondsLeft(res.expiresIn || 300);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(isEs ? 'Error al cargar la tarjeta' : 'Failed to load card');
      }
    } finally {
      setLoading(false);
    }
  }, [id, isEs]);

  useEffect(() => {
    fetchQR();
  }, [fetchQR]);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) {
      fetchQR();
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

  if (loading && !data) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error || (isEs ? 'Tarjeta no encontrada' : 'Card not found')}
        </div>
        <Link to="/wallet" className="mt-4 text-sm font-semibold text-indigo-600 hover:underline">
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
  const isLightText = !card.campaign.textColor || card.campaign.textColor.toLowerCase() === '#ffffff' || card.campaign.textColor.toLowerCase() === '#fff';

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <header className="flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/wallet" className="rounded-full p-2 text-gray-600 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-800">{isEs ? 'Tarjeta de Fidelidad' : 'Punch Card'}</h1>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="mx-auto max-w-sm px-4 pt-6">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
          {/* Card Top Branding */}
          <div style={cardStyle} className="p-6 text-center transition duration-300">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              {card.campaign.logoUrl ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/20 backdrop-blur-md p-1.5 shadow-md shrink-0">
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
                  isLightText ? 'text-white/85' : 'text-gray-700'
                }`}
              >
                {card.campaign.business?.name || (isEs ? 'Comercio' : 'Store')}
              </span>
            </div>
            <h2 className="text-2xl font-black">{card.campaign.name}</h2>
            <p
              className={`mt-1 text-xs ${
                isLightText ? 'text-white/90' : 'text-gray-600'
              }`}
            >
              🎁 {card.campaign.reward || card.campaign.description}
            </p>
          </div>

          <div className="p-6">
            {/* Visual Stamp Circles */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-3">
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
                      className={`flex aspect-square items-center justify-center rounded-2xl border-2 transition-all ${
                        isStamped
                          ? 'text-white shadow-sm'
                          : isLast
                          ? 'border-dashed border-amber-400 bg-amber-50 text-amber-500'
                          : 'border-dashed border-gray-300 bg-gray-50 text-gray-300'
                      }`}
                      style={
                        isStamped
                          ? { backgroundColor: activeColor, borderColor: activeColor }
                          : undefined
                      }
                    >
                      {isStamped ? (
                        <div className="flex items-center justify-center w-full h-full">
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
            <div className="flex flex-col items-center rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
              <div className="rounded-2xl bg-white p-3 shadow-inner">
                <QRCode value={data.scanUrl || `${window.location.origin}/scanner?token=${data.token}`} size={180} />
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span>
                  {t.expiresIn} <strong className="text-gray-700">{formatTime(secondsLeft)}</strong>
                </span>
                <button
                  onClick={fetchQR}
                  className="ml-2 text-indigo-600 hover:text-indigo-700 font-semibold"
                  title="Refresh Token"
                >
                  <RefreshCw className="h-3.5 w-3.5 inline" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                <Smartphone className="h-3.5 w-3.5" />
                <span>{isEs ? 'Escanéalo con la cámara del celular o app' : 'Scan with phone camera or merchant app'}</span>
              </div>

              <p className="mt-2 text-center text-[11px] text-gray-400">
                {isRewardReady
                  ? (isEs ? '¡Muestra al personal para reclamar tu premio gratis!' : 'Show to staff to claim your free reward!')
                  : (isEs ? 'Muestra este código QR al cajero para recibir un sello.' : 'Show this QR to the cashier to receive a stamp.')}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
