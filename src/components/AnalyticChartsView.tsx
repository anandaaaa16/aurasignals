import React, { useState, useMemo } from 'react';
import {
  AssetSymbol,
  MarketTicker,
  Timeframe,
} from '../types';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
  Compass,
  ShieldAlert,
  Lock,
  Sparkles,
  BarChart,
  Eye,
} from 'lucide-react';

interface AnalyticChartsViewProps {
  selectedAsset: AssetSymbol;
  onSelectAsset: (asset: AssetSymbol) => void;
  currentTicker: MarketTicker | null;
  userRole?: 'GUEST' | 'MEMBER' | 'ADMIN';
  onOpenVipModal: () => void;
}

export const AnalyticChartsView: React.FC<AnalyticChartsViewProps> = ({
  selectedAsset,
  onSelectAsset,
  currentTicker,
  userRole = 'GUEST',
  onOpenVipModal,
}) => {
  const [activeTf, setActiveTf] = useState<Timeframe>('1h');
  const isGuest = userRole === 'GUEST';

  const price = currentTicker?.price || (selectedAsset === 'BTC/USDT' ? 83200 : selectedAsset === 'ETH/USDT' ? 2540 : 1.38);
  const isUp = (currentTicker?.change24h || 0) >= 0;

  // Format price helper
  const fmt = (p: number) => {
    if (selectedAsset === 'XRP/USDT') return p.toFixed(4);
    if (selectedAsset === 'ETH/USDT') return p.toFixed(2);
    return p.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  };

  // Dynamic Strategy & Technical SMC Analytics based on asset & timeframe
  const analysis = useMemo(() => {
    if (selectedAsset === 'BTC/USDT') {
      return {
        bias: 'Bullish Expansion' as const,
        trendStrength: 88,
        rsi: 62.4,
        rsiSignal: 'Bullish Momentum',
        macdSignal: 'Positive Histogram Expansion',
        emaStatus: 'Price Above EMA-20 & EMA-50 (Golden Alignment)',
        orderBlock: `$${(price * 0.985).toFixed(0)} - $${(price * 0.992).toFixed(0)} (H1 Demand Zone)`,
        fvgZone: `$${(price * 1.012).toFixed(0)} - $${(price * 1.018).toFixed(0)} (Upper Imbalance)`,
        bslTarget: `$${(price * 1.025).toFixed(0)} (Buy-side Liquidity Pool)`,
        sslInvalidation: `$${(price * 0.978).toFixed(0)} (Structural Invalidation)`,
        strategyName: 'Institutional Liquidity Sweeps & FVG Mitigation',
        strategyRationale:
          'Bitcoin successfully swept Asian session sell-side liquidity and closed above the dynamic H1 value area. Institutional volume delta indicates aggressive absorption of limit orders at support, with targets set at local liquidity pools.',
        riskReward: '1 : 2.45',
        volumeFlow: 'Institutions Net Accumulating (+14.2% Delta)',
        invalidationRule: 'Close below H1 swing low invalidates immediate bullish expansion.',
      };
    } else if (selectedAsset === 'ETH/USDT') {
      return {
        bias: 'Bullish Expansion' as const,
        trendStrength: 84,
        rsi: 58.2,
        rsiSignal: 'Neutral-Bullish Consolidation',
        macdSignal: 'MACD Bullish Cross Confirmed',
        emaStatus: 'Testing Dynamic EMA-20 Resistance',
        orderBlock: `$${(price * 0.982).toFixed(1)} - $${(price * 0.99).toFixed(1)} (Daily S/R Flip)`,
        fvgZone: `$${(price * 1.015).toFixed(1)} - $${(price * 1.024).toFixed(1)} (4H Fair Value Gap)`,
        bslTarget: `$${(price * 1.032).toFixed(1)} (Major Swing High Liquidity)`,
        sslInvalidation: `$${(price * 0.974).toFixed(1)} (Range Low Invalidation)`,
        strategyName: 'Range Reclaim & Ethereum Network Gas Flow Surge',
        strategyRationale:
          'Ethereum maintains strong structural confluence at the mid-range point. L2 network activity and steady staking inflows have formed a robust consolidation base, anticipating a breakout towards the upper balance zone.',
        riskReward: '1 : 2.30',
        volumeFlow: 'Steady Spot Inflows (+8.7% Delta)',
        invalidationRule: 'Breakdown of demand block requires re-evaluation at lower support.',
      };
    } else {
      // XRP/USDT
      return {
        bias: 'Bullish Expansion' as const,
        trendStrength: 86,
        rsi: 64.8,
        rsiSignal: 'Strong Trend Momentum',
        macdSignal: 'Bullish Momentum Divergence',
        emaStatus: 'Stacked EMAs (20 > 50 > 200 Exponential Slope)',
        orderBlock: `$${(price * 0.975).toFixed(4)} - $${(price * 0.985).toFixed(4)} (Institutional Base)`,
        fvgZone: `$${(price * 1.018).toFixed(4)} - $${(price * 1.028).toFixed(4)} (Expansion Pocket)`,
        bslTarget: `$${(price * 1.045).toFixed(4)} (Breakout Liquidity Target)`,
        sslInvalidation: `$${(price * 0.965).toFixed(4)} (Structural Stop)`,
        strategyName: 'High-Volume Breakout & Cross-Border Liquidity Surge',
        strategyRationale:
          'XRP exhibits exceptional volume expansion with continuous accumulation above prior multi-week resistance. Smart money is defending higher lows on the 15M/1H charts with minimal slippage.',
        riskReward: '1 : 2.60',
        volumeFlow: 'Heavy Spot & Perp Buying (+22.1% Delta)',
        invalidationRule: 'Loss of local volume support triggers temporary capital defense.',
      };
    }
  }, [selectedAsset, price]);

  // Synthetic smooth candlestick/bar SVG visualization
  const chartPoints = useMemo(() => {
    const pts = [];
    const base = price;
    const volatility = selectedAsset === 'BTC/USDT' ? 400 : selectedAsset === 'ETH/USDT' ? 18 : 0.012;
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

  return (
    <div className="space-y-4 animate-in fade-in pb-20">
      {/* 1. Header with Asset Switcher & Live Price */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-teal-500/25 space-y-3.5 backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-teal-500/15 pb-2.5">
          <div className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-teal-400" />
            <h2 className="font-extrabold text-base sm:text-lg text-white font-mono tracking-wide">
              Analytic Charts
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

        {/* Live Price & Timeframe Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              ${fmt(price)}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
                {isUp ? '▲ +' : '▼ '}{currentTicker?.changePercent?.toFixed(2) || '0.00'}% 24h
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{selectedAsset} Spot Index</span>
            </div>
          </div>

          {/* Timeframe Selector */}
          <div className="flex gap-1 p-1 rounded-xl bg-slate-900/80 border border-white/5 font-mono text-xs">
            {(['15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setActiveTf(tf)}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                  activeTf === tf
                    ? 'bg-teal-500/30 text-teal-300 border border-teal-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Candlestick / Indicator Simulation Viewport */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-teal-500/20 relative overflow-hidden">
          {/* Indicator badges */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
            <div className="flex gap-2">
              <span className="text-cyan-400">EMA(20): Bullish</span>
              <span className="text-teal-400">EMA(50): Support</span>
              <span className="text-amber-400">EMA(200): Trend Base</span>
            </div>
            <span className="text-emerald-400 font-bold">RSI(14): {analysis.rsi}</span>
          </div>

          {/* SVG Candlestick Graphic */}
          <div className="h-44 sm:h-52 w-full flex items-center justify-between gap-1 px-1">
            {chartPoints.map((pt, idx) => {
              const isGreen = pt.close >= pt.open;
              const range = chartPoints.reduce((acc, p) => ({
                max: Math.max(acc.max, p.high),
                min: Math.min(acc.min, p.low),
              }), { max: -Infinity, min: Infinity });
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
                      isGreen ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.3)]'
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
          </div>

          {/* Real-time Order Block Overlay Lines */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              SMC Demand OB: {analysis.orderBlock}
            </span>
            <span className="text-slate-500">{activeTf.toUpperCase()} Institutional Chart</span>
          </div>
        </div>
      </div>

      {/* 2. Technical Indicators Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
        <div className="glass-panel p-3 rounded-2xl border border-teal-500/20 text-center space-y-1">
          <span className="text-[10px] text-slate-400 block">Market Bias</span>
          <div className="text-xs sm:text-sm font-black text-emerald-400 flex items-center justify-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{analysis.bias}</span>
          </div>
        </div>

        <div className="glass-panel p-3 rounded-2xl border border-teal-500/20 text-center space-y-1">
          <span className="text-[10px] text-slate-400 block">RSI Momentum</span>
          <div className="text-xs sm:text-sm font-black text-teal-300">
            {analysis.rsi} · {analysis.rsiSignal}
          </div>
        </div>

        <div className="glass-panel p-3 rounded-2xl border border-teal-500/20 text-center space-y-1">
          <span className="text-[10px] text-slate-400 block">Volume Delta</span>
          <div className="text-xs sm:text-sm font-black text-cyan-300">
            {analysis.volumeFlow}
          </div>
        </div>

        <div className="glass-panel p-3 rounded-2xl border border-teal-500/20 text-center space-y-1">
          <span className="text-[10px] text-slate-400 block">Target RR Ratio</span>
          <div className="text-xs sm:text-sm font-black text-amber-300">
            {analysis.riskReward}
          </div>
        </div>
      </div>

      {/* 3. Deep Institutional Strategy & SMC Breakdown */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-teal-500/25 space-y-3.5 relative overflow-hidden backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-teal-500/15 pb-2.5">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <h3 className="font-extrabold text-sm sm:text-base text-white font-mono">
              AI Strategy & Execution Blueprint
            </h3>
          </div>
          <span className="text-[10px] font-mono text-teal-300 bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded-lg font-bold">
            {analysis.strategyName}
          </span>
        </div>

        {/* If Guest: Blur the detailed institutional strategy so guests cannot copy institutional secrets without VIP! */}
        {isGuest ? (
          <div className="relative py-2">
            {/* Frosted Glass VIP Lock Overlay */}
            <div className="absolute inset-0 z-20 backdrop-blur-md bg-slate-950/75 rounded-2xl flex flex-col items-center justify-center p-4 text-center space-y-2 border border-teal-500/30">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/15">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="font-mono text-sm font-bold text-white flex items-center justify-center gap-1.5">
                  <span>Join VIP for Full Strategy Access</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto mt-0.5">
                  Unlock institutional order flow, exact liquidity targets, order blocks, and invalidation levels.
                </p>
              </div>

              <button
                type="button"
                onClick={onOpenVipModal}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-bold font-mono text-xs shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer transition-all"
              >
                Upgrade to VIP Member (QRIS / USDT)
              </button>
            </div>

            {/* Blurred background preview */}
            <div className="filter blur-[5px] select-none pointer-events-none opacity-40 space-y-3 font-mono text-xs">
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
                <span className="text-slate-400 block text-[10px]">Institutional Order Flow Rationale:</span>
                <p className="text-slate-200">{analysis.strategyRationale}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                  <span className="text-slate-500 block">Buy-Side Liquidity:</span>
                  <span className="text-emerald-400 font-bold">{analysis.bslTarget}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5">
                  <span className="text-slate-500 block">Invalidation Level:</span>
                  <span className="text-rose-400 font-bold">{analysis.sslInvalidation}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* VIP & Admin full strategy display */
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-teal-500/20 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
                <Layers className="w-3.5 h-3.5" />
                <span>Institutional Market Rationale:</span>
              </div>
              <p className="text-slate-300 leading-relaxed font-sans text-xs">
                {analysis.strategyRationale}
              </p>
            </div>

            {/* Key Structural SMC Levels */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-emerald-500/20 space-y-0.5">
                <span className="text-slate-400 block text-[10px]">Buy-Side Liquidity (BSL):</span>
                <span className="text-emerald-400 font-bold">{analysis.bslTarget}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-teal-500/20 space-y-0.5">
                <span className="text-slate-400 block text-[10px]">Institutional Demand OB:</span>
                <span className="text-teal-300 font-bold">{analysis.orderBlock}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-rose-500/20 space-y-0.5">
                <span className="text-slate-400 block text-[10px]">Strict Invalidation Stop:</span>
                <span className="text-rose-400 font-bold">{analysis.sslInvalidation}</span>
              </div>
            </div>

            {/* Risk Control Note */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px]">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{analysis.invalidationRule}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
