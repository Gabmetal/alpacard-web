import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import {
  ArrowLeft,
  Sparkles,
  QrCode,
  ShieldAlert,
  Smartphone,
  RefreshCw,
  Gift,
  Check,
  Zap,
  Terminal,
  Activity,
  Award
} from 'lucide-react';

export function DemoPage() {
  const { t } = useLanguage();
  const [stamps, setStamps] = useState(7);
  const maxStamps = 10;
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [eventLogs, setEventLogs] = useState<Array<{ id: string; time: string; text: string; type: 'info' | 'success' | 'danger' }>>([
    {
      id: 'init-1',
      time: '15:40:02',
      text: 'Connected to RabbitMQ exchange "alpacard.events" (direct)',
      type: 'info'
    },
    {
      id: 'init-2',
      time: '15:40:02',
      text: 'PostgreSQL connection pool ready: 10 connections alive',
      type: 'info'
    }
  ]);
  const [timerSeconds, setTimerSeconds] = useState(285);

  const playAudio = (type: 'beep' | 'success' | 'error') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      if (type === 'beep') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
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
          gain.connect(ctx.destination);
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
        gain.connect(ctx.destination);
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
      ...prev.slice(0, 19)
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
      playAudio('success');

      const isCompleted = nextStamps >= maxStamps;
      addLog(`[HTTP 200] POST /api/scan -> Stamp added (${nextStamps}/${maxStamps}). Atomic JTI marked spent.`, 'success');
      addLog(`[RabbitMQ] Emitted event "stamp.punched" -> customer_id=c_9a82, count=${nextStamps}`, 'info');

      if (isCompleted) {
        addLog(`[Reward Unlocked] Customer card reached ${maxStamps} stamps! Reward coupon issued.`, 'success');
      }

      setTimeout(() => {
        setScanState('idle');
      }, 1800);
    }, 700);
  };

  const handleRedeemReward = () => {
    setScanState('scanning');
    playAudio('beep');

    setTimeout(() => {
      setStamps(0);
      setScanState('success');
      playAudio('success');
      addLog(`[HTTP 200] POST /api/scan -> Reward REDEEMED! 10 stamps converted to voucher #REWARD-${Math.floor(Math.random() * 9000 + 1000)}`, 'success');
      addLog(`[RabbitMQ] Emitted event "reward.redeemed" -> customer_id=c_9a82, business=Alpaca Roasters`, 'info');

      setTimeout(() => {
        setScanState('idle');
      }, 1800);
    }, 700);
  };

  const handleSimulateReplayAttack = () => {
    setScanState('scanning');
    playAudio('beep');

    setTimeout(() => {
      setScanState('error');
      setErrorMessage(t.demo.replayAlertText);
      playAudio('error');
      addLog(`[SECURITY ALERT] Replay attack blocked! Duplicate JTI detected in Redis/DB atomic table.`, 'danger');
      addLog(`[HTTP 409 Conflict] Token replay prohibited. Audit log flagged IP: 192.168.1.144`, 'danger');

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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition">
              <ArrowLeft className="h-4 w-4" />
              {t.common.back}
            </Link>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-base font-black text-white">{t.nav.liveDemo}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="dark" />
            <Link
              to="/docs"
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              {t.nav.docs}
            </Link>
            <Link
              to="/login"
              className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow"
            >
              {t.nav.console}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Simulation Workspace */}
      <main className="mx-auto max-w-7xl w-full flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center max-w-2xl mx-auto space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            {t.demo.badge}
          </span>
          <h1 className="text-3xl font-black text-white sm:text-4xl">
            {t.demo.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {t.demo.subtitle}
          </p>
        </div>

        {/* Simulation Grid */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* LEFT: Customer Phone View */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-indigo-400">
              <Smartphone className="h-4 w-4" /> {t.demo.customerTitle}
            </div>

            {/* Mobile Phone Mockup Frame */}
            <div className="w-full max-w-[340px] rounded-[40px] border-4 border-slate-700 bg-slate-900 p-3 shadow-2xl shadow-indigo-950/40 relative">
              {/* Dynamic Island */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 h-4 w-28 rounded-full bg-slate-800 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-slate-950 mr-2"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-900"></div>
              </div>

              {/* Screen Area */}
              <div className="rounded-[32px] bg-slate-950 p-4 pt-7 text-slate-100 min-h-[580px] flex flex-col justify-between border border-slate-800/80">
                {/* PWA App Bar */}
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <img src="/alpacard-logo.jpg" alt="Alpacard" className="h-6 w-6 rounded-md object-cover" />
                      <span className="text-xs font-black tracking-tight text-white">Alpaca Wallet</span>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                      {t.demo.pwaActiveBadge}
                    </span>
                  </div>

                  {/* Loyalty Card UI */}
                  <div className="mt-4 rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 p-4 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 opacity-10">
                      <Award className="h-32 w-32" />
                    </div>

                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-200">
                          {t.demo.cardTier}
                        </span>
                        <h3 className="text-base font-black">{t.demo.cardName}</h3>
                      </div>
                      <span className="rounded bg-white/20 px-2 py-0.5 text-[9px] font-bold backdrop-blur-xs">
                        {stamps >= maxStamps ? t.demo.rewardReady : t.demo.inProgress}
                      </span>
                    </div>

                    {/* Stamp Circles */}
                    <div className="mt-5 grid grid-cols-5 gap-2">
                      {Array.from({ length: maxStamps }).map((_, i) => {
                        const isStamped = i < stamps;
                        const isReward = i === maxStamps - 1;
                        return (
                          <div
                            key={i}
                            className={`aspect-square rounded-xl border flex items-center justify-center transition-all duration-300 ${
                              isStamped
                                ? 'border-amber-400 bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/30 scale-100'
                                : isReward
                                ? 'border-dashed border-amber-300 bg-amber-400/20 text-amber-200 animate-pulse'
                                : 'border-white/20 bg-white/10 text-white/50'
                            }`}
                          >
                            {isStamped ? (
                              <Check className="h-4 w-4 stroke-[3]" />
                            ) : isReward ? (
                              <Gift className="h-4 w-4" />
                            ) : (
                              <span className="text-[10px] font-bold">{i + 1}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] text-indigo-200 font-semibold border-t border-white/10 pt-2">
                      <span>{stamps} / {maxStamps} {t.demo.stampsCollected}</span>
                      <span>{stamps >= maxStamps ? t.demo.freeRewardAvailable : `${maxStamps - stamps} ${t.demo.remainingToReward}`}</span>
                    </div>
                  </div>

                  {/* Customer QR Code Presentation */}
                  <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center">
                    <div className="text-[11px] font-bold text-slate-300 mb-2">
                      {t.demo.showQrInstructions}
                    </div>

                    <div className="mx-auto w-40 h-40 rounded-xl bg-white p-2.5 shadow-md flex items-center justify-center relative">
                      {scanState === 'scanning' && (
                        <div className="absolute inset-x-2 top-0 h-1 bg-red-500 shadow-lg shadow-red-500/80 animate-bounce"></div>
                      )}
                      <QrCode className="h-full w-full text-slate-950" />
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <RefreshCw className="h-3 w-3 animate-spin text-indigo-400" />
                      <span>{t.demo.singleUseToken} {formatTimer(timerSeconds)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-center text-[10px] text-slate-500">
                  {t.demo.pwaFooter}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Merchant Cashier Terminal */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Activity className="h-4 w-4" /> {t.demo.cashierTitle}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md space-y-6">
              {/* Cashier Status Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">{t.demo.stationName}</h3>
                  <p className="text-xs text-slate-400">{t.demo.operatorLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    {t.demo.scannerReady}
                  </span>
                </div>
              </div>

              {/* Interactive Action Triggers */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-300">{t.demo.actionsHeading}</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handlePerformStamp}
                    disabled={scanState === 'scanning'}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-3.5 text-xs font-black text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition active:scale-95 disabled:opacity-50"
                  >
                    <Zap className="h-4 w-4" />
                    {stamps >= maxStamps ? t.demo.redeemAction : t.demo.punchAction}
                  </button>

                  <button
                    onClick={handleSimulateReplayAttack}
                    disabled={scanState === 'scanning'}
                    className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition active:scale-95 disabled:opacity-50"
                  >
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    {t.demo.simulateReplayBtn}
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setStamps(10);
                      addLog('Simulated customer reaching 10 stamps reward milestone.', 'success');
                    }}
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-800/80 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                  >
                    {t.demo.fastForwardBtn}
                  </button>
                  <button
                    onClick={handleReset}
                    className="rounded-xl border border-slate-800 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    {t.demo.resetBtn}
                  </button>
                </div>
              </div>

              {/* Scanner Screen Visual Feedback */}
              <div
                className={`rounded-2xl border p-5 text-center transition-all duration-300 ${
                  scanState === 'scanning'
                    ? 'border-indigo-500 bg-indigo-500/10'
                    : scanState === 'success'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : scanState === 'error'
                    ? 'border-rose-500 bg-rose-500/20'
                    : 'border-slate-800 bg-slate-950/60'
                }`}
              >
                {scanState === 'scanning' && (
                  <div className="space-y-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent mx-auto"></div>
                    <div className="text-xs font-bold text-indigo-400">{t.demo.readingQr}</div>
                  </div>
                )}

                {scanState === 'success' && (
                  <div className="space-y-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-slate-950 font-black">
                      <Check className="h-5 w-5 stroke-[3]" />
                    </div>
                    <div className="text-sm font-black text-emerald-400">
                      {stamps === 0 ? t.demo.rewardSuccessTitle : t.demo.stampSuccessTitle}
                    </div>
                    <p className="text-xs text-slate-400">{t.demo.dbUpdatedNotice}</p>
                  </div>
                )}

                {scanState === 'error' && (
                  <div className="space-y-1">
                    <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white font-black">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-black text-rose-400">{t.demo.scanRejectedTitle}</div>
                    <p className="text-xs text-rose-300 font-mono">{errorMessage}</p>
                  </div>
                )}

                {scanState === 'idle' && (
                  <div className="text-xs text-slate-500">
                    {t.demo.awaitingScan}
                  </div>
                )}
              </div>

              {/* Real-time Architecture & RabbitMQ Console */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                    <Terminal className="h-3.5 w-3.5 text-indigo-400" />
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
                          ? 'text-emerald-400'
                          : log.type === 'danger'
                          ? 'text-rose-400 font-bold'
                          : 'text-slate-400'
                      }`}
                    >
                      <span className="text-slate-600 shrink-0">[{log.time}]</span>
                      <span>{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
export default DemoPage;