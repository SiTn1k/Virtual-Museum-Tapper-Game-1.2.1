interface TapUpgradeProps {
  tapPower: number;
  cost: number;
  currency: number;
  onUpgrade: () => boolean;
}

export function TapUpgrade({ tapPower, cost, currency, onUpgrade }: TapUpgradeProps) {
  const canAfford = currency >= cost;
  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return Math.floor(n).toString();
  };

  return (
    <div
      className={`p-3 flex items-center gap-3 transition-colors ${
        canAfford ? 'bg-gradient-to-r from-purple-900/80 to-pink-900/80 hover:from-purple-800/80 hover:to-pink-800/80 cursor-pointer' : 'bg-gray-900 opacity-60 cursor-not-allowed'
      }`}
      onClick={() => canAfford && onUpgrade()}
    >
      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
        👆
      </div>

      <div className="flex-1">
        <div className="font-semibold text-white">Покращити тап</div>
        <div className="text-xs text-gray-300">
          Потужність: {tapPower} → {tapPower + 1} XP/тап
        </div>
      </div>

      <div className="text-right">
        <div className="font-bold text-yellow-400">
          {formatNumber(cost)}
        </div>
        <div className="text-xs text-gray-400">вартість</div>
      </div>
    </div>
  );
}
