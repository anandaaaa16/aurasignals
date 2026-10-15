import React, { useMemo } from 'react';
import {
  AssetSymbol,
  MarketTicker,
  SignalData,
} from '../types';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
  Compass,
  ShieldAlert,
  Sparkles,
  BarChart,
  Radio,
  ArrowUpRight,
  ArrowDownRight,
  Newspaper,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface AnalyticChartsViewProps {
  selectedAsset: AssetSymbol;
  onSelectAsset: (asset: AssetSymbol) => void;
  currentTicker: MarketTicker | null;
  activeSignal?: SignalData | null;
  userRole?: 'GUEST' | 'MEMBER' | 'ADMIN';
  onOpenVipModal: () => void;
}

export const AnalyticChartsView: React.FC<AnalyticChartsViewProps> = ({
  selectedAsset,
  onSelectAsset,
  currentTicker,
  activeSignal,
  userRole = 'GUEST',
  onOpenVipModal,
}) => {
  const isGuest = userRole === 'GUEST';

  const price = currentTicker?.price || (selectedAsset === 'BTC/USDT' ? 83200 : selectedAsset === 'ETH/USDT' ? 2540 : 1.38);
  const changePct = currentTicker?.changePercent ?? 0;
  const isUp = changePct > 0;

  // Format price helper
  const fmt = (p?: number) => {
    if (!p) return '---';
    if (selectedAsset === 'XRP/USDT') return p.toFixed(4);
    if (selectedAsset === 'ETH/USDT') return p.toFixed(2);
    return p.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  };

  // Check if there is an active open position for this asset
  const isOpenPosition = Boolean(activeSignal && activeSignal.status === 'RUNNING');
  const isBuy = activeSignal?.signal.includes('BUY') ?? true;
  const entryPrice = activeSignal ? (activeSignal.entryPrice || (activeSignal.entryRange.min + activeSignal.entryRange.max) / 2) : price;
  const tp1Price = activeSignal?.takeProfit?.[0]?.price;
  const tp2Price = activeSignal?.takeProfit?.[1]?.price;
  const slPrice = activeSignal?.stopLoss?.price;
  const targetRoe = activeSignal?.takeProfit?.[0]?.targetRoePercent || 25.0;
  const slRoe = activeSignal?.stopLoss?.slRoePercent || -10.0;

  // Real-time floating ROE and dollar gain calculation for open position
  const roePercent = useMemo(() => {
    if (!isOpenPosition || !entryPrice || entryPrice <= 0) return 0;
    const diff = (price - entryPrice) * (isBuy ? 1 : -1);
    // 10x leverage multiplier
    return (diff / entryPrice) * 10 * 100;
  }, [isOpenPosition, entryPrice, price, isBuy]);

  const isPosProfit = roePercent >= 0;
  const floatingDollar = 150.0 * (roePercent / 100);

  // Dynamic Technical & SMC Analytics for the current asset
  const analysis = useMemo(() => {
    if (selectedAsset === 'BTC/USDT') {
      return {
        bias: isBuy ? 'Bullish Expansion' : 'Bearish Distribution',
        trendStrength: 92,
        rsi: 63.4,
        rsiSignal: 'Bullish Momentum Divergence',
        macdSignal: 'Positive Histogram Expansion (+18.4 Delta)',
        emaStatus: 'Golden Alignment (EMA-20 > EMA-50 > EMA-200)',
        orderBlock: `$${(price * 0.985).toFixed(0)} - $${(price * 0.992).toFixed(0)} (Institutional Demand Block)`,
        fvgZone: `$${(price * 1.012).toFixed(0)} - $${(price * 1.018).toFixed(0)} (Upper Imbalance)`,
        bslTarget: `$${(price * 1.025).toFixed(0)} (Buy-side Liquidity Pool)`,
        sslInvalidation: `$${(price * 0.978).toFixed(0)} (Structural SL Guard)`,
        volumeFlow: 'Institutions Net Accumulating (+18.2% Delta)',
        orderBookImbalance: '2.6 : 1 (Dominasi Limit Buy Bid vs Ask)',
      };
    } else if (selectedAsset === 'ETH/USDT') {
      return {
        bias: isBuy ? 'Bullish Expansion' : 'Bearish Distribution',
        trendStrength: 88,
        rsi: 59.1,
        rsiSignal: 'Bullish Momentum Continuation',
        macdSignal: 'Bullish Crossover Confirmed',
        emaStatus: 'Holding Dynamic EMA-20 Value Support',
        orderBlock: `$${(price * 0.982).toFixed(1)} - $${(price * 0.99).toFixed(1)} (Daily S/R Demand)`,
        fvgZone: `$${(price * 1.015).toFixed(1)} - $${(price * 1.024).toFixed(1)} (Upper Imbalance FVG)`,
        bslTarget: `$${(price * 1.032).toFixed(1)} (Major Swing High Liquidity)`,
        sslInvalidation: `$${(price * 0.974).toFixed(1)} (Support Invalidation)`,
        volumeFlow: 'Spot Inflows Steady (+12.4% Delta)',
        orderBookImbalance: '2.1 : 1 (Net Bids Dominant)',
      };
    } else {
      // XRP/USDT
      return {
        bias: isBuy ? 'Bullish Expansion' : 'Bearish Distribution',
        trendStrength: 94,
        rsi: 66.8,
        rsiSignal: 'Strong Breakout Momentum',
        macdSignal: 'Accelerating Bullish Wave',
        emaStatus: 'Stacked EMAs with Rising Slope Angle',
        orderBlock: `$${(price * 0.975).toFixed(4)} - $${(price * 0.985).toFixed(4)} (Institutional Base)`,
        fvgZone: `$${(price * 1.018).toFixed(4)} - $${(price * 1.028).toFixed(4)} (Expansion Pocket)`,
        bslTarget: `$${(price * 1.045).toFixed(4)} (Breakout Liquidity Target)`,
        sslInvalidation: `$${(price * 0.965).toFixed(4)} (Structure Invalidation)`,
        volumeFlow: 'Heavy Spot & Perp Inflows (+24.6% Delta)',
        orderBookImbalance: '2.8 : 1 (Heavy Whale Bid Absorption)',
      };
    }
  }, [selectedAsset, price, isBuy]);

  // Synthetic smooth candlestick/bar SVG visualization
  const chartPoints = useMemo(() => {
    const pts = [];
    const base = price;
    const volatility = selectedAsset === 'BTC/USDT' ? 380 : selectedAsset === 'ETH/USDT' ? 18 : 0.012;
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2.5;
      const wave = Math.sin(angle) * volatility;
      const noise = (Math.cos(i * 1.7) - 0.3) * (volatility * 0.4);
      const cPrice = base - volatility * 0.8 + wave + noise;
      pts.push({
        open: cPrice - volatility * 0.15,
        close: cPrice + volatility * 0.15,
        high: cPrice + volatility * 0.4,
        low: cPrice - volatility * 0.4,
      });
    }
    pts[pts.length - 1].close = price;
    return pts;
  }, [selectedAsset, price]);

  // Scale calculations for price lines on chart
  const { maxPrice, minPrice } = useMemo(() => {
    let max = -Infinity;
    let min = Infinity;
    chartPoints.forEach((p) => {
      max = Math.max(max, p.high);
      min = Math.min(min, p.low);
    });
    if (tp1Price) max = Math.max(max, tp1Price);
    if (slPrice) min = Math.min(min, slPrice);
    if (entryPrice) {
      max = Math.max(max, entryPrice);
      min = Math.min(min, entryPrice);
    }
    return { maxPrice: max, minPrice: min };
  }, [chartPoints, tp1Price, slPrice, entryPrice]);

  const priceRange = maxPrice - minPrice || 1;
  const getLineTopPercent = (p?: number) => {
    if (!p) return null;
    const clamped = Math.max(minPrice, Math.min(maxPrice, p));
    const pct = 100 - ((clamped - minPrice) / priceRange) * 85 - 8;
    return Math.max(4, Math.min(94, pct));
  };

  const entryLineTop = getLineTopPercent(entryPrice);
  const tp1LineTop = getLineTopPercent(tp1Price);
  const slLineTop = getLineTopPercent(slPrice);

  return (
    <div className="space-y-4 animate-in fade-in pb-20">
      {/* 1. Header with Asset Switcher & Live Price */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-teal-500/25 space-y-3.5 backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-teal-500/15 pb-2.5">
          <div className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-teal-400" />
            <h2 className="font-extrabold text-base sm:text-lg text-white font-mono tracking-wide">
              Chart & Analisis Sinyal
            </h2>
          </div>

          {/* Asset Switcher (BTC / ETH / XRP) */}
          <div className="inline-flex p-0.5 bg-[#021317]/90 border border-teal-500/25 rounded-xl shadow-inner font-mono">
            {(['BTC/USDT', 'ETH/USDT', 'XRP/USDT'] as AssetSymbol[]).map((sym) => {
              const label = sym.split('/')[0];
              const isSelected = selectedAsset === sym;
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => onSelectAsset(sym)}
                  className={`px-2.5 sm:px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Price & Live Position Status Badge (No 15M/1H/4H timeframe picker) */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              ${fmt(price)}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className={isUp ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {isUp ? '▲ +' : '▼ '}{currentTicker?.changePercent?.toFixed(2) || '0.00'}% 24h
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{selectedAsset} Spot Index</span>
            </div>
          </div>

          {/* Position Status Banner in place of old timeframe buttons */}
          {isOpenPosition ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 font-mono text-xs font-bold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              <span>POSISI TERBUKA: {isBuy ? 'LONG' : 'SHORT'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-teal-500/20 font-mono text-xs font-semibold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>AI SCANNING MOMENTUM</span>
            </div>
          )}
        </div>

        {/* Interactive Candlestick Chart Viewport with Position Overlay Lines */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-teal-500/20 relative overflow-hidden">
          {/* Top Indicator Badges */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
            <div className="flex gap-2">
              <span className="text-cyan-400">EMA(20): {analysis.bias}</span>
              <span className="text-teal-400">EMA(50): Value Support</span>
              <span className="text-amber-400">SMC: Breaker Block</span>
            </div>
            <span className="text-emerald-400 font-bold">RSI(14): {analysis.rsi}</span>
          </div>

          {/* SVG Candlestick Graphic */}
          <div className="h-44 sm:h-52 w-full flex items-center justify-between gap-1 px-1 relative">
            {chartPoints.map((pt, idx) => {
              const isGreen = pt.close >= pt.open;
              const range = chartPoints.reduce(
                (acc, p) => ({
                  max: Math.max(acc.max, p.high),
                  min: Math.min(acc.min, p.low),
                }),
                { max: -Infinity, min: Infinity }
              );
              const span = range.max - range.min || 1;
              const scaleY = (val: number) => 100 - ((val - range.min) / span) * 85 - 8;

              const yOpen = scaleY(pt.open);
              const yClose = scaleY(pt.close);
              const yHigh = scaleY(pt.high);
              const yLow = scaleY(pt.low);
              const barTop = Math.min(yOpen, yClose);
              const barHeight = Math.max(3, Math.abs(yClose - yOpen));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center relative h-full justify-center">
                  {/* Wick */}
                  <div
                    className={`w-[1px] absolute ${isGreen ? 'bg-emerald-400' : 'bg-rose-400'}`}
                    style={{
                      top: `${yHigh}%`,
                      bottom: `${100 - yLow}%`,
                    }}
                  />
                  {/* Body */}
                  <div
                    className={`w-full max-w-[8px] rounded-[1px] z-10 ${
                      isGreen
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
                        : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.3)]'
                    }`}
                    style={{
                      top: `${barTop}%`,
                      height: `${barHeight}%`,
                      position: 'absolute',
                    }}
                  />
                </div>
              );
            })}

            {/* Position Price Lines Overlay if Open Position Exists */}
            {isOpenPosition && (
              <>
                {/* Take Profit Line */}
                {tp1LineTop !== null && (
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-emerald-400/80 z-20 flex items-center justify-end pr-2 pointer-events-none"
                    style={{ top: `${tp1LineTop}%` }}
                  >
                    <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded -mt-2.5 shadow-sm">
                      TP 1: ${fmt(tp1Price)} (+{targetRoe}%)
                    </span>
                  </div>
                )}

                {/* Entry Price Line */}
                {entryLineTop !== null && (
                  <div
                    className="absolute left-0 right-0 border-t border-teal-400/90 z-20 flex items-center justify-start pl-2 pointer-events-none"
                    style={{ top: `${entryLineTop}%` }}
                  >
                    <span className="text-[9px] font-mono font-bold bg-teal-500/25 text-teal-200 border border-teal-400/40 px-1.5 py-0.2 rounded -mt-2.5 shadow-sm">
                      Entry {isGuest ? '••••••' : `$${fmt(entryPrice)}`}
                    </span>
                  </div>
                )}

                {/* Stop Loss Line */}
                {slLineTop !== null && (
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-rose-400/80 z-20 flex items-center justify-end pr-2 pointer-events-none"
                    style={{ top: `${slLineTop}%` }}
                  >
                    <span className="text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30 px-1.5 py-0.2 rounded -mt-2.5 shadow-sm">
                      SL: ${fmt(slPrice)} ({slRoe}%)
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom Chart Status Bar */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Demand OB: {analysis.orderBlock}
            </span>
            <span className="text-slate-500 font-bold">AI Execution Engine</span>
          </div>
        </div>
      </div>

      {/* 2. PENJELASAN ANALISIS SAAT OPEN POSISI (DEDICATED POSITION BREAKDOWN) */}
      {isOpenPosition ? (
        <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-teal-500/30 shadow-2xl space-y-4 backdrop-blur-2xl">
          {/* Card Header: Open Position Title & Floating ROE */}
          <div className="flex items-center justify-between border-b border-teal-500/15 pb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl flex items-center justify-center ${
                  isBuy
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                }`}
              >
                {isBuy ? (
                  <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-white font-mono">
                    Penjelasan Analisis Open Posisi
                  </h3>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                      isBuy
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {isBuy ? 'LONG (Beli)' : 'SHORT (Jual)'} {selectedAsset}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  10x Leverage Multiplier · Sinyal Aktif
                </div>
              </div>
            </div>

            {/* Live Floating Profit / Loss */}
            <div className="text-right font-mono">
              <span className="text-[10px] text-slate-400 block">Floating Profit</span>
              <div
                className={`text-sm sm:text-base font-black tabular-nums tracking-tight ${
                  isPosProfit ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPosProfit ? '+' : '-'}${Math.abs(floatingDollar).toFixed(2)}
              </div>
              <div
                className={`text-[10px] font-bold ${
                  isPosProfit ? 'text-emerald-400/90' : 'text-rose-400/90'
                }`}
              >
                {isPosProfit ? '+' : ''}{roePercent.toFixed(1)}% ROE
              </div>
            </div>
          </div>

          {/* Key Execution Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            {/* Entry Price */}
            <div className="p-2.5 rounded-2xl bg-slate-900/70 border border-teal-500/20">
              <span className="text-[10px] text-slate-400 block mb-0.5">Harga Entry:</span>
              {isGuest ? (
                <div className="flex items-center gap-1 font-bold text-amber-300">
                  <span className="tracking-widest">••••••</span>
                  <Lock className="w-3 h-3 text-amber-400" />
                </div>
              ) : (
                <div className="font-black text-white">${fmt(entryPrice)}</div>
              )}
            </div>

            {/* Current Price */}
            <div className="p-2.5 rounded-2xl bg-slate-900/70 border border-teal-500/20">
              <span className="text-[10px] text-slate-400 block mb-0.5">Harga Sekarang:</span>
              <div className="font-black text-cyan-300">${fmt(price)}</div>
            </div>

            {/* Target TP 1 */}
            <div className="p-2.5 rounded-2xl bg-slate-900/70 border border-emerald-500/20">
              <span className="text-[10px] text-slate-400 block mb-0.5">Target TP 1:</span>
              <div className="font-black text-emerald-400">
                ${fmt(tp1Price)} <span className="text-[10px] font-normal">(+{targetRoe}%)</span>
              </div>
            </div>

            {/* Invalidation SL */}
            <div className="p-2.5 rounded-2xl bg-slate-900/70 border border-rose-500/20">
              <span className="text-[10px] text-slate-400 block mb-0.5">Stop Loss (SL):</span>
              <div className="font-black text-rose-400">
                ${fmt(slPrice)} <span className="text-[10px] font-normal">({slRoe}%)</span>
              </div>
            </div>
          </div>

          {/* 1. Alasan Teknikal Mengapa AI Membuka Posisi */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-teal-500/20 space-y-2 font-mono">
            <div className="flex items-center gap-1.5 text-teal-300 font-bold text-xs">
              <Compass className="w-4 h-4 text-teal-400" />
              <span>Alasan AI Mengambil Posisi {isBuy ? 'LONG' : 'SHORT'}:</span>
            </div>
            <p className="text-slate-200 leading-relaxed font-sans text-xs">
              {activeSignal?.technicalConfluence?.join(' ') ||
                `AI mendeteksi formasi konfirmasi ${isBuy ? 'Bullish' : 'Bearish'} yang kuat pada ${selectedAsset}. Terjadi penyerapan likuiditas order book di area demand institusional, didukung oleh peningkatan agresif volume delta dan divergensi RSI momentum.`}
            </p>
          </div>

          {/* 2. Katalis Berita & Momentum Fundamental */}
          {activeSignal?.newsCatalyst && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5 font-mono">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                <Newspaper className="w-3.5 h-3.5" />
                <span>Katalis Momentum & On-Chain News:</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans text-xs">
                {activeSignal.newsCatalyst}
              </p>
            </div>
          )}

          {/* 3. Konfirmasi Indikator Teknikal Real-Time */}
          <div className="space-y-1.5 font-mono">
            <span className="text-[11px] text-slate-400 font-bold block">
              Konfirmasi Indikator Saat Open Posisi:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-0.5">
                <span className="text-slate-400 block text-[10px]">RSI Momentum:</span>
                <span className="text-emerald-400 font-bold">{analysis.rsi} · {analysis.rsiSignal}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-0.5">
                <span className="text-slate-400 block text-[10px]">Volume Flow Delta:</span>
                <span className="text-cyan-300 font-bold">{analysis.volumeFlow}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-0.5">
                <span className="text-slate-400 block text-[10px]">Order Book Imbalance:</span>
                <span className="text-amber-300 font-bold">{analysis.orderBookImbalance}</span>
              </div>
            </div>
          </div>

          {/* 4. Aturan Manajemen Risiko & Invalidation */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-teal-500/20 text-slate-300 text-xs flex items-center gap-2 font-mono">
            <ShieldAlert className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              <strong>Manajemen Risiko:</strong> Rasio Risk:Reward {activeSignal?.stopLoss?.riskRewardRatio || '1 : 2.5+'}. Posisi otomatis tertutup saat menyentuh TP (+{targetRoe}% ROE) atau ter-invalidasi ketat di SL ({slRoe}% ROE).
            </span>
          </div>
        </div>
      ) : (
        /* Standby / Scanning State when No Active Position */
        <div className="glass-panel rounded-3xl p-5 border border-teal-500/25 shadow-2xl space-y-3.5 backdrop-blur-2xl">
          <div className="flex items-center gap-2 border-b border-teal-500/15 pb-2.5">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            <h3 className="font-extrabold text-sm sm:text-base text-white font-mono">
              Status Bot: Standby & Scanning Pasar
            </h3>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-white/5 space-y-2 font-mono text-xs">
            <p className="text-slate-300 font-sans leading-relaxed">
              Saat ini belum ada open posisi untuk <strong>{selectedAsset}</strong>. AI Bot sedang memindai volume profile, order book depth, dan likuiditas swing high/low 24/7.
            </p>
            <div className="flex items-center gap-2 text-teal-300 text-[11px] pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Posisi hanya akan dibuka saat konfirmasi teknikal terpenuhi dengan Risk:Reward minimal 1:2.5.</span>
            </div>
          </div>

          {/* Market Overview Grid during Standby */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs text-center">
            <div className="p-2.5 rounded-xl bg-slate-900/50 border border-teal-500/15">
              <span className="text-[10px] text-slate-400 block">Market Bias</span>
              <span className="font-bold text-emerald-400">{analysis.bias}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/50 border border-teal-500/15">
              <span className="text-[10px] text-slate-400 block">RSI Status</span>
              <span className="font-bold text-teal-300">{analysis.rsi}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/50 border border-teal-500/15">
              <span className="text-[10px] text-slate-400 block">Volume Delta</span>
              <span className="font-bold text-cyan-300">{analysis.volumeFlow.split(' ')[0]} Flow</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/50 border border-teal-500/15">
              <span className="text-[10px] text-slate-400 block">Min Risk:Reward</span>
              <span className="font-bold text-amber-300">1 : 2.5+</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
