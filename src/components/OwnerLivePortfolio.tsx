import React, { useMemo } from 'react';
import { AssetSymbol, ClosedTrade, SignalData, calculateTradeGain } from '../types';
import { ArrowUpRight, ArrowDownRight, Lock, Sparkles, Layers, Zap } from 'lucide-react';

interface OwnerLivePortfolioProps {
  activeSignals: Record<AssetSymbol, SignalData | null>;
  currentPrices: Record<AssetSymbol, number>;
  closedTrades: ClosedTrade[];
  userRole?: 'GUEST' | 'MEMBER' | 'ADMIN';
  onOpenAccessModal?: () => void;
  onOpenVipPayment?: () => void;
}

export const OwnerLivePortfolio: React.FC<OwnerLivePortfolioProps> = ({
  activeSignals,
  currentPrices,
  closedTrades,
  userRole = 'GUEST',
  onOpenAccessModal,
  onOpenVipPayment,
}) => {
  const INITIAL_CAPITAL = 500.0;
  const isGuest = userRole === 'GUEST';
  const LEVERAGE = 10;
  const MARGIN_PER_ASSET = 150.0; // $150 USDT margin per position ($1,500 notional)

  // Realized profit calculation from closed trades
  const realizedPnl = useMemo(() => {
    return closedTrades.reduce((acc, t) => {
      return acc + calculateTradeGain(t);
    }, 0);
  }, [closedTrades]);

  // Combined running positions for all 3 assets (BTC, ETH, XRP) in Crypto Futures (10x Leverage)
  const activePositions = useMemo(() => {
    const assets: AssetSymbol[] = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
    return assets
      .map((asset) => {
        const signal = activeSignals[asset];
        const price = currentPrices[asset];
        if (!signal || !price) return null;

        const isBuy = signal.signal.includes('BUY');
        const entryPrice =
          signal.entryPrice ||
          (signal.entryRange.min + signal.entryRange.max) / 2;

        // Price percentage movement
        const priceMovePct = entryPrice > 0 ? ((price - entryPrice) / entryPrice) * (isBuy ? 1 : -1) : 0;
        // 10x Leverage Multiplier applied to ROE
        const roePercent = priceMovePct * LEVERAGE * 100;
        // Floating Dollar Profit on $150 USDT Margin
        const floatingDollar = MARGIN_PER_ASSET * (roePercent / 100);

        return {
          asset,
          direction: isBuy ? ('BUY' as const) : ('SELL' as const),
          leverage: LEVERAGE,
          marginUsdt: MARGIN_PER_ASSET,
          positionNotional: MARGIN_PER_ASSET * LEVERAGE,
          entryPrice,
          currentPrice: price,
          floatingDollar: Math.round(floatingDollar * 100) / 100,
          roePercent: Math.round(roePercent * 10) / 10,
          targetTp: signal.takeProfit[0]?.price,
          targetRoe: signal.takeProfit[0]?.targetRoePercent || 25.0,
          stopLoss: signal.stopLoss?.price,
          slRoe: signal.stopLoss?.slRoePercent || -10.0,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [activeSignals, currentPrices]);

  // Total Combined Floating Dollar across all active positions
  const totalCombinedFloating = useMemo(() => {
    return activePositions.reduce((acc, pos) => acc + pos.floatingDollar, 0);
  }, [activePositions]);

  const currentEquity = Math.round((INITIAL_CAPITAL + realizedPnl + totalCombinedFloating) * 100) / 100;
  const totalGrowthPercent = Math.round(((currentEquity - INITIAL_CAPITAL) / INITIAL_CAPITAL) * 1000) / 10;
  const isPositiveReturn = totalGrowthPercent >= 0;
  const isPositiveFloating = totalCombinedFloating >= 0;

  const winCount = closedTrades.filter((t) => t.hitType === 'HIT_TP').length;
  const winRate = closedTrades.length > 0 ? Math.round((winCount / closedTrades.length) * 1000) / 10 : 85.7;

  const formatPrice = (val?: number, asset?: AssetSymbol) => {
    if (!val) return '---';
    if (asset === 'XRP/USDT') return val.toFixed(4);
    if (asset === 'ETH/USDT') return val.toFixed(2);
    return val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  };

  const handleUnlockClick = () => {
    if (onOpenVipPayment) {
      onOpenVipPayment();
    } else if (onOpenAccessModal) {
      onOpenAccessModal();
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-teal-500/25 shadow-2xl space-y-3.5 backdrop-blur-2xl">
      {/* Header: Live Trading & Initial Portfolio Balance */}
      <div className="flex items-center justify-between border-b border-teal-500/15 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-md shadow-emerald-400" />
          <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide font-mono flex items-center gap-1.5">
            <span>Live Trading</span>
          </h3>
        </div>

        <div className="text-right font-mono text-xs text-slate-400 flex items-center gap-1.5">
          <span>Balance: <strong className="text-white">${INITIAL_CAPITAL.toFixed(2)}</strong></span>
        </div>
      </div>

      {/* Equity & Return Metrics */}
      <div className="grid grid-cols-3 gap-2 font-mono">
        <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-teal-500/20">
          <span className="text-[10px] text-slate-400 block mb-0.5">Live Equity</span>
          <div className="text-base sm:text-lg font-black text-white tabular-nums tracking-tight">
            ${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-teal-500/20">
          <span className="text-[10px] text-slate-400 block mb-0.5">Total Return</span>
          <div
            className={`text-base sm:text-lg font-black tabular-nums tracking-tight ${
              isPositiveReturn ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositiveReturn ? '+' : ''}
            {totalGrowthPercent.toFixed(1)}%
          </div>
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-900/60 border border-teal-500/20">
          <span className="text-[10px] text-slate-400 block mb-0.5">Win Rate</span>
          <div className="text-base sm:text-lg font-black text-cyan-300 tabular-nums">
            {winRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Active Positions: Combined View of 3 Crypto Signals (BTC, ETH, XRP) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-mono px-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>Active Positions ({activePositions.length}/3 Live)</span>
          </div>

          {/* Real-time Combined Floating PnL - Visible to all users */}
          <div
            className={`font-black tabular-nums flex items-center gap-1 ${
              isPositiveFloating ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            <span className="text-[10px] text-slate-400 font-normal">Floating:</span>
            <span>
              {isPositiveFloating ? '+' : '-'}${Math.abs(totalCombinedFloating).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Positions Container */}
        {activePositions.length > 0 ? (
          <div className="rounded-2xl border border-teal-500/25 bg-slate-950/70 p-2.5 space-y-2">
            {/* Live Positions List - Floating PnL is completely visible; only Entry is sensored for Guests */}
            {activePositions.map((pos) => {
              const isPosProfit = pos.floatingDollar >= 0;
              return (
                <div
                  key={pos.asset}
                  className="p-2.5 rounded-xl bg-slate-900/70 border border-white/5 space-y-1.5 hover:border-teal-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          pos.direction === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {pos.direction === 'BUY' ? (
                          <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-white tracking-wide font-mono">
                            {pos.direction === 'BUY' ? 'LONG' : 'SHORT'} {pos.asset}
                          </span>
                        </div>

                        {/* SENSORING REQUIREMENT:
                            Only sensor Entry @ for Guests. No VIP Unlock text next to entry.
                            Members see exact Entry @ level! */}
                        <div className="text-[10px] font-mono mt-0.5">
                          {isGuest ? (
                            <div className="inline-flex items-center gap-1 text-slate-400">
                              <span>Entry @</span>
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-400/30 text-amber-300 font-bold tracking-widest text-[9px]">
                                ••••••
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-bold">
                              Entry @ ${formatPrice(pos.entryPrice, pos.asset)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Live Floating PnL - ALWAYS FULLY VISIBLE TO BOTH GUESTS AND MEMBERS */}
                    <div className="text-right font-mono">
                      <div
                        className={`text-xs sm:text-sm font-black tabular-nums ${
                          isPosProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPosProfit ? '+' : '-'}${Math.abs(pos.floatingDollar).toFixed(2)}
                      </div>
                      <div
                        className={`text-[10px] font-bold tabular-nums ${
                          isPosProfit ? 'text-emerald-400/90' : 'text-rose-400/90'
                        }`}
                      >
                        {isPosProfit ? '+' : ''}{pos.roePercent.toFixed(1)}% ROE
                      </div>
                    </div>
                  </div>

                  {/* Target TP & Invalidation SL */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1.5 border-t border-white/5">
                    <div className="text-slate-300 flex items-center justify-between">
                      <span className="text-slate-500">TP 1:</span>
                      <span className="text-emerald-400 font-bold">
                        ${formatPrice(pos.targetTp, pos.asset)}{' '}
                        <span className="text-[9px] text-emerald-400/70 font-normal">
                          (+{pos.targetRoe}%)
                        </span>
                      </span>
                    </div>

                    <div className="text-slate-300 flex items-center justify-between">
                      <span className="text-slate-500">SL:</span>
                      <span className="text-rose-400 font-bold">
                        ${formatPrice(pos.stopLoss, pos.asset)}{' '}
                        <span className="text-[9px] text-rose-400/70 font-normal">
                          ({pos.slRoe}%)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}


          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-teal-500/15 text-center">
            <div className="text-xs font-mono font-bold text-slate-300">
              No Active Position · AI Scanning BTC, ETH & XRP 24/7
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
