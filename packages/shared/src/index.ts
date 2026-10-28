export type Role = 'CONSUMER' | 'STAFF' | 'OWNER' | 'ADMIN';

export type TransactionType = 'EARN' | 'REDEEM';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isAnonymous?: boolean;
  emailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
  ownedBusinesses?: Business[];
  staffAt?: Business[];
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  ownerId: string;
  owner?: User;
  staff?: User[];
  campaigns?: Campaign[];
  createdAt: string;
}

export type CardBgType = 'preset' | 'color' | 'gradient' | 'image';
export type CardStampIcon = 'coffee' | 'star' | 'sparkle' | 'heart' | 'gift' | 'cupcake' | 'crown' | 'tag';

export interface CardThemePreset {
  id: string;
  name: string;
  nameEs: string;
  gradient: string;
  textColor: string;
  stampActiveColor: string;
  stampInactiveColor: string;
  accentColor: string;
  icon: CardStampIcon;
}

export const CARD_THEME_PRESETS: CardThemePreset[] = [
  {
    id: 'espresso',
    name: 'Espresso Artisan',
    nameEs: 'Café Artesanal',
    gradient: 'linear-gradient(135deg, #2b1810 0%, #170d08 100%)',
    textColor: '#ffffff',
    stampActiveColor: '#f59e0b',
    stampInactiveColor: 'rgba(255, 255, 255, 0.15)',
    accentColor: '#f59e0b',
    icon: 'coffee',
  },
  {
    id: 'neon',
    name: 'Neon Cyber Alpaca',
    nameEs: 'Cíber Alpaca Neón',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
    textColor: '#ffffff',
    stampActiveColor: '#38bdf8',
    stampInactiveColor: 'rgba(255, 255, 255, 0.2)',
    accentColor: '#38bdf8',
    icon: 'sparkle',
  },
  {
    id: 'emerald',
    name: 'Emerald Matcha',
    nameEs: 'Matcha Esmeralda',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
    textColor: '#ffffff',
    stampActiveColor: '#34d399',
    stampInactiveColor: 'rgba(255, 255, 255, 0.15)',
    accentColor: '#34d399',
    icon: 'star',
  },
  {
    id: 'midnight',
    name: 'Midnight Velvet',
    nameEs: 'Terciopelo Nocturno',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
    textColor: '#ffffff',
    stampActiveColor: '#818cf8',
    stampInactiveColor: 'rgba(255, 255, 255, 0.15)',
    accentColor: '#818cf8',
    icon: 'crown',
  },
  {
    id: 'sunset',
    name: 'Golden Sunset',
    nameEs: 'Atardecer Dorado',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #c026d3 100%)',
    textColor: '#ffffff',
    stampActiveColor: '#fde047',
    stampInactiveColor: 'rgba(255, 255, 255, 0.2)',
    accentColor: '#fde047',
    icon: 'heart',
  },
  {
    id: 'bakery',
    name: 'Sweet Bakery',
    nameEs: 'Pastelería Pastel',
    gradient: 'linear-gradient(135deg, #831843 0%, #db2777 50%, #f472b6 100%)',
    textColor: '#ffffff',
    stampActiveColor: '#fef08a',
    stampInactiveColor: 'rgba(255, 255, 255, 0.2)',
    accentColor: '#fbcfe8',
    icon: 'cupcake',
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    nameEs: 'Brisa Marina',
    gradient: 'linear-gradient(135deg, #0369a1 0%, #0891b2 50%, #0d9488 100%)',
    textColor: '#ffffff',
    stampActiveColor: '#67e8f9',
    stampInactiveColor: 'rgba(255, 255, 255, 0.18)',
    accentColor: '#67e8f9',
    icon: 'gift',
  },
  {
    id: 'minimal',
    name: 'Carbon Minimal',
    nameEs: 'Carbón Minimalista',
    gradient: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
    textColor: '#f4f4f5',
    stampActiveColor: '#e4e4e7',
    stampInactiveColor: 'rgba(255, 255, 255, 0.1)',
    accentColor: '#a1a1aa',
    icon: 'tag',
  },
];

export interface Campaign {
  id: string;
  businessId: string;
  business?: Business;
  name: string;
  description: string;
  stampsRequired: number;
  reward: string;
  logoUrl?: string;
  bgType?: CardBgType;
  bgValue?: string;
  bgImageUrl?: string;
  textColor?: string;
  stampIcon?: CardStampIcon;
  isActive: boolean;
  cardsCount?: number;
  createdAt: string;
}

export interface Card {
  id: string;
  campaignId: string;
  campaign?: Campaign;
  userId: string;
  user?: User;
  stamps: number;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  cardId: string;
  card?: Card;
  staffId: string;
  staff?: User;
  businessId: string;
  tokenJti: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CardQRResponse {
  token: string;
  jti: string;
  expiresIn: number;
  scanUrl: string;
  card: Card;
  timestamp: number;
}

export interface ScanResponse {
  success: boolean;
  action: 'EARN' | 'REDEEM';
  message: string;
  newCount: number;
  card: Card;
}

export interface DashboardStats {
  campaignsCount: number;
  staffCount: number;
  cardsCount: number;
  totalStampsIssued: number;
  rewardsRedeemed: number;
  recentTransactions: Transaction[];
}
