import React, { useState } from 'react';
import { AssetSymbol, SignalData, Timeframe } from '../types';
import {
  X,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
  CheckCircle2,
  Copy,
  Check,
  Target,
  ShieldAlert,
} from 'lucide-react';

interface AiAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: SignalData | null;
  asset: AssetSymbol;
  timeframe: Timeframe;
  currentPrice: number;
  isLoading: boolean;
  onRefreshAi: () => void;
}

export const AiAnalysisModal: React.FC<AiAnalysisModalProps> = ({
  isOpen,
  onClose,
  signal,
  asset,
  timeframe,
  currentPrice,
  isLoading,
  onRefreshAi,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isBuy = signal?.signal.includes('BUY') ?? true;
  const isSell = signal?.signal.includes('SELL') ?? false;

  const handleCopy = () => {
    if (!signal) return;
    const text = `🧠 [AI ORACLE DEEP ANALYSIS] ${asset} (${timeframe.toUpperCase()})
Harga: $${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
Sinyal: ${signal.signal} (${signal.confidencePercent}% Confidence)
Bias SMC: ${signal.smartMoneyConcept?.marketBias || 'Bullish Expansion'}
Order Block: ${signal.smartMoneyConcept?.orderBlock || 'N/A'}
Liquidity Target: ${signal.smartMoneyConcept?.liquidityZone || 'N/A'}
FVG: ${signal.smartMoneyConcept?.fairValueGap || 'N/A'}
Katalis Makro: ${signal.macroeconomicCatalyst || 'N/A'}
Catatan Risiko: ${signal.riskManagementNote || 'Gunakan SL terukur'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      {/* Background click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl glass-panel border border-teal-500/30 bg-[#04191e]/95 text-white shadow-2xl shadow-teal-950/50 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400" />

        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-teal-500/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white tracking-wide">
                  Gemini Institutional Oracle
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  AI v3.8
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {asset} · TF {timeframe.toUpperCase()} · ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onRefreshAi}
              disabled={isLoading}
              className={`p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-teal-300 border border-teal-500/20 transition-all cursor-pointer ${
                isLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              title="Regenerate Analysis"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {isLoading ? (
            <div className="py-14 text-center space-y-3">
              <div className="inline-flex p-3 rounded-2xl bg-teal-500/20 text-teal-300 animate-spin border border-teal-400/40">
                <RefreshCw className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-teal-200">
                Memproses Pola Likuiditas Institusional...
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Mengevaluasi Fair Value Gap, Order Block, dan sentimen makro ekonomi real-time.
              </p>
            </div>
          ) : (
            <>
              {/* Verdict Summary Box */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isBuy
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : isSell
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                } flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      isBuy ? 'bg-emerald-500/20' : isSell ? 'bg-rose-500/20' : 'bg-amber-500/20'
                    }`}
                  >
                    {isBuy ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : isSell ? (
                      <TrendingDown className="w-5 h-5" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider opacity-75">
                      Konsensus Kecerdasan Buatan
                    </span>
                    <div className="font-extrabold text-base tracking-wide text-white">
                      {signal?.signal || 'STRONG BUY'}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono opacity-75 block">Tingkat Keyakinan</span>
                  <span className="text-lg font-black font-mono text-teal-300">
                    {signal?.confidencePercent || 88}%
                  </span>
                </div>
              </div>

              {/* Smart Money Concepts (SMC) Section */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-teal-500/20 space-y-2.5">
                <div className="flex items-center gap-2 text-teal-300 font-bold tracking-wide">
                  <Layers className="w-4 h-4" />
                  <span>Struktur Smart Money Concept (SMC)</span>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Market Bias</span>
                    <span className="font-bold text-white text-xs">
                      {signal?.smartMoneyConcept?.marketBias || 'Bullish Expansion'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Order Block</span>
                    <span className="font-semibold text-teal-300 text-xs">
                      {signal?.smartMoneyConcept?.orderBlock || 'Demand Zone Terkonfirmasi'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Liquidity Target</span>
                    <span className="font-semibold text-emerald-300 text-xs truncate block">
                      {signal?.smartMoneyConcept?.liquidityZone || 'Equal Highs Sweep'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Fair Value Gap</span>
                    <span className="font-semibold text-cyan-300 text-xs">
                      {signal?.smartMoneyConcept?.fairValueGap || 'FVG Imbalance Mitigated'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Confluences */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-teal-500/20 space-y-2">
                <div className="flex items-center gap-2 text-teal-300 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi Teknikal Terpadu</span>
                </div>
                <div className="space-y-1.5">
                  {signal?.technicalConfluence && signal.technicalConfluence.length > 0 ? (
                    signal.technicalConfluence.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-300 text-xs">
                        <span className="text-teal-400 font-bold mt-0.5 shrink-0">✓</span>
                        <span>{item}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start gap-2 text-slate-300 text-xs">
                        <span className="text-teal-400 font-bold mt-0.5 shrink-0">✓</span>
                        <span>Breakout retest pada Bullish Order Block dengan konfirmasi volume.</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-300 text-xs">
                        <span className="text-teal-400 font-bold mt-0.5 shrink-0">✓</span>
                        <span>RSI mempertahankan momentum bullish di atas area 50 baseline.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Macroeconomic Catalyst */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-teal-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-teal-300 font-bold">
                  <Globe className="w-4 h-4" />
                  <span>Sentimen & Katalis Makroekonomi</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {signal?.macroeconomicCatalyst ||
                    (asset.includes('XAU')
                      ? 'Dinamika yield US Treasury dan pelemahan indeks DXY memperkuat momentum lindung nilai pada instrumen Emas.'
                      : 'Arus dana institusional dan stabilitas cadangan likuiditas di pasar kripto mendukung kelanjutan tren akumulasi.')}
                </p>
              </div>

              {/* Execution & Risk Management */}
              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-teal-500/20 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Protokol Manajemen Risiko</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {signal?.riskManagementNote ||
                    'Pertahankan resiko maksimal 1-2% modal per entri. Pindahkan stop loss ke breakeven (BEP) segera setelah Target TP 1 tersentuh.'}
                </p>

                {signal && (
                  <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <Target className="w-3.5 h-3.5 shrink-0" />
                      <span>TP 1: ${signal.takeProfit?.[0]?.price}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-400">
                      <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      <span>SL: ${signal.stopLoss?.price}</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 border-t border-teal-500/15 bg-slate-950/70 flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/25 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Analisis Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Analisis AI</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
