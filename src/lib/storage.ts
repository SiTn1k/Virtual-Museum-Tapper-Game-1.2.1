import { supabase } from './supabase';
import { GameState, EpochId, OwnedGenerator, LeaderboardEntry, ActiveBoosters } from '../types/game';
import { getTelegramWebApp } from './telegram';

const LOCAL_STORAGE_KEY = 'ukraine_tap_game_state';
const DEVICE_ID_KEY = 'ukraine_tap_device_id';
const XP_BASE = 100;
const XP_MULTIPLIER = 1.5;

export const REFERRER_BONUS = 100;
export const NEW_USER_BONUS = 50;

function calculateXpToLevel(level: number): number {
  return Math.floor(XP_BASE * Math.pow(XP_MULTIPLIER, level - 1));
}

// Ensure JSONB values are proper objects/arrays, not strings
function ensureJson<T>(value: T | string): T {
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { /* fall through */ }
  }
  return value as T;
}

// Ensure IDs are positive numbers or null (never 0)
function sanitizeId(value: number | null | undefined): number | null {
  return value && value > 0 ? value : null;
}

// Generates a stable UUID for this device, stored in localStorage
function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'dev_' + crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getTelegramUserId(): number | null {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user?.id || null;
}

export function getTelegramUserInfo(): {
  id: number;
  username?: string;
  first_name?: string;
  photo_url?: string;
} | null {
  const tg = getTelegramWebApp();
  const user = tg?.initDataUnsafe?.user;
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    first_name: user.first_name,
    photo_url: user.photo_url,
  };
}

export function getReferrerId(): number | null {
  const tg = getTelegramWebApp();
  const startParam = tg?.initDataUnsafe?.start_param;
  if (startParam?.startsWith('ref_')) {
    const refId = parseInt(startParam.replace('ref_', ''), 10);
    return isNaN(refId) ? null : refId;
  }
  return null;
}

export async function saveGameState(state: GameState): Promise<void> {
  // Always save locally first
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      ...state,
      lastSavedAt: Date.now(),
    }));
  } catch (e) {
    console.error('localStorage save failed:', e);
  }

  if (!supabase) return;

  const telegramId = getTelegramUserId();
  const userInfo = getTelegramUserInfo();
  const deviceId = getDeviceId();

  const payload = {
    epoch_id: state.epochId,
    level: state.level,
    xp: state.xp,
    xp_to_next_level: state.xpToNextLevel,
    total_xp: state.totalXp,
    currency: state.currency,
    total_currency_earned: state.totalCurrencyEarned,
    tap_power: state.tapPower,
    passive_xp_per_second: state.passiveXpPerSecond,
    owned_generators: ensureJson(state.ownedGenerators) as OwnedGenerator[],
    unlocked_epochs: ensureJson(state.unlockedEpochs) as string[],
    artifact_parts: ensureJson(state.artifactParts || {}) as Record<string, number>,
    completed_artifacts: ensureJson(state.completedArtifacts || []) as string[],
    referrer_id: sanitizeId(state.referrerId),
    referrals_count: state.referralsCount || 0,
    referral_earnings: state.referralEarnings || 0,
    username: userInfo?.username || null,
    first_name: userInfo?.first_name || null,
    photo_url: userInfo?.photo_url || null,
    last_saved_at: new Date().toISOString(),
    active_boosters: state.activeBoosters || {},
  };

  try {
    if (telegramId) {
      const { error } = await supabase
        .from('game_progress')
        .upsert({ ...payload, telegram_id: telegramId }, { onConflict: 'telegram_id' });
      if (error) throw error;

      // Clean up orphaned device_id record for this session
      await supabase
        .from('game_progress')
        .delete()
        .eq('device_id', deviceId)
        .is('telegram_id', null);
    } else {
      const { data: existing } = await supabase
        .from('game_progress')
        .select('id')
        .eq('device_id', deviceId)
        .is('telegram_id', null)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('game_progress')
          .update(payload)
          .eq('device_id', deviceId)
          .is('telegram_id', null);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('game_progress')
          .insert({ ...payload, device_id: deviceId });
        if (error) throw error;
      }
    }
  } catch (e) {
    console.error('Supabase save failed:', e);
  }
}

export async function loadGameState(): Promise<GameState | null> {
  const telegramId = getTelegramUserId();
  const referrerId = getReferrerId();
  const deviceId = getDeviceId();

  if (supabase) {
    try {
      // Try telegram_id first, then device_id
      const { data } = telegramId
        ? await supabase
            .from('game_progress')
            .select('*')
            .eq('telegram_id', telegramId)
            .maybeSingle()
        : await supabase
            .from('game_progress')
            .select('*')
            .eq('device_id', deviceId)
            .is('telegram_id', null)
            .maybeSingle();

      if (data) {
        return hydrateFromDb(data);
      }

      // New Telegram user — create row immediately so they appear in the DB right away
      if (telegramId) {
        const userInfo = getTelegramUserInfo();
        let bonus = 20;

        if (referrerId && referrerId !== telegramId) {
          await applyReferralBonus(telegramId, referrerId);
          bonus = 20 + NEW_USER_BONUS;
        }

        const newRow = {
          telegram_id: telegramId,
          epoch_id: 'trypillia',
          level: 1,
          xp: 0,
          xp_to_next_level: 100,
          total_xp: 0,
          currency: bonus,
          total_currency_earned: bonus,
          tap_power: 1,
          passive_xp_per_second: 0,
          owned_generators: [],
          unlocked_epochs: ['trypillia'],
          artifact_parts: {},
          completed_artifacts: [],
          referrer_id: referrerId && referrerId !== telegramId ? sanitizeId(referrerId) : null,
          referrals_count: 0,
          referral_earnings: 0,
          active_boosters: {},
          username: userInfo?.username ?? null,
          first_name: userInfo?.first_name ?? null,
          photo_url: userInfo?.photo_url ?? null,
          last_saved_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('game_progress').insert(newRow);
        if (error) console.error('New user insert failed:', error);

        const hasRef = Boolean(referrerId && referrerId !== telegramId);
        return {
          epochId: 'trypillia',
          level: 1,
          xp: 0,
          xpToNextLevel: calculateXpToLevel(1),
          totalXp: 0,
          currency: bonus,
          totalCurrencyEarned: bonus,
          tapPower: 1,
          passiveXpPerSecond: 0,
          ownedGenerators: [],
          unlockedEpochs: ['trypillia'],
          artifactParts: {},
          completedArtifacts: [],
          lastSavedAt: Date.now(),
          referrerId: hasRef ? sanitizeId(referrerId) : null,
          referralsCount: 0,
          referralEarnings: 0,
          activeBoosters: {},
        };
      }
    } catch (e) {
      console.error('Supabase load failed:', e);
    }
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as GameState;
    return applyOfflineGains(parsed);
  } catch (e) {
    console.error('localStorage load failed:', e);
    return null;
  }
}

function hydrateFromDb(data: Record<string, unknown>): GameState {
  const now = Date.now();
  const lastSaved = new Date(data.last_saved_at as string).getTime();
  const offlineSeconds = Math.min(now - lastSaved, 8 * 60 * 60 * 1000) / 1000;
  const passiveXps = (data.passive_xp_per_second as number) || 0;
  const level = data.level as number;

  const offlineXp = passiveXps * offlineSeconds;
  const offlineCurrency = (level * 50) * (offlineSeconds / 60);

  return {
    epochId: (data.epoch_id as EpochId) || 'trypillia',
    level,
    xp: (data.xp as number) + offlineXp,
    xpToNextLevel: (data.xp_to_next_level as number) || calculateXpToLevel(level),
    totalXp: (data.total_xp as number) + offlineXp,
    currency: (data.currency as number) + offlineCurrency,
    totalCurrencyEarned: (data.total_currency_earned as number) + offlineCurrency,
    tapPower: data.tap_power as number,
    passiveXpPerSecond: passiveXps,
    ownedGenerators: (data.owned_generators as OwnedGenerator[]) || [],
    unlockedEpochs: ((data.unlocked_epochs as string[]) || ['trypillia']) as EpochId[],
    artifactParts: (data.artifact_parts as Record<string, number>) || {},
    completedArtifacts: (data.completed_artifacts as string[]) || [],
    lastSavedAt: now,
    referrerId: sanitizeId(data.referrer_id as number),
    referralsCount: (data.referrals_count as number) || 0,
    referralEarnings: (data.referral_earnings as number) || 0,
    activeBoosters: (data.active_boosters as ActiveBoosters) || {},
  };
}

function applyOfflineGains(parsed: GameState): GameState {
  const now = Date.now();
  const offlineSeconds = Math.min(now - parsed.lastSavedAt, 8 * 60 * 60 * 1000) / 1000;
  return {
    ...parsed,
    xp: parsed.xp + parsed.passiveXpPerSecond * offlineSeconds,
    totalXp: parsed.totalXp + parsed.passiveXpPerSecond * offlineSeconds,
    currency: parsed.currency + (parsed.level * 50) * (offlineSeconds / 60),
    totalCurrencyEarned: parsed.totalCurrencyEarned + (parsed.level * 50) * (offlineSeconds / 60),
    artifactParts: parsed.artifactParts || {},
    completedArtifacts: parsed.completedArtifacts || [],
    lastSavedAt: now,
    referrerId: sanitizeId(parsed.referrerId),
    referralsCount: parsed.referralsCount || 0,
    referralEarnings: parsed.referralEarnings || 0,
    activeBoosters: parsed.activeBoosters || {},
  };
}

async function applyReferralBonus(_newUserId: number, referrerId: number): Promise<void> {
  if (!supabase) return;
  try {
    const { data: ref } = await supabase
      .from('game_progress')
      .select('currency, total_currency_earned, referrals_count, referral_earnings')
      .eq('telegram_id', referrerId)
      .maybeSingle();

    if (ref) {
      await supabase
        .from('game_progress')
        .update({
          referrals_count: (ref.referrals_count || 0) + 1,
          referral_earnings: (ref.referral_earnings || 0) + REFERRER_BONUS,
          currency: (ref.currency || 0) + REFERRER_BONUS,
          total_currency_earned: (ref.total_currency_earned || 0) + REFERRER_BONUS,
        })
        .eq('telegram_id', referrerId);
    }

  } catch (e) {
    console.error('Referral bonus failed:', e);
  }
}


export async function fetchActiveBoosters(telegramId: number): Promise<ActiveBoosters> {
  if (!supabase) return {};
  try {
    const { data } = await supabase
      .from('game_progress')
      .select('active_boosters')
      .eq('telegram_id', telegramId)
      .maybeSingle();
    return (data?.active_boosters as ActiveBoosters) || {};
  } catch {
    return {};
  }
}

export async function clearLegendaryBooster(telegramId: number): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase
      .from('game_progress')
      .select('active_boosters')
      .eq('telegram_id', telegramId)
      .maybeSingle();
    if (!data) return;
    const boosters = (data.active_boosters as ActiveBoosters) || {};
    delete boosters.legendary_next_gacha;
    await supabase
      .from('game_progress')
      .update({ active_boosters: boosters })
      .eq('telegram_id', telegramId);
  } catch (e) {
    console.error('clearLegendaryBooster failed:', e);
  }
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('game_progress')
      .select('telegram_id, first_name, username, level, total_xp, referrals_count')
      .order('total_xp', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((row, index) => ({
      telegram_id: row.telegram_id,
      first_name: row.first_name,
      username: row.username,
      level: row.level,
      total_xp: row.total_xp,
      referrals_count: row.referrals_count || 0,
      rank: index + 1,
    }));
  } catch (e) {
    console.error('Leaderboard fetch failed:', e);
    return [];
  }
}

export async function getUserRank(telegramId: number): Promise<number | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('game_progress')
      .select('total_xp')
      .eq('telegram_id', telegramId)
      .maybeSingle();

    if (!data) return null;

    const { count } = await supabase
      .from('game_progress')
      .select('*', { count: 'exact', head: true })
      .gt('total_xp', data.total_xp);

    return (count || 0) + 1;
  } catch (e) {
    console.error('Rank fetch failed:', e);
    return null;
  }
}

export async function clearGameState(): Promise<void> {
  const telegramId = getTelegramUserId();
  const deviceId = getDeviceId();
  localStorage.removeItem(LOCAL_STORAGE_KEY);

  if (!supabase) return;
  try {
    if (telegramId) {
      await supabase.from('game_progress').delete().eq('telegram_id', telegramId);
    } else {
      await supabase.from('game_progress').delete().eq('device_id', deviceId).is('telegram_id', null);
    }
  } catch (e) {
    console.error('Clear failed:', e);
  }
}
