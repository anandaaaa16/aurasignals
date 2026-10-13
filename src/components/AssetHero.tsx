import React from 'react';
import { AssetSymbol, MarketTicker } from '../types';

interface AssetHeroProps {
  selectedAsset: AssetSymbol;
  onSelectAsset: (asset: AssetSymbol) => void;
  currentTicker: MarketTicker | null;
  priceTickDirection: 'up' | 'down' | 'neutral';
  isMarketClosed?: boolean;
}

export const AssetHero: React.FC<AssetHeroProps> = ({
  selectedAsset,
  onSelectAsset,
  currentTicker,
  priceTickDirection,
  isMarketClosed,
}) => {
  const isUp = (currentTicker?.change24h || 0) >= 0;

  return (
    <div className="pt-0.5 pb-1 px-1 sm:px-2">
      {/* Top Asset Switcher & Title */}
      <div className="flex items-center justify-between gap-3 mb-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono flex items-center gap-1.5">
            <span>{selectedAsset === 'BTC/USDT' ? 'BTC' : 'XAU'}</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isMarketClosed
                  ? 'bg-amber-400'
                  : 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400'
              }`}
            />
          </h1>

          <span className="text-[11px] font-semibold text-teal-300/90 bg-teal-950/60 border border-teal-500/20 px-2 py-0.5 rounded-lg">
            {selectedAsset === 'BTC/USDT' ? 'Bitcoin' : 'Gold (Emas)'}
          </span>

          {isMarketClosed && (
            <span className="text-[10px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold">
              Libur Akhir Pekan
            </span>
          )}
        </div>

        {/* Asset Switcher (BTC / XAU) */}
        <div className="inline-flex p-0.5 bg-[#021317]/90 border border-teal-500/25 rounded-xl shadow-inner">
          <button
            onClick={() => onSelectAsset('BTC/USDT')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedAsset === 'BTC/USDT'
                ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            BTC
          </button>
          <button
            onClick={() => onSelectAsset('XAU/USD')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              selectedAsset === 'XAU/USD'
                ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            XAU (Emas)
          </button>
        </div>
      </div>

      {/* Giant Main Price: 1-Second Dynamic Tick Flash (Kedip Hijau / Merah) */}
      <div className="my-0.5">
        <div
          className={`inline-block font-mono text-3xl sm:text-5xl font-black tracking-tight tabular-nums px-2 py-0.5 -mx-2 rounded-xl transition-all duration-300 ${
            priceTickDirection === 'up'
              ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-400/40 shadow-[0_0_25px_rgba(16,185,129,0.35)] scale-[1.01]'
              : priceTickDirection === 'down'
              ? 'text-rose-400 bg-rose-500/20 border border-rose-400/40 shadow-[0_0_25px_rgba(244,63,94,0.35)] scale-[1.01]'
              : 'text-white border border-transparent'
          }`}
        >
          ${currentTicker?.price?.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || '---.--'}
        </div>
      </div>

      {/* 24h & High/Low Subtitle line (Compact & mepet ke chart) */}
      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mb-1">
        <span className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
          {isUp ? '↗' : '↘'}
        </span>
        <span className="text-slate-300">
          24h High: ${currentTicker?.high24h?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '---'}
        </span>
        <span className="text-slate-500">·</span>
        <span className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
          {isUp ? '+' : ''}
          {currentTicker?.changePercent?.toFixed(2) || '0.00'}%
        </span>
      </div>
    </div>
  );
};
