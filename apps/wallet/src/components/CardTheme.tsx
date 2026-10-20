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

export function getWalletCardStyle(props: CampaignThemeProps): React.CSSProperties {
  const textColor = props.textColor || '#ffffff';
  let background = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';

  if (props.bgType === 'image' && props.bgImageUrl) {
    background = `linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.85)), url("${props.bgImageUrl}") center/cover no-repeat`;
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
  return preset?.stampActiveColor || '#4f46e5';
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
