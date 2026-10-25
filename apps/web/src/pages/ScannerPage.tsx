import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';
import { CheckCircle2, AlertCircle, RefreshCw, Sparkles, Volume2 } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

interface ScanResult {
  success: boolean;
  action: 'EARN' | 'REDEEM';
  message: string;
  newCount: number;
}

// Extracts the raw JWT token whether scanned as a direct token or as a full URL
function extractToken(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const token = url.searchParams.get('token');
      if (token) return token.trim();
    } catch {
      // Not a standard URL, fallback to raw string
    }
  }
  return trimmed;
}

export function ScannerPage() {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [searchParams, setSearchParams] = useSearchParams();
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Audio & haptic feedback on scan
  const playBeep = (isSuccess: boolean) => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(isSuccess ? [100, 50, 100] : 300);
      }
      const ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(isSuccess ? 880 : 220, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext not allowed without gesture or unsupported
    }
  };

  const handleProcessToken = async (token: string) => {
    if (!token || processing) return;
    setProcessing(true);
    setScanning(false);
    setError(null);
    setResult(null);

    try {
      const res = await api.scanStamp(token);
      setResult(res);
      playBeep(true);
    } catch (err: unknown) {
      playBeep(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Verification failed');
      }
    } finally {
      setProcessing(false);
    }
  };

  // Check for ?token= URL parameter on mount (e.g. from native cellphone camera scan)
  useEffect(() => {
    const rawUrlToken = searchParams.get('token');
    if (rawUrlToken) {
      const cleanToken = extractToken(rawUrlToken);
      if (cleanToken) {
        handleProcessToken(cleanToken);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, setSearchParams]);

  const handleScan = (detectedCodes: unknown[]) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    const raw = (detectedCodes[0] as { rawValue: string }).rawValue;
    if (raw) {
      const token = extractToken(raw);
      if (token) {
        handleProcessToken(token);
      }
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    setScanning(true);
    setProcessing(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-stone-900">
          {isEs ? 'Escáner de Fidelidad' : 'Loyalty Scanner'}
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          {isEs
            ? 'Apunta la cámara al código QR dinámico del cliente para sumar sellos o canjear premios'
            : "Point camera at the customer's dynamic QR card to add a stamp or redeem rewards"}
        </p>
      </div>

      <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-900 shadow-md border border-stone-200">
        {scanning && !result && !error && (
          <Scanner
            onScan={handleScan}
            formats={['qr_code']}
            components={{
              onOff: true,
              torch: true,
              zoom: true,
            }}
          />
        )}

        {/* Processing State */}
        {processing && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-stone-950/85 text-white p-6 text-center">
            <RefreshCw className="h-9 w-9 animate-spin text-stone-300 mb-3" />
            <p className="text-sm font-medium">
              {isEs
                ? 'Validando firma criptográfica del sello...'
                : 'Validating stamp cryptographic signature...'}
            </p>
          </div>
        )}

        {/* Success Result Overlay */}
        {result && (
          <div
            className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center text-white ${
              result.action === 'REDEEM' ? 'bg-emerald-900' : 'bg-[#2C221E]'
            }`}
          >
            {result.action === 'REDEEM' ? (
              <Sparkles className="h-14 w-14 mb-2 text-amber-300" />
            ) : (
              <CheckCircle2 className="h-14 w-14 mb-2 text-stone-200" />
            )}
            <h3 className="text-xl sm:text-2xl font-bold">{result.message}</h3>

            <div className="mt-4 rounded-xl bg-white/10 border border-white/15 px-6 py-3">
              <span className="text-xs uppercase font-semibold text-stone-300">
                {isEs ? 'Nuevo Balance' : 'New Balance'}
              </span>
              <p className="text-3xl sm:text-4xl font-bold mt-0.5">
                {result.newCount} {isEs ? 'Sellos' : 'Stamps'}
              </p>
            </div>

            <button
              onClick={resetScanner}
              className="keep-light mt-8 rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-bold text-stone-900 shadow-md hover:bg-stone-100 transition active:scale-95"
            >
              {isEs ? 'Escanear Próximo Cliente' : 'Scan Next Customer'}
            </button>
          </div>
        )}

        {/* Error Result Overlay */}
        {error && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-900 p-6 text-center text-white">
            <AlertCircle className="h-14 w-14 mb-2 text-red-200" />
            <h3 className="text-xl font-bold">{isEs ? 'Escaneo Rechazado' : 'Scan Rejected'}</h3>
            <p className="mt-2 text-xs text-red-100 max-w-xs">{error}</p>

            <button
              onClick={resetScanner}
              className="keep-light mt-8 rounded-xl bg-white px-6 py-3 text-xs sm:text-sm font-bold text-red-900 shadow-md hover:bg-stone-100 transition active:scale-95"
            >
              {isEs ? 'Intentar Nuevamente' : 'Try Again'}
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
        <Volume2 className="h-3.5 w-3.5" />
        <span>
          {isEs
            ? 'Sonido y vibración háptica activados'
            : 'Audio and vibration feedback are active'}
        </span>
      </div>
    </div>
  );
}
