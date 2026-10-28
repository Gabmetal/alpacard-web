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
export declare const CARD_THEME_PRESETS: CardThemePreset[];
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
