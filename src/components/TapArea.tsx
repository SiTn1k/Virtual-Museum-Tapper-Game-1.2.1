import { useRef, useCallback } from 'react';
import { TapEvent } from '../types/game';
import { Epoch } from '../types/game';

interface TapAreaProps {
  epoch: Epoch;
  onTap: (x: number, y: number) => void;
  tapEvents: TapEvent[];
  tapPower: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  passiveXp: number;
  currency: number;
  currencyIcon: string;
  topOffset?: number;
}

export function TapArea({
  epoch,
  onTap,
  tapEvents,
  tapPower,
  level,
  xp,
  xpToNextLevel,
  passiveXp,
  currency,
  currencyIcon,
  topOffset = 0,
}: TapAreaProps) {
  const areaRef = useRef<HTMLDivElement>(null);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!areaRef.current) return;

    const rect = areaRef.current.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    onTap(x, y);
  }, [onTap]);

  const xpPercent = (xp / xpToNextLevel) * 100;
  const formatNumber = (n: number) => {
    if (n >= 1e12) return (n / 1e12).toFixed(1) + 'T';
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return Math.floor(n).toString();
  };

  return (
    <div className="relative flex-shrink-0 flex flex-col" style={{ height: `calc(50vh - ${topOffset}px)` }}>
      {/* Header Stats */}
      <div
        className="p-3 sm:p-4 text-white"
        style={{ background: epoch.bgGradient }}
      >
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-sm sm:text-lg font-bold">{epoch.name.ua}</h2>
            <p className="text-[10px] sm:text-xs opacity-80">Рівень {level}</p>
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold">
              {currencyIcon} {formatNumber(currency)}
            </div>
            <div className="text-[10px] sm:text-xs opacity-80">+{formatNumber(passiveXp)}/с XP</div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="w-full bg-black/30 rounded-full h-3 sm:h-4 overflow-hidden">
          <div
            className="h-full bg-white/90 transition-all duration-100 rounded-full"
            style={{ width: `${Math.min(xpPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] sm:text-xs mt-1 opacity-80">
          <span>{formatNumber(xp)} XP</span>
          <span>{formatNumber(xpToNextLevel)} XP</span>
        </div>
      </div>

      {/* Tap Area */}
      <div
        ref={areaRef}
        className="flex-1 relative overflow-hidden cursor-pointer select-none touch-manipulation"
        style={{
          background: epoch.bgGradient,
        }}
        onClick={handleTap}
        onTouchStart={handleTap}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Central Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl sm:text-8xl transform hover:scale-110 transition-transform duration-150 active:scale-95 drop-shadow-lg">
            {epoch.currencyIcon}
          </div>
        </div>

        {/* Tap Power Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm backdrop-blur-sm">
          Тап: +{tapPower} XP
        </div>

        {/* Floating Tap Events */}
        {tapEvents.map(event => (
          <div
            key={event.id}
            className="absolute pointer-events-none animate-float-up text-white font-bold text-lg sm:text-xl drop-shadow-lg"
            style={{
              left: event.x - 20,
              top: event.y - 20,
            }}
          >
            +{event.value}
          </div>
        ))}
      </div>
    </div>
  );
}
