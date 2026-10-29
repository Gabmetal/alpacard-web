import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, ScanLine, AlertCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface CampaignScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractCampaignId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Match /claim/<uuid> inside a URL or path
  const claimMatch = trimmed.match(/\/claim\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (claimMatch && claimMatch[1]) {
    return claimMatch[1];
  }

  // Or if it's a direct UUID
  if (UUID_REGEX.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function CampaignScannerModal({ isOpen, onClose }: CampaignScannerModalProps) {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScan = (detectedCodes: unknown[]) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    const raw = (detectedCodes[0] as { rawValue: string }).rawValue;
    if (!raw) return;

    const campaignId = extractCampaignId(raw);
    if (campaignId) {
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      } catch {
        // Ignore
      }
      onClose();
      navigate(`/claim/${campaignId}`);
    } else {
      setError(
        isEs
          ? 'Código QR no válido. Por favor escanea el póster QR de una campaña de Alpacard.'
          : 'Invalid QR code. Please scan an Alpacard store campaign QR poster.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl">
        {/* Header */}
        <div className="relative bg-[#2C221E] dark:bg-stone-950 px-6 pt-5 pb-4 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full bg-white/15 p-1.5 text-white/80 transition hover:bg-white/25 hover:text-white cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/30">
              <ScanLine className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {isEs ? 'Escanear Campaña' : 'Scan Store Campaign'}
              </h2>
              <p className="text-[11px] text-stone-300 mt-0.5">
                {isEs
                  ? 'Apunta al código QR del comercio para agregar su tarjeta'
                  : 'Point at the store counter QR code to add their card'}
              </p>
            </div>
          </div>
        </div>

        {/* Scanner Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 p-3 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-950 border-2 border-stone-200 dark:border-stone-800 shadow-inner">
            <Scanner
              onScan={handleScan}
              onError={(err: unknown) => {
                if (err instanceof Error && err.message) {
                  setError(
                    isEs
                      ? 'No se pudo acceder a la cámara. Verifica los permisos.'
                      : 'Could not access camera. Please check camera permissions.'
                  );
                }
              }}
              styles={{
                container: { width: '100%', height: '100%' },
                video: { objectFit: 'cover' },
              }}
            />
            {/* Corner guide overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
              <div className="h-full w-full rounded-2xl border-2 border-amber-400/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-stone-500 dark:text-stone-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>
              {isEs
                ? 'La tarjeta se añadirá automáticamente a tu billetera'
                : 'The loyalty card will be added to your wallet automatically'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
