import React from 'react';
import { SignalData } from '../types';
import { Target, ShieldAlert, ArrowUpRight, ArrowDownRight, Radio, Compass, Clock } from 'lucide-react';

interface TpProgressCardProps {
  signal: SignalData | null;
  currentPrice: number;
  liveConfidence: number;
  isMarketClosed?: boolean;
}

export const TpProgressCard: React.FC<TpProgressCardProps> = ({
  signal,
  currentPrice,
  liveConfidence,
  isMarketClosed,
}) => {
  if (isMarketClosed) {
    return (
      <div className="glass-panel rounded-3xl p-5 border border-amber-500/30 text-center space-y-3 backdrop-blur-2xl">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
          <Clock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm text-white font-mono tracking-wide">
            MARKET CLOSED · WEEKEND
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Traditional markets closed. Crypto Perpetual Futures trade 24/7/365 with active continuous order flow.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-300 font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Status: Crypto Futures Active</span>
        </div>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="glass-panel rounded-3xl p-5 border border-teal-500/20 text-center space-y-2 backdrop-blur-2xl">
        <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 mx-auto flex items-center justify-center">
          <Compass className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="font-extrabold text-sm text-white font-mono tracking-wide">
            AI ENGINE STANDBY
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Menunggu konfirmasi sinyal & order flow pasar Binance.
          </p>
        </div>
      </div>
    );
  }

  if (!currentPrice) {
    return (
      <div className="p-5 glass-panel rounded-3xl text-center text-slate-400">
        <p className="text-xs font-mono">Menghubungkan ke pasar Binance...</p>
      </div>
    );
  }

  const isBuy = signal.signal.includes('BUY');
  const isSell = signal.signal.includes('SELL');
  const avgEntry = signal.entryPrice || (signal.entryRange.min + signal.entryRange.max) / 2;
  const tp1Price = signal.takeProfit[0]?.price || (isBuy ? avgEntry * 1.025 : avgEntry * 0.975);
  const slPrice = signal.stopLoss?.price || (isBuy ? avgEntry * 0.99 : avgEntry * 1.01);

  // Real-time tick progress calculation towards single TP
  let progressPercent = 0;
  if (isBuy) {
    const totalDist = tp1Price - avgEntry;
    const currentDist = currentPrice - avgEntry;
    if (totalDist > 0) {
      const rawPct = (currentDist / totalDist) * 100;
      progressPercent = Math.min(100, Math.max(0, Math.round(rawPct)));
    }
  } else {
    const totalDist = avgEntry - tp1Price;
    const currentDist = avgEntry - currentPrice;
    if (totalDist > 0) {
      const rawPct = (currentDist / totalDist) * 100;
      progressPercent = Math.min(100, Math.max(0, Math.round(rawPct)));
    }
  }

  // Real-Time Floating PnL calculation on every single tick (10x Leverage Multiplier)
  const leverage = 10;
  const standardMargin = 150.0; // $150 USDT margin
  const priceMovePct = avgEntry > 0 ? ((currentPrice - avgEntry) / avgEntry) * (isBuy ? 1 : -1) : 0;
  const roePercent = priceMovePct * leverage * 100;
  const floatingDollar = standardMargin * (roePercent / 100);
  const isFloatingProfit = floatingDollar >= 0;

  // Price distance to TP & SL in USDT
  const distToTpUsdt = Math.abs(tp1Price - currentPrice);
  const distToSlUsdt = Math.abs(currentPrice - slPrice);

  const formatPrice = (v?: number) => {
    if (!v) return '---';
    if (signal.asset === 'XRP/USDT') return v.toFixed(4);
    if (signal.asset === 'ETH/USDT') return v.toFixed(2);
    return v.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  };

  const targetRoe = signal.takeProfit[0]?.targetRoePercent || 25.0;
  const slRoe = signal.stopLoss?.slRoePercent || -10.0;

  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-teal-500/25 shadow-2xl space-y-3.5 backdrop-blur-2xl">
      {/* 1. Header: Live Signal Status & 10x Futures Multiplier */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 ${
              isBuy
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : isSell
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {isBuy ? (
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            ) : isSell ? (
              <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Compass className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-teal-300">
                {signal.asset} · 10x Futures
              </span>
              <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                <Radio className="w-2 h-2 animate-pulse" />
                ACTIVE POSITION
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className={`text-lg font-black tracking-tight ${
                  isBuy ? 'text-emerald-400' : isSell ? 'text-rose-400' : 'text-amber-400'
                }`}
              >
                {signal.signal} ({isBuy ? 'LONG' : 'SHORT'})
              </span>
              <span className="text-[10px] text-amber-300 font-mono font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                10x Leverage
              </span>
            </div>
          </div>
        </div>

        {/* Floating Live Profit Pill with ROE % */}
        <div className="text-right font-mono">
          <div className="text-[10px] text-slate-400 uppercase">Live Floating PnL</div>
          <div
            className={`text-base font-black tabular-nums ${
              isFloatingProfit ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isFloatingProfit ? '+' : '-'}${Math.abs(floatingDollar).toFixed(2)}
          </div>
          <div
            className={`text-[10px] font-bold ${
              isFloatingProfit ? 'text-emerald-400/90' : 'text-rose-400/90'
            }`}
          >
            ({isFloatingProfit ? '+' : ''}{roePercent.toFixed(1)}% ROE)
          </div>
        </div>
      </div>

      {/* 2. Seamless Progress Bar Towards Single TP */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Target className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold text-slate-200">Progress to TP (+{targetRoe}% ROE)</span>
          </div>
          <span className="text-emerald-400 font-bold font-mono">
            {progressPercent}%
          </span>
        </div>

        {/* High-glow progress track */}
        <div className="relative w-full h-3 bg-slate-900/80 rounded-full overflow-hidden border border-teal-500/20 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 transition-all duration-300 relative shadow-[0_0_12px_rgba(20,184,166,0.6)]"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          >
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/70 rounded-full animate-pulse" />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
          <span className="flex items-center gap-1 text-teal-300">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            <span>Target: ${formatPrice(distToTpUsdt)} to TP</span>
          </span>
          <span className="flex items-center gap-1 text-rose-400/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Invalidation: ${formatPrice(distToSlUsdt)} to SL</span>
          </span>
        </div>
      </div>

      {/* 3. Target Level Cards: 1 TP & 1 SL */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <div className="p-3 glass-panel-subtle rounded-2xl text-left border border-emerald-500/30 bg-emerald-500/5">
          <div className="text-[10px] text-emerald-400 font-bold uppercase flex items-center justify-between mb-1">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3 text-emerald-400" />
              <span>TAKE PROFIT (TP 1)</span>
            </span>
            <span className="text-[9px] text-emerald-300 font-mono font-bold bg-emerald-500/20 px-1 py-0.2 rounded">
              +{targetRoe}% ROE
            </span>
          </div>
          <div className="text-base font-extrabold font-mono text-emerald-300 tabular-nums">
            ${formatPrice(tp1Price)}
          </div>
        </div>

        <div className="p-3 glass-panel-subtle rounded-2xl text-left border border-rose-500/30 bg-rose-500/5">
          <div className="text-[10px] text-rose-400 font-bold uppercase flex items-center justify-between mb-1">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>STOP LOSS (SL)</span>
            </span>
            <span className="text-[9px] text-rose-300 font-mono font-bold bg-rose-500/20 px-1 py-0.2 rounded">
              {slRoe}% ROE
            </span>
          </div>
          <div className="text-base font-extrabold font-mono text-rose-300 tabular-nums">
            ${formatPrice(slPrice)}
          </div>
        </div>
      </div>
    </div>
  );
};
