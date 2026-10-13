import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Candle, SignalData } from '../types';

interface ModernCandleChartProps {
  candles: Candle[];
  symbol: string;
  signal: SignalData | null;
  currentPrice: number;
}

export const ModernCandleChart: React.FC<ModernCandleChartProps> = ({
  candles,
  symbol,
  signal,
  currentPrice,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const isXrp = symbol.includes('XRP');
  const isEth = symbol.includes('ETH');
  const step = isXrp ? 0.001 : isEth ? 1.8 : 16.0;
  const defaultBasePrice = isXrp ? 1.3820 : isEth ? 2540.0 : 83010.0;

  const entryPrice = signal ? (signal.entryPrice || (signal.entryRange.min + signal.entryRange.max) / 2) : currentPrice;
  const tpPrice = signal?.takeProfit?.[0]?.price;
  const slPrice = signal?.stopLoss?.price;
  const isBuy = signal?.signal.includes('BUY') ?? true;

  // Rolling tick stream (36 points buffer)
  const [liveTicks, setLiveTicks] = useState<number[]>(() => {
    const baseP = currentPrice || defaultBasePrice;

    const initial: number[] = [];
    for (let i = 35; i >= 0; i--) {
      const wave = Math.sin(i * 0.44) * step;
      const noise = (Math.cos(i * 1.2) - 0.5) * (step * 0.4);
      initial.push(Math.round((baseP - wave + noise) * 10000) / 10000);
    }
    initial[initial.length - 1] = baseP;
    return initial;
  });

  const lastSymbolRef = useRef<string>(symbol);

  // Reseed buffer when asset switches (BTC <-> ETH <-> XRP)
  useEffect(() => {
    if (lastSymbolRef.current !== symbol) {
      lastSymbolRef.current = symbol;
      const baseP = currentPrice || defaultBasePrice;

      const seeded: number[] = [];
      for (let i = 35; i >= 0; i--) {
        const wave = Math.sin(i * 0.44) * step;
        const noise = (Math.cos(i * 1.2) - 0.5) * (step * 0.4);
        seeded.push(Math.round((baseP - wave + noise) * 10000) / 10000);
      }
      seeded[seeded.length - 1] = baseP;
      setLiveTicks(seeded);
    }
  }, [symbol, currentPrice, step, defaultBasePrice]);

  // ON EVERY TICK: Append new price & roll wave forward to the left!
  useEffect(() => {
    if (!currentPrice) return;

    setLiveTicks((prev) => {
      const next = [...prev];
      if (next.length >= 36) {
        next.shift();
      }
      next.push(currentPrice);
      return next;
    });
  }, [currentPrice]);

  // =========================================================================
  // DYNAMIC ADAPTIVE VIEWPORT (OPSI A):
  // Kamera fokus pada harga aktif saat ini sehingga naik-turunnya kelihatan nyata.
  // Saat harga mendekati TP, SL otomatis keluar/hilang di bawah, dan sebaliknya!
  // =========================================================================
  const { minVal, maxVal } = useMemo(() => {
    // Focused vertical window span
    const windowSpan = isXrp ? 0.024 : isEth ? 35.0 : 160.0;

    // Center camera dynamically between current price and entry price
    const anchorY = currentPrice * 0.75 + entryPrice * 0.25;

    let min = anchorY - windowSpan * 0.5;
    let max = anchorY + windowSpan * 0.5;

    // If current price gets very close to TP, tilt camera up so TP stays inside comfortably
    if (tpPrice) {
      if (isBuy && currentPrice > tpPrice - windowSpan * 0.25) {
        max = Math.max(max, tpPrice + windowSpan * 0.15);
        min = max - windowSpan;
      } else if (!isBuy && currentPrice < tpPrice + windowSpan * 0.25) {
        min = Math.min(min, tpPrice - windowSpan * 0.15);
        max = min + windowSpan;
      }
    }

    // If current price gets very close to SL, tilt camera down so SL stays inside comfortably
    if (slPrice) {
      if (isBuy && currentPrice < slPrice + windowSpan * 0.25) {
        min = Math.min(min, slPrice - windowSpan * 0.15);
        max = min + windowSpan;
      } else if (!isBuy && currentPrice > slPrice - windowSpan * 0.25) {
        max = Math.max(max, slPrice + windowSpan * 0.15);
        min = max - windowSpan;
      }
    }

    return { minVal: min, maxVal: max };
  }, [currentPrice, entryPrice, tpPrice, slPrice, isXrp, isEth, isBuy]);

  // SVG Geometry Dimensions
  const svgWidth = 500;
  const svgHeight = 220;
  const plotLeft = 14;
  const plotRight = 410; // Dedicated right gutter for un-squeezed HTML badges
  const plotWidth = plotRight - plotLeft;

  // Convert price to SVG Y coordinate (in pixels 0 to 220)
  const getY = (val: number) => {
    const pct = (maxVal - val) / (maxVal - minVal || 1);
    return pct * svgHeight;
  };

  // Convert price to percentage from top (0% to 100%) for HTML badges
  const getPctTop = (val: number) => {
    const pct = (maxVal - val) / (maxVal - minVal || 1);
    return pct * 100;
  };

  // Convert index to X coordinate
  const getX = (idx: number, total: number) => {
    if (total <= 1) return plotLeft + plotWidth / 2;
    return plotLeft + (idx / (total - 1)) * plotWidth;
  };

  // Compute smooth cubic bezier SVG curve across rolling live ticks
  const { linePath, areaPath, pointsCoords } = useMemo(() => {
    const count = liveTicks.length;
    const coords = liveTicks.map((val, idx) => ({
      x: getX(idx, count),
      y: getY(val),
      price: val,
    }));

    if (coords.length < 2) return { linePath: '', areaPath: '', pointsCoords: coords };

    let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[Math.max(0, i - 1)];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[Math.min(coords.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    const lastX = coords[coords.length - 1].x;
    const firstX = coords[0].x;
    const bottomY = svgHeight + 20;
    const area = `${d} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;

    return { linePath: d, areaPath: area, pointsCoords: coords };
  }, [liveTicks, minVal, maxVal]);

  const lastCoord = pointsCoords[pointsCoords.length - 1];
  const activeCoord = hoverIndex !== null && pointsCoords[hoverIndex] ? pointsCoords[hoverIndex] : lastCoord;

  // Pixel Y positions for SVG lines
  const entryY = entryPrice ? getY(entryPrice) : null;
  const tpY = tpPrice ? getY(tpPrice) : null;
  const slY = slPrice ? getY(slPrice) : null;
  const currentY = currentPrice ? getY(currentPrice) : (lastCoord?.y ?? null);

  // Percentage positions for HTML badges (determines visibility & dynamic movement)
  const entryPct = entryPrice ? getPctTop(entryPrice) : null;
  const tpPct = tpPrice ? getPctTop(tpPrice) : null;
  const slPct = slPrice ? getPctTop(slPrice) : null;
  const currentPct = currentPrice ? getPctTop(currentPrice) : null;

  // Visibility checks: Line/badge disappears when outside viewport boundaries (-5% to 105%)
  const isTpVisible = tpPct !== null && tpPct >= -8 && tpPct <= 108;
  const isSlVisible = slPct !== null && slPct >= -8 && slPct <= 108;
  const isEntryVisible = entryPct !== null && entryPct >= -8 && entryPct <= 108;

  return (
    <div className="glass-panel rounded-3xl p-3 sm:p-3.5 border border-teal-500/20 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
      {/* Top Header: Symbol & Active Live Price */}
      <div className="flex items-center justify-between pb-1.5 border-b border-teal-500/10 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          <span className="font-bold text-white tracking-wide">{symbol}</span>
          <span className="text-teal-400/50">·</span>
          <span className="text-teal-300 font-semibold text-[11px]">Dynamic Wave</span>
        </div>

        {activeCoord && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-mono">Real-Time:</span>
            <span className="text-[11px] font-black text-teal-300 font-mono tabular-nums">
              ${activeCoord.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {/* Main Relative Container for SVG Curves and HTML Badges */}
      <div className="relative w-full h-[220px] select-none my-0.5 overflow-hidden rounded-2xl bg-[#021116]/40">
        {/* SVG Drawing Canvas for Smooth Spline Wave & Lines */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-hidden"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoverIndex(null)}
          onTouchEnd={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="waveGlowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.32" />
              <stop offset="65%" stopColor="#14b8a6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="splineLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="60%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>

            <filter id="pulsePointFilter" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background subtle horizontal grid guide */}
          <line x1={plotLeft} y1="55" x2={plotRight} y2="55" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
          <line x1={plotLeft} y1="110" x2={plotRight} y2="110" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
          <line x1={plotLeft} y1="165" x2={plotRight} y2="165" stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />

          {/* 1. GARIS TAKE PROFIT (HIJAU DASHED) - Bergerak dinamis mengikuti kamera */}
          {tpY !== null && isTpVisible && (
            <line
              x1={plotLeft}
              y1={tpY}
              x2={plotRight}
              y2={tpY}
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="5 3"
              opacity="0.9"
              className="transition-all duration-300"
            />
          )}

          {/* 2. GARIS OPEN POSISI (KUNING DASHED) - Bergerak dinamis mengikuti kamera */}
          {entryY !== null && isEntryVisible && (
            <line
              x1={plotLeft}
              y1={entryY}
              x2={plotRight}
              y2={entryY}
              stroke="#facc15"
              strokeWidth="2"
              strokeDasharray="6 3"
              opacity="0.95"
              className="transition-all duration-300"
            />
          )}

          {/* 3. GARIS STOP LOSS (MERAH DASHED) - Bergerak dinamis mengikuti kamera */}
          {slY !== null && isSlVisible && (
            <line
              x1={plotLeft}
              y1={slY}
              x2={plotRight}
              y2={slY}
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="5 3"
              opacity="0.9"
              className="transition-all duration-300"
            />
          )}

          {/* Smooth Rolling Wave Gradient Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#waveGlowGrad)" />}

          {/* Glowing Continuous Spline Wave Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#splineLineGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Pulsing Live Dot at Wave Head */}
          {lastCoord && (
            <g>
              <circle
                cx={lastCoord.x}
                cy={lastCoord.y}
                r="7"
                fill="#2dd4bf"
                opacity="0.45"
                className="animate-ping"
              />
              <circle
                cx={lastCoord.x}
                cy={lastCoord.y}
                r="4.5"
                fill="#ffffff"
                stroke="#0d9488"
                strokeWidth="2"
                filter="url(#pulsePointFilter)"
              />
            </g>
          )}

          {/* Interactive touch/hover sensor columns */}
          {pointsCoords.map((pt, i) => (
            <rect
              key={i}
              x={pt.x - 7}
              y={0}
              width={14}
              height={svgHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onTouchStart={() => setHoverIndex(i)}
            />
          ))}
        </svg>

        {/* ========================================================================= */}
        {/* CRISP HTML BADGES (TIDAK AKAN PERNAH GEPENG!)                            */}
        {/* Diposisikan secara absolut dengan CSS murni di sisi kanan canvas          */}
        {/* ========================================================================= */}

        {/* 1. BADGE TAKE PROFIT (HIJAU CRISP) */}
        {tpPct !== null && isTpVisible && (
          <div
            style={{ top: `${tpPct}%` }}
            className="absolute right-1.5 -translate-y-1/2 z-20 pointer-events-none transition-all duration-300"
          >
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#02281e]/95 border border-emerald-400 text-emerald-300 text-[10px] font-mono font-bold shadow-md shadow-emerald-950/60 whitespace-nowrap">
              <span>TP</span>
              <span className="tabular-nums">
                ${tpPrice?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
            </div>
          </div>
        )}

        {/* 2. BADGE OPEN POSISI (KUNING CRISP) */}
        {entryPct !== null && isEntryVisible && (
          <div
            style={{ top: `${entryPct}%` }}
            className="absolute right-1.5 -translate-y-1/2 z-20 pointer-events-none transition-all duration-300"
          >
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#251e02]/95 border border-yellow-400 text-yellow-300 text-[10px] font-mono font-bold shadow-md shadow-yellow-950/60 whitespace-nowrap">
              <span>OPEN</span>
              <span className="tabular-nums">
                ${entryPrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
            </div>
          </div>
        )}

        {/* 3. BADGE STOP LOSS (MERAH CRISP) */}
        {slPct !== null && isSlVisible && (
          <div
            style={{ top: `${slPct}%` }}
            className="absolute right-1.5 -translate-y-1/2 z-20 pointer-events-none transition-all duration-300"
          >
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2a060a]/95 border border-rose-400 text-rose-300 text-[10px] font-mono font-bold shadow-md shadow-rose-950/60 whitespace-nowrap">
              <span>SL</span>
              <span className="tabular-nums">
                ${slPrice?.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
            </div>
          </div>
        )}

        {/* 4. BADGE HARGA REAL-TIME (CYAN GLOWING TAG) */}
        {currentPct !== null && (
          <div
            style={{ top: `${currentPct}%` }}
            className="absolute right-1.5 -translate-y-1/2 z-10 pointer-events-none transition-all duration-150"
          >
            <div className="hidden sm:flex items-center px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-200 border border-teal-400/40 text-[9px] font-mono font-bold tabular-nums">
              ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </div>
          </div>
        )}
      </div>

      {/* Clean Bottom Signal Legend (Kuning: Open, Hijau: TP, Merah: SL) */}
      <div className="pt-1.5 border-t border-teal-500/10 flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Kuning: Open Posisi */}
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>OPEN ({isBuy ? 'BUY' : 'SELL'}): ${entryPrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
          </span>

          {/* Hijau: Take Profit */}
          {tpPrice && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>TP: ${tpPrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
            </span>
          )}

          {/* Merah: Stop Loss */}
          {slPrice && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>SL: ${slPrice.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
            </span>
          )}
        </div>

        <span className="text-[10px] text-teal-400/80 font-semibold">
          Gelombang Adaptif
        </span>
      </div>
    </div>
  );
};
