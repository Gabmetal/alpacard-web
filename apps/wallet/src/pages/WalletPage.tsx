import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Sparkles, RefreshCw } from 'lucide-react';
import { walletApi } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

interface Card {
  id: string;
  stamps: number;
  campaign: {
    id: string;
    name: string;
    description: string;
    stampsRequired: number;
    reward: string;
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

              return (
                <Link
                  key={card.id}
                  to={`/card/${card.id}`}
                  className="group block overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                        {card.campaign.business?.name || 'Store'}
                      </span>
                      {isReady && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-bold text-emerald-200">
                          <Sparkles className="h-3 w-3" /> {t.rewardReadyBadge}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 text-lg font-bold">{card.campaign.name}</h3>
                    <p className="mt-0.5 text-xs text-indigo-100 line-clamp-1">
                      {card.campaign.reward || card.campaign.description}
                    </p>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2 font-medium">
                      <span>{language === 'es' ? 'Progreso' : 'Progress'}</span>
                      <span className="text-indigo-600 font-bold">
                        {card.stamps} / {card.campaign.stampsRequired} {t.stampsCount.toLowerCase()}
                      </span>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isReady ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${progressPct}%` }}
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
