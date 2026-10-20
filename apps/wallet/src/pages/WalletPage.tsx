import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Sparkles, RefreshCw } from 'lucide-react';
import { walletApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { getWalletCardStyle, getActiveStampColor } from '../components/CardTheme';

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
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(language === 'es' ? 'Error al cargar la billetera' : 'Failed to load wallet');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="sticky top-0 z-10 bg-indigo-600 px-6 py-5 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/alpacard-logo.jpg" alt="Alpacard" className="h-10 w-10 rounded-xl object-cover border border-white/20 shadow-sm" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
              <p className="text-xs text-indigo-200">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
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

      <main className="mx-auto max-w-lg px-4 pt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <p className="mt-2 text-sm font-medium">{language === 'es' ? 'Abriendo tu billetera...' : 'Opening your wallet...'}</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-3 text-base font-semibold text-gray-800">{t.noCardsTitle}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {t.noCardsDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cards.map((card) => {
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
                          {card.campaign.business?.name || 'Store'}
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
                      <span>{language === 'es' ? 'Progreso' : 'Progress'}</span>
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
    </div>
  );
}
