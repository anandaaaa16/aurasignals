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
            PASAR XAU/USD LIBUR (AKHIR PEKAN)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            Bursa emas internasional tutup saat weekend. Seluruh transaksi di-close dan tidak ada posisi dibuka. Sinyal baru otomatis aktif kembali saat pasar buka (Senin 05:00 WIB).
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-300 font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Status: Semua Posisi Flat (Zero Exposure)</span>
        </div>
      </div>
    );
  }

  if (!signal || !currentPrice) {
    return (
      <div className="p-5 glass-panel rounded-3xl text-center text-slate-400">
        <p className="text-xs">Memuat sinyal posisi aktif...</p>
      </div>
    );
  }

  const isBuy = signal.signal.includes('BUY');
  const isSell = signal.signal.includes('SELL');
  const avgEntry = signal.entryPrice || (signal.entryRange.min + signal.entryRange.max) / 2;
  const tp1Price = signal.takeProfit[0]?.price || (isBuy ? avgEntry + 10 : avgEntry - 10);
  const slPrice = signal.stopLoss?.price || (isBuy ? avgEntry - 10 : avgEntry + 10);

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

  // Real-Time Floating PnL calculation on every single tick
  const diff = isBuy ? currentPrice - avgEntry : avgEntry - currentPrice;
  const isFloatingProfit = diff >= 0;
  const isGold = signal.asset === 'XAU/USD';
  const floatingPips = isGold ? Math.round(diff * 10 * 10) / 10 : Math.round(diff);
  const floatingPercent = Math.round((diff / avgEntry) * 100 * 100) / 100;

  // Distance in pips to TP and SL
  const distToTpPips = isGold
    ? Math.max(0, Math.round(Math.abs(tp1Price - currentPrice) * 10 * 10) / 10)
    : Math.max(0, Math.round(Math.abs(tp1Price - currentPrice)));

  const distToSlPips = isGold
    ? Math.max(0, Math.round(Math.abs(currentPrice - slPrice) * 10 * 10) / 10)
    : Math.max(0, Math.round(Math.abs(currentPrice - slPrice)));

  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-teal-500/25 shadow-2xl space-y-3.5 backdrop-blur-2xl">
      {/* 1. Header: Live Signal Status & Confidence */}
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
                {signal.asset} · H1
              </span>
              <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                <Radio className="w-2 h-2 animate-pulse" />
                POSISI AKTIF
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span
                className={`text-lg font-black tracking-tight ${
                  isBuy ? 'text-emerald-400' : isSell ? 'text-rose-400' : 'text-amber-400'
                }`}
              >
                {signal.signal}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({signal.orderType})
              </span>
            </div>
          </div>
        </div>

        {/* Floating Live Profit Pill */}
        <div className="text-right font-mono">
          <div className="text-[10px] text-slate-400 uppercase">Floating PnL</div>
          <div
            className={`text-base font-black tabular-nums ${
              isFloatingProfit ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isFloatingProfit ? '+' : ''}
            {floatingPips} {isGold ? 'pips' : 'pts'}
          </div>
          <div
            className={`text-[10px] font-bold ${
              isFloatingProfit ? 'text-emerald-400/80' : 'text-rose-400/80'
            }`}
          >
            ({isFloatingProfit ? '+' : ''}{floatingPercent}%)
          </div>
        </div>
      </div>

      {/* 2. Seamless Progress Bar Towards Single TP */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Target className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold text-slate-200">Progres Menuju TP</span>
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
            <span>Jarak {distToTpPips} {isGold ? 'pips' : 'pts'} ke TP</span>
          </span>
          <span className="flex items-center gap-1 text-rose-400/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Jarak {distToSlPips} {isGold ? 'pips' : 'pts'} ke SL</span>
          </span>
        </div>
      </div>

      {/* 3. Target Level Cards: CUKUP 1 TP & 1 SL */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <div className="p-3 glass-panel-subtle rounded-2xl text-left border border-emerald-500/30 bg-emerald-500/5">
          <div className="text-[10px] text-emerald-400 font-bold uppercase flex items-center justify-between mb-0.5">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3 text-emerald-400" />
              <span>TAKE PROFIT (TP)</span>
            </span>
            <span className="text-[9px] text-emerald-400/80 font-mono">
              +{signal.takeProfit[0]?.pipsOrPoints} {isGold ? 'pips' : 'pts'}
            </span>
          </div>
          <div className="text-base font-extrabold font-mono text-emerald-300 tabular-nums">
            ${signal.takeProfit[0]?.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Tutup otomatis saat tersentuh
          </div>
        </div>

        <div className="p-3 glass-panel-subtle rounded-2xl text-left border border-rose-500/30 bg-rose-500/5">
          <div className="text-[10px] text-rose-400 font-bold uppercase flex items-center justify-between mb-0.5">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>STOP LOSS (SL)</span>
            </span>
            <span className="text-[9px] text-rose-400/80 font-mono">
              R:R {signal.stopLoss?.riskRewardRatio || '1:2.0'}
            </span>
          </div>
          <div className="text-base font-extrabold font-mono text-rose-300 tabular-nums">
            ${slPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Batas pengaman modal
          </div>
        </div>
      </div>
    </div>
  );
};
