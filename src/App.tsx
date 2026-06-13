import { useState, useMemo, useEffect, useCallback } from 'react';
import { useGame } from './hooks/useGame';
import { TapArea } from './components/TapArea';
import { GeneratorShop } from './components/GeneratorShop';
import { TapUpgrade } from './components/StatsPanel';
import { GachaModal } from './components/GachaModal';
import { ReferralsTab } from './components/ReferralsTab';
import { EPOCHS, ARTIFACTS, getEpochById } from './data/epochs';
import { initTelegramMiniApp, hapticImpact, hapticNotification, getTelegramWebApp } from './lib/telegram';
import { supabase } from './lib/supabase';
import { Crown, ShoppingBag, Trophy, Gift, Loader2, Users, X, Clock, Shield, Zap, Star, ChevronRight, Wifi, RefreshCw, Timer } from 'lucide-react';
import type { EpochId } from './types/game';

type Tab = 'shop' | 'epochs' | 'artifacts' | 'referrals' | 'stats' | 'boosters';

function App() {
  const {
    state,
    epoch,
    tapEvents,
    tap,
    buyGenerator,
    upgradeTapPower,
    switchEpoch,
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
  } = useGame();

  const [activeTab, setActiveTab] = useState<Tab>('shop');
  const [showGacha, setShowGacha] = useState(false);
  const [showEpochModal, setShowEpochModal] = useState(false);
  const [syncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [showError, setShowError] = useState<string | null>(null);
  const [purchasingBooster, setPurchasingBooster] = useState<string | null>(null);

  useEffect(() => {
    const tg = initTelegramMiniApp();
    if (tg) {
      console.log('Telegram WebApp initialized', tg.version, 'User:', tg.initDataUnsafe?.user?.id);
    }
  }, []);

  const ownedLevels = useMemo(() => {
    const map = new Map<string, number>();
    state.ownedGenerators.forEach(og => {
      map.set(og.generatorId, og.level);
    });
    return map;
  }, [state.ownedGenerators]);

  const handleBuy = (generatorId: string): boolean => {
    const ok = buyGenerator(generatorId);
    if (ok) hapticNotification('success');
    return ok;
  };

  const handleUpgradeTap = (): boolean => {
    const ok = upgradeTapPower();
    if (ok) hapticNotification('success');
    return ok;
  };

  const formatNumber = useCallback((n: number) => {
    if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Math.floor(n).toString();
  }, []);

  const completedArtifacts = state.completedArtifacts?.length || 0;
  const effectiveTapPower = Math.max(1, Math.round(state.tapPower * artifactMultipliers.xp));

  // Telegram Stars purchase — real implementation
  const handleBuyBooster = useCallback(async (booster: { id: string; name: string; price: number }) => {
    const tg = getTelegramWebApp();
    if (!tg) {
      setShowError('Telegram Stars доступний лише в додатку Telegram');
      return;
    }
    if (!telegramId) {
      setShowError('Авторизуйтесь через Telegram для покупки');
      return;
    }
    if (!supabase) {
      setShowError('Немає підключення до сервера');
      return;
    }

    setPurchasingBooster(booster.id);
    hapticImpact('medium');

    try {
      // Call edge function to get a Telegram Stars invoice URL
      const { data, error } = await supabase.functions.invoke('telegram-payments', {
        body: { action: 'create_invoice', booster_id: booster.id, telegram_id: telegramId },
      });

      if (error || !data?.invoice_url) {
        setShowError(data?.error ?? 'Не вдалося створити рахунок. Перевірте налаштування бота.');
        setPurchasingBooster(null);
        return;
      }

      // Open Telegram native invoice UI
      tg.openInvoice(data.invoice_url, async (status) => {
        setPurchasingBooster(null);
        if (status === 'paid') {
          hapticNotification('success');
          // Wait briefly for webhook to deliver, then refresh boosters
          setTimeout(() => refreshBoosters(), 2000);
        } else if (status === 'failed') {
          hapticNotification('error');
          setShowError('Оплату не вдалося завершити');
        }
      });
    } catch (e) {
      console.error('handleBuyBooster error:', e);
      setShowError('Помилка під час відкриття рахунку');
      setPurchasingBooster(null);
    }
  }, [telegramId, refreshBoosters]);

  const handleEpochSwitch = (epochId: EpochId) => {
    if (state.unlockedEpochs.includes(epochId)) {
      switchEpoch(epochId);
      hapticNotification('success');
      setShowEpochModal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-yellow-400 mb-4" />
        <p className="text-lg">Завантаження...</p>
        {telegramId && (
          <p className="text-xs text-gray-500 mt-2">Telegram ID: {telegramId}</p>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Error Toast */}
      {showError && (
        <div className="fixed top-2 left-2 right-2 z-50 bg-red-900/90 border border-red-500 rounded-xl p-3 flex items-center gap-3 shadow-lg">
          <Shield className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm flex-1">{showError}</p>
          <button onClick={() => setShowError(null)} className="p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Offline gains notification */}
      {offlineGains && !showError && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-yellow-500/40 shadow-lg">
          <div className="flex items-center gap-3 px-4 py-3">
            <Clock className="w-5 h-5 text-yellow-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Пасивний дохід поки вас не було</p>
              <p className="text-xs text-gray-400">
                +{formatNumber(offlineGains.xp)} XP + {formatNumber(offlineGains.currency)} {epoch.currencyIcon}
              </p>
            </div>
            <button
              onClick={dismissOfflineGains}
              className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Header with epoch selector */}
      <div
        className="px-3 py-2 flex items-center justify-between border-b border-white/10"
        style={{ background: epoch.bgGradient }}
      >
        <button
          onClick={() => setShowEpochModal(true)}
          className="flex items-center gap-2 py-1.5 px-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
        >
          <span className="text-xl">{epoch.currencyIcon}</span>
          <div className="text-left">
            <div className="text-xs font-medium">{epoch.name.ua}</div>
            <div className="text-[10px] opacity-70">Рівень {state.level}</div>
          </div>
          <ChevronRight className="w-4 h-4 opacity-50" />
        </button>

        <div className="flex items-center gap-2">
          {/* Currency display */}
          <div className="bg-white/10 rounded-xl px-3 py-1.5">
            <span className="text-sm font-bold">{epoch.currencyIcon} {formatNumber(state.currency)}</span>
          </div>
          {/* Sync status */}
          <div className="flex items-center gap-1 text-xs opacity-60">
            {syncStatus === 'synced' && <Wifi className="w-3 h-3 text-green-400" />}
            {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 text-yellow-400 animate-spin" />}
          </div>
        </div>
      </div>

      <TapArea
        epoch={epoch}
        onTap={(x, y) => { tap(x, y); hapticImpact('light'); }}
        tapEvents={tapEvents}
        tapPower={effectiveTapPower}
        level={state.level}
        xp={state.xp}
        xpToNextLevel={state.xpToNextLevel}
        passiveXp={state.passiveXpPerSecond}
        currency={state.currency}
        currencyIcon={epoch.currencyIcon}
        topOffset={0}
      />

      <div className="bg-gray-900 border-t border-gray-700 flex flex-col flex-1 min-h-0">
        {/* Tab Bar */}
        <div className="flex border-b border-gray-700 shrink-0 overflow-x-auto">
          <TabButton active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} icon={<ShoppingBag size={18} />} label="Магазин" />
          <TabButton active={activeTab === 'epochs'} onClick={() => setActiveTab('epochs')} icon={<Crown size={18} />} label="Епохи" badge={state.unlockedEpochs.length} />
          <TabButton active={activeTab === 'artifacts'} onClick={() => setActiveTab('artifacts')} icon={<Gift size={18} />} label="Артефакти" badge={completedArtifacts} />
          <TabButton active={activeTab === 'boosters'} onClick={() => setActiveTab('boosters')} icon={<Zap size={18} />} label="Бустери" />
          <TabButton active={activeTab === 'referrals'} onClick={() => setActiveTab('referrals')} icon={<Users size={18} />} label="Друзі" badge={state.referralsCount || undefined} />
          <TabButton active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} icon={<Trophy size={18} />} label="Стат" />
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {activeTab === 'shop' && (
            <div>
              <TapUpgrade tapPower={state.tapPower} cost={tapPowerCost} currency={state.currency} onUpgrade={handleUpgradeTap} />
              <GeneratorShop
                epoch={epoch}
                currency={state.currency}
                ownedLevels={ownedLevels}
                onBuy={handleBuy}
              />
            </div>
          )}

          {activeTab === 'epochs' && (
            <div className="p-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg">Епохи України</h3>
                <span className="text-xs text-gray-400">{state.unlockedEpochs.length}/12</span>
              </div>

              {/* Current epoch card */}
              <div
                className="p-4 rounded-2xl mb-4 border-2"
                style={{
                  background: epoch.bgGradient,
                  borderColor: 'rgba(255,255,255,0.3)'
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{epoch.currencyIcon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-lg">{epoch.name.ua}</div>
                    <div className="text-xs opacity-80">{epoch.period.ua}</div>
                    <div className="mt-1 text-sm">
                      Рівень {state.level} / {epoch.levelRange.max}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs opacity-70">Прогрес</div>
                    <div className="text-lg font-bold">
                      {Math.round(((state.level - epoch.levelRange.min + 1) / (epoch.levelRange.max - epoch.levelRange.min + 1)) * 100)}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden mt-3">
                  <div
                    className="h-full bg-white/80 transition-all"
                    style={{ width: `${Math.min(100, ((state.level - epoch.levelRange.min + 1) / (epoch.levelRange.max - epoch.levelRange.min + 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Unlocked epochs - clickable to switch */}
              <h4 className="text-sm font-medium text-gray-400 mb-2">Розблоковані епохи</h4>
              <div className="space-y-2">
                {state.unlockedEpochs.map(epochId => {
                  const e = getEpochById(epochId);
                  const isCurrent = e.id === epoch.id;
                  return (
                    <button
                      key={e.id}
                      onClick={() => handleEpochSwitch(e.id)}
                      className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                        isCurrent
                          ? 'bg-yellow-500/20 border border-yellow-500'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-2xl">{e.currencyIcon}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{e.name.ua}</div>
                        <div className="text-xs text-gray-400">{e.period.ua}</div>
                      </div>
                      {isCurrent && (
                        <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-medium">
                          Активна
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Locked epochs */}
              <h4 className="text-sm font-medium text-gray-400 mb-2 mt-4">Заблоковані епохи</h4>
              <div className="space-y-2">
                {EPOCHS.filter(e => !state.unlockedEpochs.includes(e.id)).map(e => {
                  const progress = state.level >= e.unlockLevel - 10
                    ? ((state.level - (e.unlockLevel - 10)) / 10) * 100
                    : 0;
                  return (
                    <div
                      key={e.id}
                      className="p-3 rounded-xl bg-gray-800/50 opacity-70 flex items-center gap-3"
                    >
                      <span className="text-2xl grayscale">{e.currencyIcon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{e.name.ua}</div>
                        <div className="text-xs text-gray-500">
                          {state.level >= e.unlockLevel - 10
                            ? `ще ${e.unlockLevel - state.level} рівнів`
                            : `відкривається на рівні ${e.unlockLevel}`
                          }
                        </div>
                        {progress > 0 && (
                          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden mt-1">
                            <div
                              className="h-full bg-gray-500 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'artifacts' && (
            <div className="p-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg">Артефакти</h3>
                <button
                  onClick={() => setShowGacha(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:from-purple-500 hover:to-pink-500 transition-all active:scale-95"
                >
                  Відкрити скриню
                </button>
              </div>

              {/* Active artifact bonuses */}
              {completedArtifacts > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-3 flex flex-wrap gap-3">
                  {artifactMultipliers.xp > 1 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-yellow-400 font-semibold">XP x{artifactMultipliers.xp.toFixed(2)}</span>
                    </div>
                  )}
                  {artifactMultipliers.currency > 1 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-green-400 font-semibold">Валюта x{artifactMultipliers.currency.toFixed(2)}</span>
                    </div>
                  )}
                  {artifactMultipliers.passive > 1 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-blue-400 font-semibold">Пасивний x{artifactMultipliers.passive.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Gacha info */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-2">
                  <Gift className="w-4 h-4" />
                  Скриня артефактів
                </div>
                <p className="text-xs text-gray-400">
                  Відкривайте скрині за 100 {epoch.currencyIcon} та збирайте унікальні артефакти.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Шанси: Звичайний 55% | Рідкісний 30% | Епічний 12% | Легендарний 3%
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {ARTIFACTS.map(artifact => {
                  const isUnlocked = state.unlockedEpochs.includes(artifact.epoch) ||
                    artifact.epoch === 'trypillia' ||
                    artifact.epoch === 'scythia';
                  const parts = state.artifactParts?.[artifact.id] || 0;
                  const isComplete = state.completedArtifacts?.includes(artifact.id);

                  return (
                    <div
                      key={artifact.id}
                      className={`p-3 rounded-xl transition-all ${
                        isComplete
                          ? 'bg-gradient-to-br from-yellow-600/30 to-amber-600/30 border border-yellow-500'
                          : isUnlocked
                          ? 'bg-gray-800 hover:bg-gray-700'
                          : 'bg-gray-900 opacity-40'
                      }`}
                    >
                      <div className="text-2xl sm:text-3xl mb-1">{isUnlocked ? artifact.icon : '?'}</div>
                      <div className="text-xs font-medium truncate">
                        {isUnlocked ? artifact.name.ua : '???'}
                      </div>
                      <div className={`text-xs ${
                        artifact.rarity === 'legendary' ? 'text-yellow-400' :
                        artifact.rarity === 'epic' ? 'text-purple-400' :
                        artifact.rarity === 'rare' ? 'text-blue-400' : 'text-gray-400'
                      }`}>
                        {artifact.rarity === 'legendary' ? 'Легендарний' :
                         artifact.rarity === 'epic' ? 'Епічний' :
                         artifact.rarity === 'rare' ? 'Рідкісний' : 'Звичайний'}
                      </div>
                      {!isComplete && isUnlocked && (
                        <div className="mt-1">
                          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${(parts / artifact.parts) * 100}%` }} />
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{parts}/{artifact.parts}</div>
                        </div>
                      )}
                      {isComplete && (
                        <div className="text-xs text-green-400 mt-1">
                          +{((artifact.bonus.value - 1) * 100).toFixed(0)}%{' '}
                          {artifact.bonus.type === 'xp_multiplier' ? 'XP' :
                           artifact.bonus.type === 'currency_multiplier' ? 'валюта' : 'пасивний'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'boosters' && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-lg">Бустери</h3>
              </div>

              {/* Active boosters status */}
              {(boosterMultipliers.xp > 1 || boosterMultipliers.currency > 1) && (
                <div className="bg-green-500/10 border border-green-500/40 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-2">
                    <Zap className="w-4 h-4" />
                    Активні бустери
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {boosterMultipliers.xp > 1 && (
                      <ActiveBoosterBadge
                        label={`XP x${boosterMultipliers.xp}`}
                        endTime={state.activeBoosters?.super_boost_end ?? state.activeBoosters?.xp_boost_end ?? null}
                        color="text-yellow-400"
                      />
                    )}
                    {boosterMultipliers.currency > 1 && (
                      <ActiveBoosterBadge
                        label={`Валюта x${boosterMultipliers.currency}`}
                        endTime={state.activeBoosters?.super_boost_end ?? state.activeBoosters?.currency_boost_end ?? null}
                        color="text-green-400"
                      />
                    )}
                  </div>
                </div>
              )}

              {state.activeBoosters?.legendary_next_gacha && (
                <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <span className="text-xl">🎁</span>
                  <div>
                    <div className="text-sm font-semibold text-yellow-400">Легендарний гарантовано!</div>
                    <div className="text-xs text-gray-400">Наступне відкриття скрині дасть легендарний артефакт</div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-1">
                  <Star className="w-4 h-4" />
                  Telegram Stars — реальна оплата
                </div>
                <p className="text-xs text-gray-400">
                  Купуйте бустери за Telegram Stars прямо в додатку. Stars придбайте у @PremiumBot.
                </p>
              </div>

              <div className="space-y-3">
                <BoosterCard
                  icon="⚡"
                  name="XP бустер x2"
                  description="Подвійний XP на 1 годину"
                  price={50}
                  loading={purchasingBooster === 'xp_boost_1h'}
                  onBuy={() => handleBuyBooster({ id: 'xp_boost_1h', name: 'XP бустер x2', price: 50 })}
                />
                <BoosterCard
                  icon="💰"
                  name="Валютний бустер x2"
                  description="Подвійна валюта на 1 годину"
                  price={50}
                  loading={purchasingBooster === 'currency_boost_1h'}
                  onBuy={() => handleBuyBooster({ id: 'currency_boost_1h', name: 'Валютний бустер x2', price: 50 })}
                />
                <BoosterCard
                  icon="🔥"
                  name="Супер бустер x3"
                  description="Потрійний XP та валюта на 30 хвилин"
                  price={100}
                  loading={purchasingBooster === 'super_boost_30m'}
                  onBuy={() => handleBuyBooster({ id: 'super_boost_30m', name: 'Супер бустер x3', price: 100 })}
                />
                <BoosterCard
                  icon="🎁"
                  name="Гарантований легендарний"
                  description="Наступний roll дасть легендарний артефакт"
                  price={200}
                  loading={purchasingBooster === 'legendary_gacha'}
                  onBuy={() => handleBuyBooster({ id: 'legendary_gacha', name: 'Гарантований легендарний', price: 200 })}
                />
                <BoosterCard
                  icon="🏆"
                  name="Підтримка розробників"
                  description="Дякуємо! +5000 XP одразу"
                  price={500}
                  loading={purchasingBooster === 'support_dev'}
                  onBuy={() => handleBuyBooster({ id: 'support_dev', name: 'Підтримка', price: 500 })}
                />
              </div>

              <div className="mt-4 p-3 bg-gray-800/60 rounded-xl">
                <p className="text-xs text-gray-500 text-center">
                  Оплата через Telegram Stars. Рефанди — @test_museum_2026_bot команда /paysupport
                </p>
              </div>
            </div>
          )}

          {activeTab === 'referrals' && (
            <ReferralsTab
              telegramId={telegramId}
              referralsCount={state.referralsCount}
              referralEarnings={state.referralEarnings}
              currencyIcon={epoch.currencyIcon}
              leaderboard={leaderboard}
              userRank={userRank}
              leaderboardLoading={leaderboardLoading}
              onLoadLeaderboard={loadLeaderboard}
            />
          )}

          {activeTab === 'stats' && (
            <div className="p-3 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="Загальний XP" value={formatNumber(state.totalXp)} />
                <StatCard label="Рівень" value={state.level.toString()} />
                <StatCard label="Пасивний XP/с" value={formatNumber(state.passiveXpPerSecond)} />
                <StatCard label="Сила тапу" value={`${effectiveTapPower} XP`} />
                <StatCard label="Валюта" value={`${formatNumber(state.currency)} ${epoch.currencyIcon}`} />
                <StatCard label="Генераторів" value={state.ownedGenerators.length.toString()} />
              </div>

              {/* Artifact multipliers summary */}
              {completedArtifacts > 0 && (
                <div className="bg-gray-800 rounded-xl p-3">
                  <h4 className="font-semibold mb-2 text-sm text-yellow-400">Бонуси артефактів</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-700 rounded-lg p-2">
                      <div className="text-yellow-400 font-bold">x{artifactMultipliers.xp.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">XP</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2">
                      <div className="text-green-400 font-bold">x{artifactMultipliers.currency.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">Валюта</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2">
                      <div className="text-blue-400 font-bold">x{artifactMultipliers.passive.toFixed(2)}</div>
                      <div className="text-xs text-gray-400">Пасивний</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-800 rounded-xl p-3">
                <h4 className="font-semibold mb-2 text-sm">Прогрес</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Епоха: {epoch.name.ua}</span>
                      <span>{state.level}/{epoch.levelRange.max}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${Math.min(100, ((state.level - epoch.levelRange.min + 1) / (epoch.levelRange.max - epoch.levelRange.min + 1)) * 100)}%`,
                          background: epoch.bgGradient,
                        }}
                      />
                    </div>
                  </div>

                  {(() => {
                    const nextEpoch = EPOCHS.find(e => e.unlockLevel > state.level);
                    if (!nextEpoch) return null;
                    return (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Наступна: {nextEpoch.name.ua}</span>
                          <span>{nextEpoch.unlockLevel - state.level} рівнів</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                            style={{ width: `${(state.level / nextEpoch.unlockLevel) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Info section */}
              <div className="bg-gray-800 rounded-xl p-3">
                <h4 className="font-semibold mb-2 text-sm">Про гру</h4>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>Україна Крізь Час - історична тапалка про 12 епох України.</p>
                  <p>Від Трипільської культури до Незалежної України.</p>
                  <p className="text-gray-500 mt-2">Версія 1.0.0</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gacha Modal */}
      {showGacha && (
        <GachaModal
          epoch={epoch}
          currency={state.currency}
          unlockedEpochs={state.unlockedEpochs}
          artifactParts={state.artifactParts || {}}
          completedArtifacts={state.completedArtifacts || []}
          onClose={() => setShowGacha(false)}
          onRoll={(cost) => deductGachaCost(cost)}
          onArtifactDrop={(artifact, isFull) => addArtifactPart(artifact.id, isFull)}
        />
      )}

      {/* Epoch Switcher Modal */}
      {showEpochModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowEpochModal(false)}>
          <div
            className="w-full max-w-md bg-gray-900 rounded-t-3xl p-4 border-t border-gray-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Обрати епоху</h3>
              <button onClick={() => setShowEpochModal(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {state.unlockedEpochs.map(epochId => {
                const e = getEpochById(epochId);
                const isCurrent = e.id === epoch.id;
                return (
                  <button
                    key={e.id}
                    onClick={() => handleEpochSwitch(e.id)}
                    className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                      isCurrent
                        ? 'bg-yellow-500/20 border border-yellow-500'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <span className="text-2xl">{e.currencyIcon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{e.name.ua}</div>
                      <div className="text-xs text-gray-400">{e.period.ua}</div>
                    </div>
                    {isCurrent && (
                      <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-medium">
                        Активна
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label, badge }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      className={`flex-1 min-w-[60px] py-2 flex flex-col items-center gap-0.5 relative transition-colors touch-manipulation ${
        active ? 'text-yellow-400 bg-gray-800/50' : 'text-gray-400'
      }`}
      onClick={onClick}
    >
      <div className="relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-2 bg-red-500 text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] truncate max-w-full">{label}</span>
      {active && <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-yellow-400 rounded-full" />}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-3">
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function BoosterCard({ icon, name, description, price, loading, onBuy }: {
  icon: string;
  name: string;
  description: string;
  price: number;
  loading?: boolean;
  onBuy: () => void;
}) {
  return (
    <button
      onClick={onBuy}
      disabled={loading}
      className="w-full p-4 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 rounded-xl transition-all active:scale-[0.98] text-left"
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{icon}</div>
        <div className="flex-1">
          <div className="font-semibold">{name}</div>
          <div className="text-xs text-gray-400">{description}</div>
        </div>
        <div className="flex items-center gap-1 text-yellow-400">
          {loading
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : <><Star className="w-4 h-4" /><span className="font-bold">{price}</span></>
          }
        </div>
      </div>
    </button>
  );
}

function ActiveBoosterBadge({ label, endTime, color }: {
  label: string;
  endTime: number | null | undefined;
  color: string;
}) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const ms = endTime - Date.now();
      if (ms <= 0) { setRemaining('0:00'); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return (
    <div className={`flex items-center gap-1 bg-black/30 rounded-lg px-2 py-1 text-xs font-semibold ${color}`}>
      <Timer className="w-3 h-3" />
      <span>{label}</span>
      {remaining && <span className="opacity-70">{remaining}</span>}
    </div>
  );
}

export default App;
