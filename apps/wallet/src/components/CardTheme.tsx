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

export interface CampaignThemeProps {
  bgType?: string;
  bgValue?: string;
  bgImageUrl?: string;
  textColor?: string;
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

export function getWalletCardStyle(props: CampaignThemeProps): React.CSSProperties {
  const textColor = props.textColor || '#ffffff';
  let background = 'linear-gradient(135deg, #2C221E 0%, #4A3525 100%)';

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

export function getActiveStampColor(bgValue?: string): string {
  const preset = CARD_THEME_PRESETS.find((p) => p.id === bgValue);
  return preset?.stampActiveColor || '#4A3525';
}

export function WalletStampIcon({
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
