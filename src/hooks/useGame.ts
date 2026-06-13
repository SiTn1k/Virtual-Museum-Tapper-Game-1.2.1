import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, EpochId, OwnedGenerator, TapEvent, LeaderboardEntry } from '../types/game';
import {
  EPOCHS,
  ARTIFACTS,
  getEpochById,
  getCurrentEpochByLevel,
  getGeneratorCost,
  getGeneratorProduction,
} from '../data/epochs';
import {
  saveGameState,
  loadGameState,
  getTelegramUserId,
  getLeaderboard,
  getUserRank,
  fetchActiveBoosters,
} from '../lib/storage';
import type { ActiveBoosters } from '../types/game';

const XP_PER_LEVEL_MULTIPLIER = 1.5;
const XP_BASE = 100;
const SAVE_INTERVAL = 5000;

export interface ArtifactMultipliers {
  xp: number;
  currency: number;
  passive: number;
}

export interface BoosterMultipliers {
  xp: number;
  currency: number;
}

export function getBoosterMultipliers(boosters: ActiveBoosters): BoosterMultipliers {
  const now = Date.now();
  let xp = 1;
  let currency = 1;

  if (boosters.xp_boost_end && boosters.xp_boost_end > now) {
    xp = Math.max(xp, boosters.xp_boost_mult ?? 2);
  }
  if (boosters.currency_boost_end && boosters.currency_boost_end > now) {
    currency = Math.max(currency, boosters.currency_boost_mult ?? 2);
  }
  if (boosters.super_boost_end && boosters.super_boost_end > now) {
    const m = boosters.super_boost_mult ?? 3;
    xp = Math.max(xp, m);
    currency = Math.max(currency, m);
  }

  return { xp, currency };
}

function calculateXpToLevel(level: number): number {
  return Math.floor(XP_BASE * Math.pow(XP_PER_LEVEL_MULTIPLIER, level - 1));
}

export function getArtifactMultipliers(completedArtifacts: string[]): ArtifactMultipliers {
  let xp = 1;
  let currency = 1;
  let passive = 1;
  for (const id of completedArtifacts) {
    const art = ARTIFACTS.find(a => a.id === id);
    if (!art) continue;
    if (art.bonus.type === 'xp_multiplier') xp *= art.bonus.value;
    if (art.bonus.type === 'currency_multiplier') currency *= art.bonus.value;
    if (art.bonus.type === 'passive_boost') passive *= art.bonus.value;
  }
  return { xp, currency, passive };
}

const INITIAL_STATE: GameState = {
  epochId: 'trypillia',
  level: 1,
  xp: 0,
  xpToNextLevel: calculateXpToLevel(1),
  totalXp: 0,
  currency: 20,
  totalCurrencyEarned: 20,
  ownedGenerators: [],
  tapPower: 1,
  passiveXpPerSecond: 0,
  unlockedEpochs: ['trypillia'],
  artifactParts: {},
  completedArtifacts: [],
  lastSavedAt: Date.now(),
  referrerId: null,
  referralsCount: 0,
  referralEarnings: 0,
  activeBoosters: {},
};

export function useGame() {
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [tapEvents, setTapEvents] = useState<TapEvent[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [offlineGains, setOfflineGains] = useState<{ xp: number; currency: number } | null>(null);
  const tickRef = useRef<number | null>(null);
  const saveRef = useRef<number | null>(null);
  const isInitialized = useRef(false);

  const currentEpoch = getCurrentEpochByLevel(state.level);
  const epoch = getEpochById(currentEpoch.id);

  const calculatePassiveXp = useCallback((owned: OwnedGenerator[], level: number): number => {
    const epochData = getEpochById(getCurrentEpochByLevel(level).id);
    return owned.reduce((total, og) => {
      const generator = epochData.generators.find(g => g.id === og.generatorId);
      if (!generator) return total;
      return total + getGeneratorProduction(generator, og.level);
    }, 0);
  }, []);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    (async () => {
      const saved = await loadGameState();
      if (saved) {
        const passiveXp = calculatePassiveXp(saved.ownedGenerators, saved.level);

        // Detect meaningful offline gains to show notification
        const offlineMs = Date.now() - saved.lastSavedAt;
        const offlineSec = Math.min(offlineMs / 1000, 8 * 3600);
        const offlineXp = passiveXp * offlineSec;
        const offlineCurrency = (saved.level * 50) * (offlineSec / 60);

        if (offlineMs > 60_000 && (offlineXp > 100 || offlineCurrency > 10)) {
          setOfflineGains({ xp: offlineXp, currency: offlineCurrency });
        }

        setState({ ...saved, passiveXpPerSecond: passiveXp });
      }
      setIsLoading(false);
    })();
  }, [calculatePassiveXp]);

  // Use a stable ref for save so we don't recreate the interval on every state update
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (isLoading) return;

    saveRef.current = window.setInterval(() => {
      saveGameState(stateRef.current);
    }, SAVE_INTERVAL);

    return () => {
      if (saveRef.current) clearInterval(saveRef.current);
      saveGameState(stateRef.current);
    };
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    tickRef.current = window.setInterval(() => {
      setState(prev => {
        const basePassiveXp = calculatePassiveXp(prev.ownedGenerators, prev.level);
        const { passive: passMult, currency: artCurrMult } = getArtifactMultipliers(prev.completedArtifacts || []);
        const { xp: boostXpMult, currency: boostCurrMult } = getBoosterMultipliers(prev.activeBoosters || {});
        const effectivePassiveXp = basePassiveXp * passMult * boostXpMult;

        const xpGainThisTick = effectivePassiveXp / 10;
        let xp = prev.xp + xpGainThisTick;
        const newTotalXp = prev.totalXp + xpGainThisTick;

        const currMult = artCurrMult * boostCurrMult;
        let newLevel = prev.level;
        let xpToNext = prev.xpToNextLevel;
        let newCurrency = prev.currency;
        let newTotalCurrency = prev.totalCurrencyEarned;
        let newUnlocked = [...prev.unlockedEpochs];

        while (xp >= xpToNext) {
          xp -= xpToNext;
          newLevel++;
          xpToNext = calculateXpToLevel(newLevel);
          const levelReward = Math.round(newLevel * 50 * currMult);
          newCurrency += levelReward;
          newTotalCurrency += levelReward;

          EPOCHS.forEach(e => {
            if (e.unlockLevel === newLevel && !newUnlocked.includes(e.id)) {
              newUnlocked.push(e.id);
            }
          });
        }

        // Only auto-switch epoch when a NEW epoch is unlocked via level-up.
        // Otherwise keep the manually selected epoch (so switchEpoch is not overridden every tick).
        const newEpochUnlocked = newUnlocked.length > prev.unlockedEpochs.length;
        const epochId = newEpochUnlocked
          ? getCurrentEpochByLevel(newLevel).id
          : prev.epochId;

        return {
          ...prev,
          xp,
          totalXp: newTotalXp,
          level: newLevel,
          xpToNextLevel: xpToNext,
          epochId,
          passiveXpPerSecond: effectivePassiveXp,
          currency: newCurrency,
          totalCurrencyEarned: newTotalCurrency,
          unlockedEpochs: newUnlocked,
        };
      });
    }, 100);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isLoading, calculatePassiveXp]);

  const tap = useCallback((x: number, y: number) => {
    const eventId = Math.random().toString(36).substr(2, 9);

    setState(prev => {
      const { xp: artXpMult } = getArtifactMultipliers(prev.completedArtifacts || []);
      const { xp: boostXpMult } = getBoosterMultipliers(prev.activeBoosters || {});
      const value = Math.max(1, Math.round(prev.tapPower * artXpMult * boostXpMult));

      setTapEvents(te => [
        ...te.slice(-9),
        { id: eventId, x, y, value, createdAt: Date.now() },
      ]);
      setTimeout(() => {
        setTapEvents(te => te.filter(e => e.id !== eventId));
      }, 1000);

      return {
        ...prev,
        xp: prev.xp + value,
        totalXp: prev.totalXp + value,
      };
    });
  }, []);

  const buyGenerator = useCallback((generatorId: string) => {
    const generator = epoch.generators.find(g => g.id === generatorId);
    if (!generator) return false;

    const currentOwned = state.ownedGenerators.find(og => og.generatorId === generatorId);
    const currentLevel = currentOwned?.level || 0;
    const cost = getGeneratorCost(generator, currentLevel);

    if (state.currency < cost) return false;

    setState(prev => {
      const existing = prev.ownedGenerators.find(og => og.generatorId === generatorId);
      const newOwned = existing
        ? prev.ownedGenerators.map(og =>
            og.generatorId === generatorId ? { ...og, level: og.level + 1 } : og
          )
        : [...prev.ownedGenerators, { generatorId, level: 1 }];

      const { passive: passMult } = getArtifactMultipliers(prev.completedArtifacts || []);
      const newPassiveXp = calculatePassiveXp(newOwned, prev.level) * passMult;

      return {
        ...prev,
        currency: prev.currency - cost,
        ownedGenerators: newOwned,
        passiveXpPerSecond: newPassiveXp,
      };
    });

    return true;
  }, [epoch.generators, state.currency, state.ownedGenerators, calculatePassiveXp]);

  const upgradeTapPower = useCallback(() => {
    const cost = Math.floor(25 * Math.pow(1.8, state.tapPower - 1));
    if (state.currency < cost) return false;

    setState(prev => ({
      ...prev,
      currency: prev.currency - cost,
      tapPower: prev.tapPower + 1,
    }));

    return true;
  }, [state.currency, state.tapPower]);

  const addArtifactPart = useCallback((artifactId: string, isFull: boolean) => {
    setState(prev => {
      const newParts = { ...prev.artifactParts };
      const newCompleted = [...(prev.completedArtifacts || [])];

      if (isFull) {
        if (!newCompleted.includes(artifactId)) newCompleted.push(artifactId);
      } else if (!newCompleted.includes(artifactId)) {
        // Only add parts if artifact not already completed
        newParts[artifactId] = (newParts[artifactId] || 0) + 1;

        // Auto-complete when all parts collected
        const artifact = ARTIFACTS.find(a => a.id === artifactId);
        if (artifact && newParts[artifactId] >= artifact.parts) {
          newCompleted.push(artifactId);
        }
      }

      return { ...prev, artifactParts: newParts, completedArtifacts: newCompleted };
    });
  }, []);

  const deductGachaCost = useCallback((cost: number): boolean => {
    if (state.currency < cost) return false;
    setState(prev => ({ ...prev, currency: Math.max(0, prev.currency - cost) }));
    return true;
  }, [state.currency]);

  const switchEpoch = useCallback((epochId: EpochId) => {
    if (!state.unlockedEpochs.includes(epochId)) return;
    setState(prev => ({ ...prev, epochId }));
  }, [state.unlockedEpochs]);

  const getOwnedLevel = useCallback((generatorId: string): number => {
    const owned = state.ownedGenerators.find(og => og.generatorId === generatorId);
    return owned?.level || 0;
  }, [state.ownedGenerators]);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const data = await getLeaderboard(50);
      setLeaderboard(data);

      const telegramId = getTelegramUserId();
      if (telegramId) {
        const rank = await getUserRank(telegramId);
        setUserRank(rank);
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    }
    setLeaderboardLoading(false);
  }, []);

  const dismissOfflineGains = useCallback(() => setOfflineGains(null), []);

  // Called after a successful Telegram Stars purchase to pull fresh boosters from DB
  const refreshBoosters = useCallback(async () => {
    const telegramIdLocal = getTelegramUserId();
    if (!telegramIdLocal) return;
    const fresh = await fetchActiveBoosters(telegramIdLocal);
    setState(prev => ({ ...prev, activeBoosters: fresh }));
  }, []);

  const tapPowerCost = Math.floor(25 * Math.pow(1.8, state.tapPower - 1));
  const telegramId = getTelegramUserId();
  const artifactMultipliers = getArtifactMultipliers(state.completedArtifacts || []);
  const boosterMultipliers = getBoosterMultipliers(state.activeBoosters || {});

  return {
    state,
    epoch,
    tapEvents,
    tap,
    buyGenerator,
    upgradeTapPower,
    switchEpoch,
    getOwnedLevel,
    tapPowerCost,
    addArtifactPart,
    deductGachaCost,
    isLoading,
    telegramId,
    leaderboard,
    userRank,
    leaderboardLoading,
    loadLeaderboard,
    artifactMultipliers,
    boosterMultipliers,
    refreshBoosters,
    offlineGains,
    dismissOfflineGains,
  };
}
