import { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PWAInstallPrompt() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone display mode
    const standaloneCheck =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (standaloneCheck) {
      setIsStandalone(true);
      return;
    }

    // 2. Check if user already dismissed install banner in this session
    const dismissed = sessionStorage.getItem('alpacard_pwa_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // 3. Detect iOS device in mobile browser (Safari / WebViews)
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(ua);
    setIsIos(isAppleMobile);

    // 4. Capture standard Chrome/Android/Edge beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstalledSuccess(true);
      setTimeout(() => setIsStandalone(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android / Chromium native install dialog
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      // iOS Safari manual "Add to Home Screen" instructions
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('alpacard_pwa_dismissed', 'true');
  };

  // If already standalone (app installed) or user dismissed, don't show prompt
  if (isStandalone || isDismissed) {
    return null;
  }

  // Only display if Android prompt is ready or we are on an iOS browser
  const canInstall = Boolean(deferredPrompt || isIos);
  if (!canInstall && !installedSuccess) {
    return null;
  }

  if (installedSuccess) {
    return (
      <div className="rounded-2xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-3 shadow-xs flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in duration-300">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>{t.installAppSuccess}</span>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Install Promotion Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50 via-[#FAF8F5] to-amber-100/70 p-3.5 shadow-xs dark:from-stone-900 dark:via-stone-900 dark:to-stone-800 dark:border-amber-900/40 animate-in fade-in slide-in-from-top-2 duration-300">
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 rounded-full p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          title={t.installAppDismiss}
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3D2B1F] text-amber-300 shadow-xs">
            <Download className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                {t.installAppTitle}
              </h3>
              <span className="rounded-full bg-amber-400/20 px-1.5 py-0.2 text-[9px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider shrink-0">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-snug line-clamp-2 mt-0.5">
              {t.installAppDesc}
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-end gap-2 pt-1">
          <button
            onClick={handleDismiss}
            className="px-2.5 py-1 text-[11px] font-semibold text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
          >
            {t.installAppDismiss}
          </button>
          <button
            onClick={handleInstallClick}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#3D2B1F] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#2A1D15] active:scale-95"
          >
            <Download className="h-3.5 w-3.5 text-amber-300" />
            <span>{t.installAppBtn}</span>
          </button>
        </div>
      </div>

      {/* iOS Safari "Add to Home Screen" Bottom Sheet / Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl p-6 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3D2B1F] text-amber-300">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">{t.installAppTitle}</h3>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">iOS Safari</span>
                </div>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3.5 text-xs">
              <div className="flex items-start gap-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 p-3 border border-stone-200/80 dark:border-stone-700/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-white font-bold">
                  <Share className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100">Paso 1:</span>
                  <p className="text-stone-600 dark:text-stone-300 mt-0.5">{t.installAppIosStep1}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 p-3 border border-stone-200/80 dark:border-stone-700/60">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-stone-800 dark:bg-stone-700 text-white font-bold">
                  <PlusSquare className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-stone-900 dark:text-stone-100">Paso 2:</span>
                  <p className="text-stone-600 dark:text-stone-300 mt-0.5">{t.installAppIosStep2}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="mt-6 w-full rounded-xl bg-[#3D2B1F] py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#2A1D15] active:scale-95"
            >
              Entendido / Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
