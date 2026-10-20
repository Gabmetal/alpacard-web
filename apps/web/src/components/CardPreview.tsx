import React from 'react';
import {
  Coffee,
  Star,
  Sparkles,
  Heart,
  Gift,
  Cake,
  Crown,
  Tag,
} from 'lucide-react';
import { CARD_THEME_PRESETS } from '@alpacard/shared';

export interface CardPreviewProps {
  name: string;
  storeName?: string;
  reward?: string;
  stampsRequired: number;
  stampsCollected?: number;
  bgType?: string;
  bgValue?: string;
  bgImageUrl?: string;
  textColor?: string;
  stampIcon?: string;
  logoUrl?: string;
}

export function StampIconRenderer({
  icon,
  className,
}: {
  icon?: string;
  className?: string;
}) {
  switch (icon) {
    case 'star':
      return <Star className={className} />;
    case 'sparkle':
      return <Sparkles className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'gift':
      return <Gift className={className} />;
    case 'cupcake':
      return <Cake className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'tag':
      return <Tag className={className} />;
    case 'coffee':
    default:
      return <Coffee className={className} />;
  }
}

export function parseImageBgConfig(bgValue?: string): { mode: 'contain' | 'cover' | 'watermark'; color: string } {
  let mode: 'contain' | 'cover' | 'watermark' = 'contain';
  let color = '#1e293b';

  if (!bgValue) return { mode, color };

  if (bgValue.includes(':')) {
    const [m, c] = bgValue.split(':');
    if (m === 'cover' || m === 'contain' || m === 'watermark') mode = m;
    if (c) color = c;
  } else if (bgValue === 'cover' || bgValue === 'contain' || bgValue === 'watermark') {
    mode = bgValue;
  } else if (bgValue.startsWith('#') || bgValue.startsWith('rgb')) {
    color = bgValue;
  }

  return { mode, color };
}

export function getCardStyle(props: {
  bgType?: string;
  bgValue?: string;
  bgImageUrl?: string;
  textColor?: string;
}): React.CSSProperties {
  const textColor = props.textColor || '#ffffff';
  let background = 'linear-gradient(135deg, #2b1810 0%, #170d08 100%)';

  if (props.bgType === 'image' && props.bgImageUrl) {
    const { mode, color } = parseImageBgConfig(props.bgValue);
    if (mode === 'cover') {
      background = `linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.85)), url("${props.bgImageUrl}") center center / cover no-repeat, ${color}`;
    } else if (mode === 'watermark') {
      background = `linear-gradient(to bottom, rgba(15, 23, 42, 0.25), rgba(15, 23, 42, 0.6)), url("${props.bgImageUrl}") right 1.5rem center / contain no-repeat, ${color}`;
    } else {
      // Default: 'contain' perfectly centered
      background = `linear-gradient(to bottom, rgba(15, 23, 42, 0.35), rgba(15, 23, 42, 0.7)), url("${props.bgImageUrl}") center center / contain no-repeat, ${color}`;
    }
  } else if (props.bgType === 'color' && props.bgValue) {
    background = props.bgValue;
  } else if (props.bgType === 'gradient' && props.bgValue) {
    background = props.bgValue;
  } else if (props.bgValue) {
    const preset = CARD_THEME_PRESETS.find((p) => p.id === props.bgValue);
    if (preset) {
      background = preset.gradient;
    }
  }

  return {
    background,
    color: textColor,
  };
}

export function CardPreview({
  name,
  storeName = 'Alpacard Merchant',
  reward = 'Free Item',
  stampsRequired = 10,
  stampsCollected = 3,
  bgType = 'preset',
  bgValue = 'espresso',
  bgImageUrl = '',
  textColor = '#ffffff',
  stampIcon = 'coffee',
  logoUrl = '',
}: CardPreviewProps) {
  const preset = CARD_THEME_PRESETS.find((p) => p.id === bgValue);
  const activeStampColor = preset?.stampActiveColor || '#f59e0b';
  const isLightText = textColor.toLowerCase() === '#ffffff' || textColor.toLowerCase() === '#fff';

  return (
    <div
      style={getCardStyle({ bgType, bgValue, bgImageUrl, textColor })}
      className="relative overflow-hidden rounded-3xl p-5 shadow-2xl transition-all duration-300 border border-white/10"
    >
      {/* Decorative Card Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/20 backdrop-blur-md p-1.5 shadow-md shrink-0 overflow-hidden">
              <img
                src={logoUrl}
                alt="Store Logo"
                className="max-h-full max-w-full object-contain object-center"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-sm text-lg font-black shrink-0">
              🦙
            </div>
          )}
          <div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isLightText ? 'text-white/70' : 'text-gray-600'
              }`}
            >
              {storeName}
            </span>
            <h3 className="text-base font-extrabold leading-tight line-clamp-1">{name || 'Loyalty Card'}</h3>
          </div>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase backdrop-blur-md ${
            isLightText
              ? 'bg-white/15 text-white border border-white/20'
              : 'bg-black/10 text-gray-900 border border-black/10'
          }`}
        >
          {stampsRequired} Stamps
        </span>
      </div>

      {/* Reward description tag */}
      <div className="mt-3">
        <div
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold backdrop-blur-md ${
            isLightText
              ? 'bg-white/10 text-white/90 border border-white/10'
              : 'bg-black/5 text-gray-800 border border-black/10'
          }`}
        >
          <span>🎁</span>
          <span className="line-clamp-1">{reward || 'Free Reward'}</span>
        </div>
      </div>

      {/* Stamp Matrix Preview */}
      <div className="mt-5 rounded-2xl bg-black/20 p-3.5 backdrop-blur-md border border-white/10">
        <div className="flex items-center justify-between text-[11px] font-semibold mb-2.5 opacity-90">
          <span>Stamps Preview</span>
          <span style={{ color: activeStampColor }} className="font-bold">
            {stampsCollected} / {stampsRequired}
          </span>
        </div>

        {/* Dynamic Stamp Grid (showing max 10 circles in preview for compactness) */}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: Math.min(10, stampsRequired) }).map((_, idx) => {
            const isStamped = idx < stampsCollected;
            const isLast = idx === Math.min(10, stampsRequired) - 1;

            return (
              <div
                key={idx}
                className={`flex aspect-square items-center justify-center rounded-xl transition-all ${
                  isStamped
                    ? 'shadow-md text-white'
                    : isLast
                    ? 'border-2 border-dashed border-amber-300 bg-amber-400/20 text-amber-200'
                    : 'border-2 border-dashed border-white/20 bg-white/5 text-white/40'
                }`}
                style={
                  isStamped
                    ? { backgroundColor: activeStampColor, borderColor: activeStampColor }
                    : undefined
                }
              >
                {isStamped ? (
                  <StampIconRenderer icon={stampIcon} className="h-4 w-4 stroke-[2.5]" />
                ) : isLast ? (
                  <Gift className="h-4 w-4 animate-bounce" />
                ) : (
                  <span className="text-[10px] font-bold">{idx + 1}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Footer Subtext */}
      <div className="mt-4 flex items-center justify-between text-[10px] opacity-70">
        <span>Digital Punch Card • Alpacard</span>
        <span className="font-mono">PWA WALLET READY</span>
      </div>
    </div>
  );
}
