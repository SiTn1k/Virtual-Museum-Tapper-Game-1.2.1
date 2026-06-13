import { Epoch } from '../types/game';
import { getGeneratorCost, getGeneratorProduction } from '../data/epochs';

interface GeneratorShopProps {
  epoch: Epoch;
  currency: number;
  ownedLevels: Map<string, number>;
  onBuy: (generatorId: string) => boolean;
}

export function GeneratorShop({ epoch, currency, ownedLevels, onBuy }: GeneratorShopProps) {
  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return Math.floor(n).toString();
  };

  return (
    <div className="bg-gray-900 text-white">
      <div className="p-3 border-b border-gray-700">
        <h3 className="font-bold text-lg">{epoch.name.ua}</h3>
        <p className="text-xs text-gray-400">{epoch.description.ua}</p>
      </div>

      <div className="divide-y divide-gray-700">
        {epoch.generators.map(generator => {
          const level = ownedLevels.get(generator.id) || 0;
          const cost = getGeneratorCost(generator, level);
          const canAfford = currency >= cost;
          const production = getGeneratorProduction(generator, level);

          return (
            <div
              key={generator.id}
              className={`p-3 flex items-center gap-3 transition-colors ${
                canAfford ? 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600 cursor-pointer' : 'bg-gray-900 opacity-60'
              }`}
              onClick={() => canAfford && onBuy(generator.id)}
            >
              <div className="text-3xl w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center">
                {generator.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{generator.name.ua}</span>
                  {level > 0 && (
                    <span className="text-xs bg-gray-600 px-2 py-0.5 rounded">
                      Lv.{level}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {generator.description.ua}
                </div>
                {level > 0 && (
                  <div className="text-xs text-green-400">
                    Продукція: {formatNumber(production)}/с
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-sm font-bold flex items-center gap-1 justify-end">
                  <span>{formatNumber(cost)}</span>
                  <span className="text-xs">{epoch.currencyIcon}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {level > 0
                    ? `+${formatNumber(getGeneratorProduction(generator, level + 1))}/с`
                    : `${formatNumber(generator.baseProduction)}/с`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
