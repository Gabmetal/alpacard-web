import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import { VideoTutorialModal } from '../components/VideoTutorialModal';
import { DemoRedeemCelebrationModal } from '../components/DemoRedeemCelebrationModal';
import { playStampCelebrationSound } from '../utils/audio';
import {
  ArrowLeft,
  Sparkles,
  QrCode,
  ShieldAlert,
  Smartphone,
  RefreshCw,
  Gift,
  Check,
  Terminal,
  Activity,
  Coffee,
  Play,
} from 'lucide-react';

export function DemoPage() {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [stampAlert, setStampAlert] = useState<{ message: string; type: 'earn' | 'redeem' } | null>(
    null
  );
  const [stamps, setStamps] = useState(7);
  const maxStamps = 10;
  const isRewardReady = stamps >= maxStamps;
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [eventLogs, setEventLogs] = useState<
    Array<{ id: string; time: string; text: string; type: 'info' | 'success' | 'danger' }>
  >([
    {
      id: 'init-1',
      time: '15:40:02',
      text: 'Connected to RabbitMQ exchange "alpacard.events" (direct)',
      type: 'info',
    },
    {
      id: 'init-2',
      time: '15:40:02',
      text: 'PostgreSQL connection pool ready: 10 connections alive',
      type: 'info',
    },
  ]);
  const [timerSeconds, setTimerSeconds] = useState(285);

  const playAudio = (type: 'beep' | 'success' | 'error') => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (type === 'beep') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'success') {
        [880, 1174, 1480].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.09 + 0.12);
          osc.connect(gain);
          osc.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.09);
          osc.stop(ctx.currentTime + idx * 0.09 + 0.14);
        });
      } else if (type === 'error') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
        osc.connect(gain);
        osc.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      }
    } catch {
      // Audio context restricted until user interaction
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerSeconds((prev) => (prev > 1 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const addLog = (text: string, type: 'info' | 'success' | 'danger') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setEventLogs((prev) => [
      { id: Math.random().toString(), time: timeStr, text, type },
      ...prev.slice(0, 19),
    ]);
  };

  const handlePerformStamp = () => {
    if (stamps >= maxStamps) {
      handleRedeemReward();
      return;
    }
    setScanState('scanning');
    playAudio('beep');

    setTimeout(() => {
      const nextStamps = stamps + 1;
      setStamps(nextStamps);
      setScanState('success');
      playStampCelebrationSound(true);
      const jti = `jti_${Math.random().toString(36).substring(2, 10)}`;
      addLog(`POST /api/v1/stamps/scan [JTI: ${jti}] -> 200 OK (EARN +1)`, 'success');
      addLog(
        `RabbitMQ published event "stamp.earned" -> card balance: ${nextStamps}/${maxStamps}`,
        'info'
      );

      // Trigger live wallet alert banner like the real app
      setStampAlert({
        type: 'earn',
        message: isEs
          ? `¡Sello recibido! Ahora tienes ${nextStamps} de ${maxStamps} sellos.`
          : `Stamp added! You now have ${nextStamps} of ${maxStamps} stamps.`,
      });
      setTimeout(() => setStampAlert(null), 4500);

      setTimeout(() => setScanState('idle'), 2200);
    }, 600);
  };

  const handleRedeemReward = () => {
    setScanState('scanning');
    playAudio('beep');

    setTimeout(() => {
      setStamps(0);
      setScanState('success');
      playStampCelebrationSound(false);
      setShowCelebrationModal(true);
      const jti = `jti_${Math.random().toString(36).substring(2, 10)}`;
      addLog(`POST /api/v1/stamps/scan [JTI: ${jti}] -> 200 OK (REDEEM -10)`, 'success');
      addLog(`RabbitMQ published event "reward.redeemed" -> Free Coffee claimed!`, 'success');

      setStampAlert({
        type: 'redeem',
        message: isEs
          ? '¡Premio canjeado con éxito! Tu tarjeta ha sido reiniciada.'
          : 'Reward redeemed successfully! Your card has been reset.',
      });
      setTimeout(() => setStampAlert(null), 5000);

      setTimeout(() => setScanState('idle'), 2500);
    }, 600);
  };

  const handleSimulateReplayAttack = () => {
    setScanState('scanning');
    playAudio('beep');

    setTimeout(() => {
      setScanState('error');
      setErrorMessage(t.demo.replayAlertText);
      playAudio('error');
      addLog(
        `[SECURITY ALERT] Replay attack blocked! Duplicate JTI detected in atomic table.`,
        'danger'
      );
      addLog(
        `[HTTP 409 Conflict] Token replay prohibited. Audit log flagged IP: 192.168.1.144`,
        'danger'
      );

      setTimeout(() => {
        setScanState('idle');
        setErrorMessage('');
      }, 3500);
    }, 700);
  };

  const handleReset = () => {
    setStamps(0);
    setScanState('idle');
    setErrorMessage('');
    addLog(`Demo state reset. Fresh anonymous card initialized.`, 'info');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-stone-950 text-stone-900 dark:text-stone-100 selection:bg-[#4A3525] selection:text-white flex flex-col transition-colors">
      {/* Top Header */}
      <header className="border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-2">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden xs:inline">{t.common.back}</span>
            </Link>
            <span className="text-stone-300 dark:text-stone-700">|</span>
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-2 w-2 rounded-full bg-emerald-600 shrink-0"></div>
              <span className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                {t.nav.liveDemo}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            <LanguageSwitcher variant="light" className="dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300" />
            <Link
              to="/docs"
              className="hidden sm:inline-flex rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 transition"
            >
              {t.nav.docs}
            </Link>
            <Link
              to="/login"
              className="rounded-lg bg-[#3D2B1F] dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#2C1F16] transition shadow-2xs"
            >
              {t.nav.console}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Simulation Workspace */}
      <main className="mx-auto max-w-7xl w-full flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-8 text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D9C6] bg-[#F5EFE6] px-3 py-1 text-xs font-semibold text-[#5C4028]">
            <Sparkles className="h-3.5 w-3.5" />
            {t.demo.badge}
          </span>
          <h1 className="text-2xl font-extrabold text-stone-900 sm:text-4xl">{t.demo.title}</h1>
          <p className="text-xs sm:text-sm text-stone-600">{t.demo.subtitle}</p>

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#E6D9C6] bg-[#F5EFE6] px-4 py-2 text-xs font-bold text-[#4A3525] hover:bg-[#EBE1D2] transition shadow-2xs active:scale-95"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isEs ? 'Ver Video Tutorial (1 min)' : 'Watch Video Tutorial (1 min)'}</span>
            </button>
          </div>
        </div>

        {/* Simulation Grid */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* LEFT: Customer Phone View */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-[#5C4028]">
              <Smartphone className="h-4 w-4" /> {t.demo.customerTitle}
            </div>

            {/* Mobile Phone Mockup Frame */}
            <div className="w-full max-w-[340px] rounded-[36px] border-4 border-stone-800 bg-stone-900 p-2.5 shadow-xl relative">
              {/* Screen Area */}
              <div className="rounded-[28px] bg-[#FAF8F5] p-4 pt-5 text-stone-900 min-h-[560px] flex flex-col justify-between border border-stone-200">
                <div>
                  <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                    <div className="flex items-center gap-2">
                      <img
                        src="/alpacard-logo.jpg"
                        alt="Alpacard"
                        className="h-6 w-6 rounded-md object-cover border border-stone-200"
                      />
                      <span className="text-xs font-bold tracking-tight text-stone-900">
                        Alpacard Wallet
                      </span>
                    </div>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      {t.demo.pwaActiveBadge}
                    </span>
                  </div>

                  {/* Stamp Received / Redeemed Real-time Banner */}
                  {stampAlert && (
                    <div
                      className={`mt-3 flex items-center justify-between rounded-xl px-3 py-2 text-white shadow-md text-[11px] font-bold animate-bounce ${
                        stampAlert.type === 'redeem' ? 'bg-amber-600' : 'bg-emerald-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-200 shrink-0" />
                        <span className="line-clamp-1">{stampAlert.message}</span>
                      </div>
                      <button
                        onClick={() => setStampAlert(null)}
                        className="text-white/80 hover:text-white text-xs ml-1 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* Loyalty Card UI - With Glow & Shimmer when Reward Ready */}
                  <div
                    className={`mt-4 rounded-3xl bg-[#3D2B1F] p-4 text-white shadow-md relative overflow-hidden transition-all duration-500 ${
                      isRewardReady
                        ? 'animate-card-glow ring-2 ring-amber-400 scale-[1.01]'
                        : 'border border-stone-800'
                    }`}
                  >
                    {/* Shimmer slide across card when ready */}
                    {isRewardReady && (
                      <div className="absolute inset-0 z-10 pointer-events-none animate-shimmer-slide opacity-30 rounded-3xl" />
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-300">
                          {t.demo.cardTier}
                        </span>
                        <h3 className="text-base font-black leading-tight">{t.demo.cardName}</h3>
                        <p className="text-[10px] text-stone-300 mt-0.5 line-clamp-1">
                          🎁 {isEs ? '1 Bebida o Café Gratis' : '1 Free Coffee or Drink'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shrink-0 shadow-2xs ${
                          isRewardReady
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-stone-950 animate-pulse'
                            : 'bg-white/15 text-white/90'
                        }`}
                      >
                        {isRewardReady ? t.demo.rewardReady : t.demo.inProgress}
                      </span>
                    </div>

                    {/* Stamp Circles */}
                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {Array.from({ length: maxStamps }).map((_, i) => {
                        const isStamped = i < stamps;
                        const isReward = i === maxStamps - 1;
                        return (
                          <div
                            key={i}
                            className={`aspect-square rounded-2xl border-2 flex items-center justify-center transition-all duration-300 ${
                              isStamped
                                ? 'border-[#E6D9C6] bg-amber-400 text-stone-950 font-bold shadow-xs scale-100'
                                : isReward
                                ? 'border-dashed border-amber-300/80 bg-amber-400/20 text-amber-200'
                                : 'border-dashed border-white/20 bg-white/10 text-white/40'
                            }`}
                          >
                            {isStamped ? (
                              <div className="flex items-center justify-center w-full h-full animate-in zoom-in-75 duration-300">
                                <Coffee className="h-4 w-4 stroke-[2.5]" />
                              </div>
                            ) : isReward ? (
                              <div className="flex items-center justify-center w-full h-full">
                                <Gift className="h-4 w-4 animate-pulse text-amber-300" />
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold">{i + 1}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-stone-200 font-medium border-t border-white/15 pt-2">
                      <span className="font-semibold">
                        {stamps} / {maxStamps} {t.demo.stampsCollected}
                      </span>
                      <span className="font-bold text-amber-300">
                        {isRewardReady
                          ? t.demo.freeRewardAvailable
                          : `${maxStamps - stamps} ${t.demo.remainingToReward}`}
                      </span>
                    </div>
                  </div>

                  {/* Customer QR Code Presentation */}
                  <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4 text-center shadow-2xs">
                    <div className="text-[11px] font-semibold text-stone-600 mb-2">
                      {t.demo.showQrInstructions}
                    </div>

                    <div className="keep-light mx-auto w-36 h-36 rounded-2xl bg-white p-2.5 border border-stone-200 shadow-xs flex items-center justify-center relative overflow-hidden">
                      {scanState === 'scanning' && (
                        <div className="absolute inset-x-2 top-0 h-1 bg-amber-500 animate-bounce shadow-md"></div>
                      )}
                      <QrCode className="keep-light h-full w-full text-stone-900" />
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-stone-500 font-mono">
                      <RefreshCw className="h-3 w-3 animate-spin text-[#5C4028]" />
                      <span>
                        {t.demo.singleUseToken} {formatTimer(timerSeconds)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-center text-[10px] text-stone-400">
                  {t.demo.pwaFooter}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Merchant Cashier Terminal */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-stone-700">
              <Activity className="h-4 w-4 text-[#5C4028]" /> {t.demo.cashierTitle}
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs space-y-6">
              {/* Cashier Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-stone-900">{t.demo.stationName}</h3>
                  <p className="text-xs text-stone-500">{t.demo.operatorLabel}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                  {t.demo.scannerReady}
                </span>
              </div>

              {/* Interactive Action Triggers */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-stone-700">{t.demo.actionsHeading}</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handlePerformStamp}
                    disabled={scanState === 'scanning'}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#3D2B1F] p-3.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#2C1F16] transition active:scale-[0.99] disabled:opacity-50"
                  >
                    <Coffee className="h-4 w-4" />
                    {stamps >= maxStamps ? t.demo.redeemAction : t.demo.punchAction}
                  </button>

                  <button
                    onClick={handleSimulateReplayAttack}
                    disabled={scanState === 'scanning'}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-xs font-semibold text-red-800 hover:bg-red-100/80 transition active:scale-[0.99] disabled:opacity-50"
                  >
                    <ShieldAlert className="h-4 w-4 text-red-700" />
                    {t.demo.simulateReplayBtn}
                  </button>
                </div>

                <div className="flex flex-col xs:flex-row gap-2 pt-1">
                  <button
                    onClick={() => {
                      setStamps(10);
                      addLog(
                        'Simulated customer reaching 10 stamps reward milestone.',
                        'success'
                      );
                    }}
                    className="flex-1 rounded-xl border border-stone-200 bg-stone-50 py-2 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition"
                  >
                    {t.demo.fastForwardBtn}
                  </button>
                  <button
                    onClick={handleReset}
                    className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition"
                  >
                    {t.demo.resetBtn}
                  </button>
                </div>
              </div>

              {/* Scanner Screen Visual Feedback */}
              <div
                className={`rounded-xl border p-5 text-center transition-all duration-200 ${
                  scanState === 'scanning'
                    ? 'border-[#E6D9C6] bg-[#F5EFE6]/60'
                    : scanState === 'success'
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : scanState === 'error'
                    ? 'border-red-200 bg-red-50'
                    : 'border-stone-200 bg-stone-50/60'
                }`}
              >
                {scanState === 'scanning' && (
                  <div className="space-y-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#4A3525] border-t-transparent mx-auto"></div>
                    <div className="text-xs font-semibold text-[#4A3525]">{t.demo.readingQr}</div>
                  </div>
                )}

                {scanState === 'success' && (
                  <div className="space-y-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-white font-bold">
                      <Check className="h-5 w-5 stroke-[2.5]" />
                    </div>
                    <div className="text-sm font-bold text-emerald-900">
                      {stamps === 0 ? t.demo.rewardSuccessTitle : t.demo.stampSuccessTitle}
                    </div>
                    <p className="text-xs text-stone-600">{t.demo.dbUpdatedNotice}</p>
                  </div>
                )}

                {scanState === 'error' && (
                  <div className="space-y-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-700 text-white font-bold">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-bold text-red-900">
                      {t.demo.scanRejectedTitle}
                    </div>
                    <p className="text-xs text-red-700 font-mono">{errorMessage}</p>
                  </div>
                )}

                {scanState === 'idle' && (
                  <div className="text-xs text-stone-500">{t.demo.awaitingScan}</div>
                )}
              </div>

              {/* Real-time Architecture & RabbitMQ Console */}
              <div className="rounded-xl border border-stone-200 bg-stone-900 p-4 text-stone-200">
                <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
                    <Terminal className="h-3.5 w-3.5 text-stone-400" />
                    <span>{t.demo.consoleHeading}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">{t.common.online}</span>
                </div>

                <div className="space-y-1.5 font-mono text-[11px] max-h-48 overflow-y-auto">
                  {eventLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-start gap-2 ${
                        log.type === 'success'
                          ? 'text-emerald-300'
                          : log.type === 'danger'
                          ? 'text-red-300 font-semibold'
                          : 'text-stone-300'
                      }`}
                    >
                      <span className="text-stone-500 shrink-0">[{log.time}]</span>
                      <span className="break-words min-w-0">{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Video Tutorial Modal (External Cloud / CDN Embed) */}
      <VideoTutorialModal
        open={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        defaultLang={isEs ? 'es' : 'en'}
      />

      {/* Real App Celebratory Confetti & Fanfare Modal on Reward Redemption */}
      <DemoRedeemCelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        reward={isEs ? '1 Bebida o Café Gratis' : '1 Free Coffee or Drink'}
        businessName={isEs ? 'Café de Especialidad Alpaca' : 'Alpaca Artisan Roasters'}
        isEs={isEs}
      />
    </div>
  );
}
export default DemoPage;
