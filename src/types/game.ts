// 12 Epochs of Ukrainian History
export type EpochId =
  | 'trypillia'        // 1-50
  | 'scythia'          // 51-100
  | 'antiquity'        // 101-150
  | 'kyiv_rus'         // 151-250
  | 'halych_volhynia'  // 251-320
  | 'polish_lithuanian' // 321-420
  | 'cossack'          // 421-550
  | 'hetmanate'        // 551-650
  | 'empire'           // 651-780
  | 'revolution'       // 781-850
  | 'soviet'           // 851-950
  | 'independence';    // 951+

export interface Epoch {
  id: EpochId;
  name: { ua: string; en: string };
  description: { ua: string; en: string };
  period: { ua: string; en: string };
  levelRange: { min: number; max: number };
  unlockLevel: number;
  currency: string;
  currencyIcon: string;
  generators: Generator[];
  color: string;
  bgGradient: string;
}

export interface Generator {
  id: string;
  name: { ua: string; en: string };
  description: { ua: string; en: string };
  baseCost: number;
  baseProduction: number;
  costMultiplier: number;
  icon: string;
}

export interface OwnedGenerator {
  generatorId: string;
  level: number;
}

export interface ActiveBoosters {
  // XP boost x2
  xp_boost_end?: number | null;
  xp_boost_mult?: number;
  // Currency boost x2
  currency_boost_end?: number | null;
  currency_boost_mult?: number;
  // Super boost x3 (XP + currency)
  super_boost_end?: number | null;
  super_boost_mult?: number;
  // Guaranteed legendary gacha drop
  legendary_next_gacha?: boolean;
  // Purchase log for refund support
  purchase_log?: Array<{ id: string; charge_id: string; purchased_at: string }>;
}

export interface GameState {
  epochId: EpochId;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXp: number;
  currency: number;
  totalCurrencyEarned: number;
  ownedGenerators: OwnedGenerator[];
  tapPower: number;
  passiveXpPerSecond: number;
  unlockedEpochs: EpochId[];
  lastSavedAt: number;
  // Artifact gacha
  artifactParts: Record<string, number>;
  completedArtifacts: string[];
  // Referral system
  referrerId?: number | null;
  referralsCount: number;
  referralEarnings: number;
  // Telegram Stars boosters
  activeBoosters: ActiveBoosters;
}

export interface LeaderboardEntry {
  telegram_id: number;
  first_name: string | null;
  username: string | null;
  level: number;
  total_xp: number;
  referrals_count: number;
  rank: number;
}

export interface TapEvent {
  id: string;
  x: number;
  y: number;
  value: number;
  createdAt: number;
}

export interface Artifact {
  id: string;
  name: { ua: string; en: string };
  epoch: EpochId;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  parts: number;
  bonus: {
    type: 'xp_multiplier' | 'currency_multiplier' | 'passive_boost';
    value: number;
  };
  icon: string;
}

// Telegram Mini App types
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
    query_id?: string;
    auth_date?: number;
    hash?: string;
    start_param?: string;
  };
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  platform: 'android' | 'ios' | 'tdesktop' | 'weba' | 'web';
  colorScheme: 'light' | 'dark';
  version: string;
  isVersionAtLeast: (version: string) => boolean;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{ type: string; text?: string }>;
  }, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  openTelegramLink: (url: string) => void;
  openLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: 'paid' | 'cancelled' | 'failed' | 'pending') => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
