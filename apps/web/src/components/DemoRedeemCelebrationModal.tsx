import React, { useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Gift, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { playRedemptionFanfare, playTapPopSound } from '../utils/audio';

export interface DemoRedeemCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: string;
  businessName: string;
  isEs?: boolean;
}

export function DemoRedeemCelebrationModal({
  isOpen,
  onClose,
  reward,
  businessName,
  isEs = false,
}: DemoRedeemCelebrationModalProps) {
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

    playTapPopSound();

    confetti({
      particleCount: 20,
      spread: 55,
      origin: {
        x: Math.max(0, Math.min(1, clientX / window.innerWidth)),
        y: Math.max(0, Math.min(1, clientY / window.innerHeight)),
      },
      colors: ['#FFD700', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#A855F7'],
      scalar: 0.9,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleInteractiveTap}
      onTouchStart={handleInteractiveTap}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300 select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-[32px] bg-gradient-to-b from-stone-900 via-stone-900 to-[#1F1714] border-2 border-amber-400/60 p-6 text-center text-white shadow-2xl shadow-amber-500/20 animate-in zoom-in-90 duration-300 overflow-hidden"
      >
        {/* Subtle glowing animated background disc */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-yellow-500/20 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white/80 transition hover:bg-white/20 hover:text-white active:scale-90"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Reward Icon Crown */}
        <div className="relative mx-auto mt-2 mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 shadow-xl shadow-amber-500/40 animate-bounce">
          <Gift className="h-10 w-10 text-stone-950 stroke-[2.2]" />
          <div className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-stone-900 shadow-md">
            <Sparkles className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          </div>
        </div>

        {/* Header Badges */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 px-3 py-1 text-[11px] font-black tracking-wider text-amber-300 uppercase mb-2">
          <Sparkles className="h-3 w-3 fill-amber-300" />
          <span>{isEs ? '¡PREMIO DESBLOQUEADO!' : 'REWARD UNLOCKED!'}</span>
        </div>

        <h3 className="text-2xl font-black tracking-tight text-white">
          {isEs ? '¡Premio Canjeado!' : 'Reward Claimed!'}
        </h3>
        <p className="mt-1 text-xs text-stone-300 max-w-xs mx-auto">
          {isEs
            ? 'Tu tarjeta de sellos ha sido canjeada con éxito en '
            : 'Your loyalty stamps were successfully redeemed at '}
          <strong className="text-amber-300 font-bold">{businessName}</strong>.
        </p>

        {/* Big Reward Display Box */}
        <div className="mt-5 rounded-2xl bg-white/10 border border-white/15 p-4 backdrop-blur-sm">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300/90">
            {isEs ? 'Tu Recompensa' : 'Your Reward'}
          </span>
          <p className="mt-1 text-lg font-black text-white leading-tight">
            🎁 {reward}
          </p>
        </div>

        {/* Interactive screen tap invitation */}
        <p className="mt-4 text-[11px] font-medium text-amber-200/80 animate-pulse">
          ✨ {isEs ? '¡Toca la pantalla para más fuegos artificiales!' : 'Tap anywhere on the screen for fireworks!'} ✨
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 py-3.5 text-xs sm:text-sm font-black text-stone-950 shadow-lg shadow-amber-500/30 transition hover:brightness-105 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4 stroke-[2.5]" />
          <span>{isEs ? '¡Genial! Disfrutar Premio' : 'Awesome! Enjoy Reward'}</span>
        </button>
      </div>
    </div>
  );
}
