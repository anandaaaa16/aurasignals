import React, { useState } from 'react';
import { SignalData } from '../types';
import {
  Copy,
  Check,
  Target,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Compass,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface SignalCardProps {
  signal: SignalData | null;
  currentPrice: number;
  onOpenAiModal: () => void;
  liveConfidence: number;
}

export const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  currentPrice,
  onOpenAiModal,
  liveConfidence,
}) => {
  const [copied, setCopied] = useState(false);

  if (!signal) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        <p className="text-xs">Memuat sinyal terkonfirmasi...</p>
      </div>
    );
  }

  const isBuy = signal.signal.includes('BUY');
  const isSell = signal.signal.includes('SELL');

  const avgEntry = (signal.entryRange.min + signal.entryRange.max) / 2;
  const tp1Price = signal.takeProfit[0]?.price || avgEntry + 10;
  const slPrice = signal.stopLoss?.price || avgEntry - 10;

  // Calculate live progress percentage to TP1
  let progressPercent = 0;
  if (isBuy) {
    const totalDist = tp1Price - avgEntry;
    const currentDist = currentPrice - avgEntry;
    progressPercent = totalDist > 0 ? Math.min(100, Math.max(0, Math.round((currentDist / totalDist) * 100))) : 0;
  } else {
    const totalDist = avgEntry - tp1Price;
    const currentDist = avgEntry - currentPrice;
    progressPercent = totalDist > 0 ? Math.min(100, Math.max(0, Math.round((currentDist / totalDist) * 100))) : 0;
  }

  const handleCopySetup = () => {
    const text = `🎯 [AURASIGNALS] ${signal.asset} ${signal.timeframe}
📌 Sinyal: ${signal.signal} (${signal.orderType})
💰 Entry Range: $${signal.entryRange.min} - $${signal.entryRange.max}
🟢 TP 1: $${signal.takeProfit[0]?.price}
🟢 TP 2: $${signal.takeProfit[1]?.price}
🟢 TP 3: $${signal.takeProfit[2]?.price}
🔴 Stop Loss: $${signal.stopLoss.price} (R:R ${signal.stopLoss.riskRewardRatio})
⏱ Validitas: ${signal.timeHorizon}
💡 SMC: ${signal.smartMoneyConcept.orderBlock}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
      {/* Header with Direction, Order Type & Live Confidence */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                isBuy
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : isSell
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
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
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span>{signal.asset}</span>
                <span>·</span>
                <span className="font-mono text-slate-300 font-semibold">{signal.timeframe}</span>
                <span>·</span>
                <span className="text-slate-400">{signal.orderType}</span>
              </div>
              <h2
                className={`text-xl sm:text-2xl font-black tracking-tight font-mono leading-tight ${
                  isBuy ? 'text-emerald-400' : isSell ? 'text-rose-400' : 'text-amber-400'
                }`}
              >
                {signal.signal}
              </h2>
            </div>
          </div>

          {/* Dynamic AI Confidence changing live */}
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">
              AI Confluence
            </span>
            <div className="flex items-baseline justify-end gap-1 font-mono">
              <span className="text-lg sm:text-xl font-extrabold text-amber-400 tabular-nums">
                {liveConfidence.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Progress Bar towards TP1 */}
        <div className="mt-4 pt-3 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
            <span className="flex items-center gap-1 text-slate-300">
              <Zap className="w-3 h-3 text-amber-400" />
              Progress Menuju TP 1
            </span>
            <span className="font-bold text-emerald-400">{progressPercent}% Tercapai</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Parameters: Entry, TP1, TP2, TP3, SL */}
      <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
        {/* Entry Zone */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Area Masuk (Entry Zone)
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              Live: ${currentPrice.toFixed(signal.asset === 'XAU/USD' ? 2 : 1)}
            </span>
          </div>
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-base sm:text-lg font-bold text-white tabular-nums">
              ${signal.entryRange.min.toLocaleString('en-US')} – ${signal.entryRange.max.toLocaleString('en-US')}
            </span>
            <span className="text-[11px] text-slate-500">{signal.timeHorizon}</span>
          </div>
        </div>

        {/* Take Profit Targets */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target Profit (Take Profit)</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {signal.takeProfit.map((tp, idx) => (
              <div
                key={idx}
                className="p-2 sm:p-2.5 bg-emerald-950/20 border border-emerald-800/30 rounded-xl text-left"
              >
                <div className="text-[10px] text-emerald-400/80 font-bold truncate">{tp.target.split(' ')[0]} {tp.target.split(' ')[1]}</div>
                <div className="text-xs sm:text-sm font-bold font-mono text-emerald-300 tabular-nums">
                  ${tp.price.toLocaleString('en-US')}
                </div>
                <div className="text-[10px] text-emerald-400/70 font-mono">
                  +{tp.pipsOrPoints} {signal.asset === 'XAU/USD' ? 'p' : 'pts'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stop Loss Level */}
        <div className="p-3 bg-rose-950/20 border border-rose-800/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-rose-300">Batas Rugi (Stop Loss)</div>
              <div className="text-[10px] text-rose-400/80 font-mono">
                Risiko: {signal.stopLoss.pipsOrPoints} {signal.asset === 'XAU/USD' ? 'pips' : 'pts'}
              </div>
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-sm sm:text-base font-bold text-rose-300 tabular-nums">
              ${signal.stopLoss.price.toLocaleString('en-US')}
            </div>
            <div className="text-[10px] text-slate-400">R:R {signal.stopLoss.riskRewardRatio}</div>
          </div>
        </div>

        {/* Smart Money Concepts (SMC) tags */}
        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Smart Money Concepts (SMC):
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 block text-[10px]">ORDER BLOCK</span>
              <span className="text-amber-300 font-semibold truncate block">
                {signal.smartMoneyConcept.orderBlock}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">FAIR VALUE GAP</span>
              <span className="text-sky-300 font-semibold truncate block">
                {signal.smartMoneyConcept.fairValueGap}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer: Big Full-Width Touch Controls on Phone */}
      <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
        <button
          onClick={handleCopySetup}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl transition-colors min-h-[44px] shadow-sm"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Setup Sinyal'}</span>
        </button>

        <button
          onClick={onOpenAiModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 rounded-xl transition-colors min-h-[44px]"
          title="Tampilkan analisis mendalam Gemini AI"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">Bedah AI</span>
        </button>
      </div>
    </div>
  );
};
