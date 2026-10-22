import React, { useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Gift, Trophy, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { playRedemptionFanfare, playTapPopSound } from '../utils/audio';
import { useLanguage } from '../i18n/LanguageContext';

export interface RedeemCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: string;
  businessName: string;
  logoUrl?: string;
  brandColor?: string;
}

export function RedeemCelebrationModal({
  isOpen,
  onClose,
  reward,
  businessName,
  logoUrl,
  brandColor = '#4A3525',
}: RedeemCelebrationModalProps) {
  const { t } = useLanguage();
  const timeoutsRef = useRef<number[]>([]);

  const triggerEpicConfetti = useCallback(() => {
    // Left Cannon
    confetti({
      particleCount: 65,
      angle: 60,
      spread: 60,
      origin: { x: 0.05, y: 0.7 },
      colors: ['#FFD700', '#FFA500', '#FF4500', '#10B981', '#6366F1', '#EC4899'],
    });

    // Right Cannon
    confetti({
      particleCount: 65,
      angle: 120,
      spread: 60,
      origin: { x: 0.95, y: 0.7 },
      colors: ['#FFD700', '#FFA500', '#FF4500', '#10B981', '#6366F1', '#EC4899'],
    });

    // Star Shower from top center
    const t1 = window.setTimeout(() => {
      confetti({
        particleCount: 45,
        spread: 90,
        origin: { x: 0.5, y: 0.25 },
        shapes: ['star'],
        scalar: 1.3,
        colors: ['#F59E0B', '#FBBF24', '#FDE047', '#FFFFFF'],
      });
    }, 280);

    // Big Center Burst
    const t2 = window.setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { x: 0.5, y: 0.55 },
        colors: ['#FFD700', '#F97316', '#EF4444', '#06B6D4', '#8B5CF6'],
      });
    }, 550);

    timeoutsRef.current.push(t1, t2);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Play triumphant synth fanfare
    playRedemptionFanfare();

    // Trigger initial celebration fireworks
    triggerEpicConfetti();

    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, [isOpen, triggerEpicConfetti]);

  // Interactive screen tapping spawns micro-bursts of confetti under user's finger!
  const handleInteractiveTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    // Avoid double firing if target is button
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    let clientX = window.innerWidth / 2;
    let clientY = window.innerHeight / 2;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = Math.max(0, Math.min(1, clientX / window.innerWidth));
    const y = Math.max(0, Math.min(1, clientY / window.innerHeight));

    confetti({
      particleCount: 25,
      spread: 50,
      origin: { x, y },
      scalar: 1.1,
      shapes: ['star', 'circle'],
      colors: ['#FFD700', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'],
    });

    playTapPopSound();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleInteractiveTap}
      onTouchStart={handleInteractiveTap}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 backdrop-blur-md p-4 select-none"
    >
      {/* Background Rotating Sunburst Ray Effect */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-30">
        <div
          className="h-[800px] w-[800px] rounded-full animate-spin-slow"
          style={{
            background:
              'repeating-conic-gradient(from 0deg, rgba(251, 191, 36, 0.4) 0deg 15deg, transparent 15deg 30deg)',
          }}
        />
      </div>

      {/* Floating Sparkle Embellishments */}
      <div className="pointer-events-none absolute top-12 left-8 text-3xl animate-float-bob opacity-80">
        ✨
      </div>
      <div className="pointer-events-none absolute top-20 right-10 text-3xl animate-float-bob-reverse opacity-80">
        ⭐
      </div>
      <div className="pointer-events-none absolute bottom-16 left-12 text-3xl animate-float-bob opacity-70">
        🎉
      </div>
      <div className="pointer-events-none absolute bottom-24 right-8 text-3xl animate-float-bob-reverse opacity-70">
        🏆
      </div>

      {/* Main Celebration Card Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl border-2 border-amber-300/80 bg-gradient-to-b from-stone-900 via-[#1C1613] to-stone-950 p-6 sm:p-7 text-center text-white shadow-2xl animate-pop-in overflow-hidden"
        style={{
          boxShadow: '0 0 50px 8px rgba(245, 158, 11, 0.45), 0 25px 50px -12px rgba(0, 0, 0, 0.9)',
        }}
      >
        {/* Subtle holographic sheen overlay on modal */}
        <div className="pointer-events-none absolute -inset-full animate-sheen bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition active:scale-95"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero Trophy & Shockwave Rings */}
        <div className="relative mx-auto mt-2 flex h-28 w-28 items-center justify-center">
          {/* Shockwave Rings */}
          <div className="absolute inset-0 rounded-full border-2 border-amber-400/60 animate-pulse-ring" />
          <div
            className="absolute -inset-3 rounded-full border-2 border-yellow-300/40 animate-pulse-ring"
            style={{ animationDelay: '0.6s' }}
          />

          {/* Golden Badge Glow Backing */}
          <div className="absolute inset-1 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 shadow-lg blur-md opacity-80 animate-pulse" />

          {/* Golden Hero Box Container */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-0.5 shadow-xl border border-yellow-100">
            <div className="flex h-full w-full items-center justify-center rounded-[22px] bg-gradient-to-b from-[#2E2015] to-[#140E0A]">
              <Trophy className="h-12 w-12 text-amber-300 drop-shadow-[0_4px_10px_rgba(251,191,36,0.6)] animate-bounce" />
            </div>
            {/* Corner Sparkle Badges */}
            <div className="absolute -top-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 text-stone-900 shadow-md">
              <Sparkles className="h-4 w-4 text-stone-900 fill-stone-900" />
            </div>
          </div>
        </div>

        {/* Celebration Title & Badge */}
        <div className="mt-5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400/25 via-yellow-300/35 to-amber-400/25 border border-amber-300/60 px-3.5 py-1 text-[11px] font-black uppercase tracking-widest text-amber-300 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-amber-300" />
            <span>{t.redeemCelebrationRewardBadge}</span>
          </div>

          <h2 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-amber-200 to-yellow-300">
            {t.redeemCelebrationTitle}
          </h2>

          {/* Store Name & Logo */}
          <div className="mt-2 flex items-center justify-center gap-2">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName}
                className="h-5 w-5 rounded-md object-contain bg-white/10 p-0.5 border border-white/20"
              />
            ) : null}
            <span className="text-xs font-bold text-stone-300 uppercase tracking-wide">
              {businessName}
            </span>
          </div>
        </div>

        {/* Golden Ticket Ribbon Presentation */}
        <div className="mt-4 rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-950/40 via-stone-900 to-amber-950/30 p-4 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
            {t.rewardLabel}
          </div>
          <div className="mt-1 text-base sm:text-lg font-black text-amber-100 flex items-center justify-center gap-2">
            <Gift className="h-5 w-5 text-amber-300 shrink-0" />
            <span className="break-words">{reward || 'Free Reward'}</span>
          </div>
          <p className="mt-2 text-[11px] text-stone-400 font-medium leading-relaxed">
            {t.redeemCelebrationCongrats}
          </p>
        </div>

        {/* Interactive Tap Prompt */}
        <div className="mt-3 text-[11px] font-semibold text-amber-300/90 flex items-center justify-center gap-1.5 animate-pulse">
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span>{t.redeemCelebrationTapPrompt}</span>
        </div>

        {/* Main Enjoy Reward CTA */}
        <div className="mt-5">
          <button
            type="button"
            onClick={onClose}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 py-3.5 px-6 font-black text-stone-950 shadow-lg shadow-amber-500/25 transition active:scale-95 hover:brightness-105"
            style={{ backgroundColor: brandColor }}
          >
            {/* Sliding sheen light bar */}
            <span className="pointer-events-none absolute -inset-full animate-sheen bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            <span className="relative flex items-center justify-center gap-2 text-sm sm:text-base font-black tracking-wide">
              <span>{t.redeemCelebrationActionBtn}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
