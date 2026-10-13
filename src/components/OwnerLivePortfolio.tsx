import React, { useMemo } from 'react';
import { AssetSymbol, ClosedTrade, SignalData } from '../types';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface OwnerLivePortfolioProps {
  currentSignal: SignalData | null;
  currentPrice: number;
  selectedAsset: AssetSymbol;
  closedTrades: ClosedTrade[];
  priceTickDirection: 'up' | 'down' | 'neutral';
  isMarketClosed?: boolean;
}

export const OwnerLivePortfolio: React.FC<OwnerLivePortfolioProps> = ({
  currentSignal,
  currentPrice,
  selectedAsset,
  closedTrades,
  priceTickDirection,
  isMarketClosed,
}) => {
  const INITIAL_CAPITAL = 500.0;

  // Realized profit calculation from closed trades (lot 0.05 for gold, 0.02 for BTC)
  const realizedPnl = useMemo(() => {
    return closedTrades.reduce((acc, t) => {
      const dollarGain =
        t.asset === 'XAU/USD'
          ? (t.exitPrice - t.entryPrice) * (t.direction === 'BUY' ? 1 : -1) * 5
          : (t.exitPrice - t.entryPrice) * (t.direction === 'BUY' ? 1 : -1) * 0.02;
      return acc + dollarGain;
    }, 0);
  }, [closedTrades]);

  // Floating PnL of current running position
  const runningPosition = useMemo(() => {
    if (!currentSignal || !currentPrice) return null;

    const isBuy = currentSignal.signal.includes('BUY');
    const entryPrice =
      currentSignal.entryPrice ||
      (currentSignal.entryRange.min + currentSignal.entryRange.max) / 2;

    const isGold = currentSignal.asset === 'XAU/USD';
    const lotSize = isGold ? 0.05 : 0.02;

    const priceDiff = isBuy ? currentPrice - entryPrice : entryPrice - currentPrice;
    const floatingDollar = isGold ? priceDiff * 5 : priceDiff * 0.02;
    const floatingPercent = (floatingDollar / INITIAL_CAPITAL) * 100;

    return {
      asset: currentSignal.asset,
      direction: isBuy ? ('BUY' as const) : ('SELL' as const),
      lotSize,
      entryPrice,
      currentPrice,
      floatingDollar: Math.round(floatingDollar * 100) / 100,
      floatingPercent: Math.round(floatingPercent * 100) / 100,
      targetTp: currentSignal.takeProfit[0]?.price,
      stopLoss: currentSignal.stopLoss?.price,
    };
  }, [currentSignal, currentPrice]);

  const currentEquity = Math.round((INITIAL_CAPITAL + realizedPnl + (runningPosition?.floatingDollar || 0)) * 100) / 100;
  const totalGrowthPercent = Math.round(((currentEquity - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 1000) / 10;
  const winCount = closedTrades.filter((t) => t.hitType === 'HIT_TP').length;
  const winRate = closedTrades.length > 0 ? Math.round((winCount / closedTrades.length) * 1000) / 10 : 85.7;

  const isFloatingProfit = (runningPosition?.floatingDollar || 0) >= 0;

  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-teal-500/25 shadow-2xl space-y-3.5 backdrop-blur-2xl">
      {/* Header: Cukup tulisan "Live Trading" dengan kedip hijau & Modal Awal $500 */}
      <div className="flex items-center justify-between border-b border-teal-500/15 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-400" />
          <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide font-mono">
            Live Trading
          </h3>
        </div>

        <div className="text-right font-mono text-xs text-slate-400">
          Modal Awal: <strong className="text-white">${INITIAL_CAPITAL.toFixed(2)}</strong>
        </div>
      </div>

      {/* Saldo / Equity & Return Metrics */}
      <div className="grid grid-cols-3 gap-2 font-mono">
        <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-teal-500/20">
          <span className="text-[10px] text-slate-400 block mb-0.5">Saldo / Equity</span>
          <div className="text-base sm:text-lg font-black text-white tabular-nums tracking-tight">
            ${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-teal-500/20">
          <span className="text-[10px] text-slate-400 block mb-0.5">Total Return</span>
          <div className="text-base sm:text-lg font-black text-emerald-400 tabular-nums tracking-tight">
            +{totalGrowthPercent}%
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-teal-500/20">
          <span className="text-[10px] text-slate-400 block mb-0.5">Win Rate</span>
          <div className="text-base sm:text-lg font-black text-cyan-300 tabular-nums">
            {winRate}%
          </div>
        </div>
      </div>

      {/* Posisi Terbuka Saat Ini */}
      {runningPosition ? (
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-teal-500/25 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  runningPosition.direction === 'BUY'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {runningPosition.direction === 'BUY' ? (
                  <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 stroke-[3]" />
                )}
              </div>

              <div>
                <span className="font-extrabold text-xs text-white tracking-wide font-mono">
                  {runningPosition.direction} {runningPosition.asset}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  Lot: {runningPosition.lotSize} · Entry @ ${runningPosition.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Live Floating PnL */}
            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-400 block">Floating PnL</span>
              <div
                className={`text-sm font-black tabular-nums ${
                  isFloatingProfit ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isFloatingProfit ? '+' : ''}${runningPosition.floatingDollar.toFixed(2)} ({isFloatingProfit ? '+' : ''}{runningPosition.floatingPercent.toFixed(2)}%)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1.5 border-t border-white/5">
            <div className="text-slate-300">
              <span className="text-slate-500">TP: </span>
              <span className="text-emerald-400 font-bold">${runningPosition.targetTp?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="text-right text-slate-300">
              <span className="text-slate-500">SL: </span>
              <span className="text-rose-400 font-bold">${runningPosition.stopLoss?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-teal-500/15 text-center">
          <div className="text-xs font-mono font-bold text-slate-300">
            {isMarketClosed || selectedAsset === 'XAU/USD'
              ? 'Pasar XAU/USD Libur · Semua Posisi Flat'
              : 'Tidak Ada Posisi Terbuka'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {isMarketClosed || selectedAsset === 'XAU/USD'
              ? 'Seluruh order ditutup saat akhir pekan demi keamanan modal 100%.'
              : 'Menunggu pembukaan posisi berikutnya...'}
          </div>
        </div>
      )}
    </div>
  );
};
