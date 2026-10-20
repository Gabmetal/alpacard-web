import { useState } from 'react';
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

export function ScannerPage() {
  const { language } = useLanguage();
  const isEs = language === 'es';
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');

  // Audio & haptic feedback on scan
  const playBeep = (isSuccess: boolean) => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(isSuccess ? [100, 50, 100] : 300);
      }
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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

  const handleScan = (detectedCodes: unknown[]) => {
    if (!detectedCodes || detectedCodes.length === 0) return;
    const token = (detectedCodes[0] as { rawValue: string }).rawValue;
    if (token) {
      handleProcessToken(token);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    setScanning(true);
    setProcessing(false);
    setManualToken('');
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">{isEs ? 'Escáner de Fidelidad' : 'Loyalty Scanner'}</h2>
        <p className="text-xs text-gray-500">
          {isEs ? 'Apunta la cámara al código QR dinámico del cliente para sumar sellos o canjear premios' : 'Point camera at the customer\'s dynamic QR card to add a stamp or redeem rewards'}
        </p>
      </div>

      <div className="relative aspect-square overflow-hidden rounded-3xl bg-black shadow-2xl">
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
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 text-white p-6">
            <RefreshCw className="h-10 w-10 animate-spin text-indigo-400 mb-3" />
            <p className="text-sm font-semibold">{isEs ? 'Validando firma criptográfica del sello...' : 'Validating stamp cryptographic signature...'}</p>
          </div>
        )}

        {/* Success Result Overlay */}
        {result && (
          <div
            className={`absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center text-white ${
              result.action === 'REDEEM'
                ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                : 'bg-gradient-to-br from-indigo-600 to-violet-700'
            }`}
          >
            {result.action === 'REDEEM' ? (
              <Sparkles className="h-16 w-16 mb-2 animate-bounce" />
            ) : (
              <CheckCircle2 className="h-16 w-16 mb-2" />
            )}
            <h3 className="text-2xl font-black">{result.message}</h3>

            <div className="mt-4 rounded-2xl bg-white/20 backdrop-blur-md px-6 py-3">
              <span className="text-xs uppercase font-semibold text-white/80">{isEs ? 'Nuevo Balance' : 'New Balance'}</span>
              <p className="text-4xl font-black">{result.newCount} {isEs ? 'Sellos' : 'Stamps'}</p>
            </div>

            <button
              onClick={resetScanner}
              className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-black text-gray-900 shadow-xl hover:bg-gray-100 transition active:scale-95"
            >
              {isEs ? 'Escanear Próximo Cliente' : 'Scan Next Customer'}
            </button>
          </div>
        )}

        {/* Error Result Overlay */}
        {error && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-br from-red-600 to-rose-700 p-6 text-center text-white">
            <AlertCircle className="h-16 w-16 mb-2 animate-pulse" />
            <h3 className="text-xl font-black">{isEs ? 'Escaneo Rechazado' : 'Scan Rejected'}</h3>
            <p className="mt-2 text-xs text-red-100 max-w-xs">{error}</p>

            <button
              onClick={resetScanner}
              className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-black text-red-700 shadow-xl hover:bg-gray-100 transition active:scale-95"
            >
              {isEs ? 'Intentar Nuevamente' : 'Try Again'}
            </button>
          </div>
        )}
      </div>

      {/* Manual Token input */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          {isEs ? 'Entrada Manual de Token (Pruebas / Debug)' : 'Manual Token Entry (Debug / Testing)'}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder={isEs ? 'Pegar token JWT...' : 'Paste JWT token string...'}
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
          />
          <button
            onClick={() => handleProcessToken(manualToken)}
            disabled={!manualToken || processing}
            className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isEs ? 'Verificar' : 'Verify'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Volume2 className="h-3.5 w-3.5" />
        <span>{isEs ? 'Sonido y vibración háptica activados' : 'Audio and vibration feedback are active'}</span>
      </div>
    </div>
  );
}
