import { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types/game';
import { getTelegramWebApp, hapticNotification, hapticImpact } from '../lib/telegram';
import { Users, Copy, Share2, Gift, Trophy, Medal, RefreshCw } from 'lucide-react';

interface ReferralsTabProps {
  telegramId: number | null;
  referralsCount: number;
  referralEarnings: number;
  currencyIcon: string;
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
  leaderboardLoading: boolean;
  onLoadLeaderboard: () => void;
}

export function ReferralsTab({
  telegramId,
  referralsCount,
  referralEarnings,
  currencyIcon,
  leaderboard,
  userRank,
  leaderboardLoading,
  onLoadLeaderboard,
}: ReferralsTabProps) {
  const [copied, setCopied] = useState(false);

  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'test_museum_2026_bot';

  useEffect(() => {
    onLoadLeaderboard();
  }, [onLoadLeaderboard]);

  const handleCopyLink = async () => {
    if (!telegramId) return;

    const link = `https://t.me/${botUsername || 'test_museum_2026_bot'}?start=ref_${telegramId}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      hapticNotification('success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for mobile
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      hapticNotification('success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    const tg = getTelegramWebApp();
    if (!telegramId) return;

    const link = `https://t.me/${botUsername || 'test_museum_2026_bot'}?start=ref_${telegramId}`;
    const text = `🎮 Ukraine Tap Game\n\nПодорожуй 12 епохами історії України!\n\n${link}`;

    if (tg?.openTelegramLink) {
      hapticImpact('medium');
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
    } else {
      // Fallback to Web Share API
      if (navigator.share) {
        navigator.share({
          title: 'Ukraine Tap Game',
          text: text,
          url: link,
        }).catch(() => {});
      }
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white';
      case 2: return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white';
      case 3: return 'bg-gradient-to-r from-amber-700 to-amber-600 text-white';
      default: return 'bg-gray-800 text-gray-200';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-4 h-4 text-yellow-300" />;
      case 2: return <Medal className="w-4 h-4 text-gray-300" />;
      case 3: return <Medal className="w-4 h-4 text-amber-500" />;
      default: return <span className="text-sm font-bold">{rank}</span>;
    }
  };

  return (
    <div className="p-3 sm:p-4 space-y-4">
      {/* Referral Stats */}
      <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/30 rounded-2xl p-4 border border-purple-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Запроси друзів</h3>
            <p className="text-sm text-gray-400">Отримай 100 {currencyIcon} за кожного друга</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-black/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-white">{referralsCount}</div>
            <div className="text-xs text-gray-400">Запрошено</div>
          </div>
          <div className="bg-black/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{Math.floor(referralEarnings)}</div>
            <div className="text-xs text-gray-400">Зароблено {currencyIcon}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-all active:scale-95"
          >
            <Copy className="w-5 h-5" />
            <span className="font-medium">{copied ? 'Скопійовано!' : 'Копіювати'}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all active:scale-95"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Поділитись</span>
          </button>
        </div>

        <div className="mt-3 text-center text-xs text-gray-500">
          Новий гравець отримає 50 {currencyIcon} бонусом
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-gray-800/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold">Лідерборд</h3>
          </div>
          <div className="flex items-center gap-2">
            {userRank && (
              <div className="text-sm text-gray-400">
                Ваше місце: <span className="text-yellow-400 font-bold">#{userRank}</span>
              </div>
            )}
            <button
              onClick={onLoadLeaderboard}
              className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
              disabled={leaderboardLoading}
            >
              <RefreshCw className={`w-4 h-4 ${leaderboardLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {leaderboardLoading && leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <RefreshCw className="w-12 h-12 mx-auto mb-2 animate-spin opacity-50" />
            <p>Завантаження...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Ще немає гравців</p>
            <p className="text-xs mt-1">Стань першим!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.slice(0, 20).map((entry) => (
              <div
                key={entry.telegram_id}
                className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                  entry.telegram_id === telegramId
                    ? 'bg-yellow-500/20 border border-yellow-500/50'
                    : 'bg-gray-700/50 hover:bg-gray-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getRankStyle(entry.rank)}`}>
                  {getRankIcon(entry.rank)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {entry.first_name || entry.username || `Гравець`}
                  </div>
                  <div className="text-xs text-gray-400">
                    Рівень {entry.level}
                    {entry.referrals_count > 0 && (
                      <span className="ml-2 text-purple-400">+{entry.referrals_count} referrals</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-400">
                    {formatNumber(entry.total_xp)}
                  </div>
                  <div className="text-xs text-gray-500">XP</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}
