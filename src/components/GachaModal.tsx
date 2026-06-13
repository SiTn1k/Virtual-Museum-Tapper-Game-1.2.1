import { useState, useEffect, useMemo, useRef } from 'react';
import { Epoch, Artifact } from '../types/game';
import { ARTIFACTS } from '../data/epochs';
import { hapticImpact, hapticNotification } from '../lib/telegram';
import { X, Sparkles, Zap } from 'lucide-react';

interface GachaModalProps {
  epoch: Epoch;
  currency: number;
  unlockedEpochs: string[];
  artifactParts: Record<string, number>;
  completedArtifacts: string[];
  onClose: () => void;
  onRoll: (cost: number) => boolean;
  onArtifactDrop: (artifact: Artifact, isFull: boolean) => void;
}

const GACHA_COST = 100;

export function GachaModal({
  epoch,
  currency,
  unlockedEpochs,
  artifactParts,
  completedArtifacts,
  onClose,
  onRoll,
  onArtifactDrop,
}: GachaModalProps) {
  const [phase, setPhase] = useState<'ready' | 'rolling' | 'result'>('ready');
  const [currentIcon, setCurrentIcon] = useState('🎁');
  const [rollIndex, setRollIndex] = useState(0);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [isPart, setIsPart] = useState(true);

  // Hold latest callback in a ref so the rolling interval never gets restarted
  // when the parent re-renders (which happens every 100ms due to game tick).
  const onArtifactDropRef = useRef(onArtifactDrop);
  useEffect(() => { onArtifactDropRef.current = onArtifactDrop; });

  // Filter artifacts for current epoch and unlocked epochs
  const availableArtifacts = useMemo(() => {
    // Always include items from current epoch and first two epochs
    const allowedEpochs = new Set(['trypillia', 'scythia', epoch.id, ...unlockedEpochs]);
    return ARTIFACTS.filter(a => allowedEpochs.has(a.epoch));
  }, [epoch.id, unlockedEpochs]);

  // Group by rarity for display
  const artifactsByRarity = useMemo(() => ({
    common: availableArtifacts.filter(a => a.rarity === 'common'),
    rare: availableArtifacts.filter(a => a.rarity === 'rare'),
    epic: availableArtifacts.filter(a => a.rarity === 'epic'),
    legendary: availableArtifacts.filter(a => a.rarity === 'legendary'),
  }), [availableArtifacts]);

  const canAfford = currency >= GACHA_COST;

  const rollIcons = ['🎁', '✨', '💎', '🏺', '👑', '⚔️', '☦️', '📜', '🪙', '🎭'];

  const handleRoll = () => {
    if (!canAfford) return;
    if (!onRoll(GACHA_COST)) return;

    hapticImpact('medium');
    setPhase('rolling');
    setArtifact(null);
  };

  useEffect(() => {
    if (phase !== 'rolling') return;

    let count = 0;
    const maxRolls = 25 + Math.floor(Math.random() * 10);

    const interval = setInterval(() => {
      setCurrentIcon(rollIcons[Math.floor(Math.random() * rollIcons.length)]);
      setRollIndex(count);
      count++;
      hapticImpact('light');

      if (count >= maxRolls) {
        clearInterval(interval);

        // Determine result based on rarity weights
        const rand = Math.random();
        let result: Artifact | null = null;

        // Weights: common 55%, rare 30%, epic 12%, legendary 3%
        if (rand < 0.03 && artifactsByRarity.legendary.length > 0) {
          result = artifactsByRarity.legendary[Math.floor(Math.random() * artifactsByRarity.legendary.length)];
        } else if (rand < 0.15 && artifactsByRarity.epic.length > 0) {
          result = artifactsByRarity.epic[Math.floor(Math.random() * artifactsByRarity.epic.length)];
        } else if (rand < 0.45 && artifactsByRarity.rare.length > 0) {
          result = artifactsByRarity.rare[Math.floor(Math.random() * artifactsByRarity.rare.length)];
        } else if (artifactsByRarity.common.length > 0) {
          result = artifactsByRarity.common[Math.floor(Math.random() * artifactsByRarity.common.length)];
        }

        // Fallback to any available artifact
        if (!result && availableArtifacts.length > 0) {
          result = availableArtifacts[Math.floor(Math.random() * availableArtifacts.length)];
        }

        if (result) {
          // 8% chance for full artifact drop
          const fullDrop = Math.random() < 0.08;

          setArtifact(result);
          setIsPart(!fullDrop);
          setCurrentIcon(result.icon);
          onArtifactDropRef.current(result, fullDrop);
        }

        setPhase('result');
        hapticNotification('success');
      }
    }, 70);

    return () => clearInterval(interval);
  // onArtifactDrop intentionally excluded — held in ref to prevent interval restart
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, artifactsByRarity, availableArtifacts]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return { color: 'text-yellow-400', bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500', glow: 'drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]' };
      case 'epic':
        return { color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500', glow: 'drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]' };
      case 'rare':
        return { color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500', glow: 'drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]' };
      default:
        return { color: 'text-gray-300', bg: 'bg-gray-500/20 border-gray-500', glow: '' };
    }
  };

  const rarityLabels: Record<string, string> = {
    legendary: 'Легендарний',
    epic: 'Епічний',
    rare: 'Рідкісний',
    common: 'Звичайний',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="relative w-full max-w-sm mx-4 bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center py-5 px-4 bg-gradient-to-b from-purple-900/50 to-gray-900">
          <h2 className="text-xl font-bold mb-1 text-white">
            {phase === 'result' ? 'Вітаю!' : 'Скриня артефактів'}
          </h2>
          <p className="text-gray-400 text-sm">
            {phase === 'ready' && `Вартість: ${GACHA_COST} ${epoch.currencyIcon}`}
            {phase === 'rolling' && 'Шукаємо скарб...'}
            {phase === 'result' && (isPart ? 'Знайдено частину!' : 'Знайдено повний артефакт!')}
          </p>
        </div>

        {/* Main content */}
        <div className="flex flex-col items-center justify-center py-6 px-4 min-h-[200px]">
          {/* Chest/Result */}
          <div
            className={`text-7xl transition-all duration-300 ${
              phase === 'rolling' ? 'animate-bounce' : ''
            } ${phase === 'result' && artifact ? getRarityStyle(artifact.rarity).glow + ' scale-125' : ''}`}
          >
            {currentIcon}
          </div>

          {/* Rolling indicator */}
          {phase === 'rolling' && (
            <div className="flex gap-2 mt-4">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    rollIndex % 3 === i ? 'bg-yellow-400 scale-125' : 'bg-yellow-400/30'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Result */}
          {phase === 'result' && artifact && (
            <div className="mt-4 text-center animate-fade-in">
              <div className={`${getRarityStyle(artifact.rarity).color} text-lg font-bold mb-1`}>
                {artifact.name.ua}
              </div>
              <div className="text-gray-400 text-sm mb-2">
                {rarityLabels[artifact.rarity]}
              </div>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                completedArtifacts.includes(artifact.id) ? 'bg-yellow-500/20 text-yellow-400' :
                isPart ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {completedArtifacts.includes(artifact.id) ? (
                  <><Zap size={14} /> Зібрано!</>
                ) : isPart ? (
                  <>{(artifactParts[artifact.id] || 0)}/{artifact.parts} частин</>
                ) : (
                  <><Zap size={14} /> Повний артефакт!</>
                )}
              </div>
              <div className="text-gray-500 text-xs mt-2">
                {artifact.bonus.type === 'xp_multiplier' ? `+${((artifact.bonus.value - 1) * 100).toFixed(0)}% XP` :
                 artifact.bonus.type === 'currency_multiplier' ? `+${((artifact.bonus.value - 1) * 100).toFixed(0)}% валюти` :
                 `+${((artifact.bonus.value - 1) * 100).toFixed(0)}% пасивний дохід`}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-800/50 border-t border-gray-700">
          {phase === 'ready' && (
            <>
              <button
                onClick={handleRoll}
                disabled={!canAfford}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  canAfford
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white active:scale-95'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Sparkles size={20} />
                Відкрити скриню
              </button>
              {!canAfford && (
                <p className="text-center text-red-400 text-sm mt-2">
                  Потрібно {GACHA_COST} {epoch.currencyIcon}
                </p>
              )}

              {/* Probability display */}
              <div className="mt-3 text-center text-xs text-gray-500">
                Шанси: Звичайний 55% | Рідкісний 30% | Епічний 12% | Легендарний 3%
              </div>
            </>
          )}

          {phase === 'result' && (
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-medium hover:bg-gray-600 transition-all active:scale-95"
              >
                Закрити
              </button>
              <button
                onClick={() => { setPhase('ready'); setArtifact(null); }}
                disabled={currency < GACHA_COST}
                className={`flex-1 py-3 rounded-xl font-medium transition-all active:scale-95 ${
                  currency >= GACHA_COST
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                Ще раз
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
