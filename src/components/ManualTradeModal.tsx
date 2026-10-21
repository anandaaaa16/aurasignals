import React, { useState, useEffect } from 'react';
import { AssetSymbol, SignalData } from '../types';
import { X, TrendingUp, TrendingDown, Zap, Shield, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

interface ManualTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrices: { btc: number; eth: number; xrp: number };
  activeSignals: Record<AssetSymbol, SignalData | null>;
  onOpenTrade: (signal: SignalData) => void;
}

export const ManualTradeModal: React.FC<ManualTradeModalProps> = ({
  isOpen,
  onClose,
  currentPrices,
  activeSignals,
  onOpenTrade,
}) => {
  const [asset, setAsset] = useState<AssetSymbol>('BTC/USDT');
  const [direction, setDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [marginUsdt, setMarginUsdt] = useState<number>(150);
  const leverage = 10;

  const currentPrice =
    asset === 'BTC/USDT'
      ? currentPrices.btc
      : asset === 'ETH/USDT'
      ? currentPrices.eth
      : currentPrices.xrp;

  const decimals = asset === 'XRP/USDT' ? 4 : 2;

  const [entryPrice, setEntryPrice] = useState<string>('');
  const [tpPrice, setTpPrice] = useState<string>('');
  const [slPrice, setSlPrice] = useState<string>('');
  const [targetRoe, setTargetRoe] = useState<number>(25.0); // +25% ROE
  const [slRoe, setSlRoe] = useState<number>(10.0); // -10% ROE

  // Recalculate default TP and SL whenever asset, direction, or entry changes
  const calculateLevels = (basePrice: number, dir: 'BUY' | 'SELL', roeTp: number, roeSl: number) => {
    if (!basePrice) return;
    const priceMoveTp = (roeTp / leverage) / 100;
    const priceMoveSl = (roeSl / leverage) / 100;

    const calculatedTp = dir === 'BUY' ? basePrice * (1 + priceMoveTp) : basePrice * (1 - priceMoveTp);
    const calculatedSl = dir === 'BUY' ? basePrice * (1 - priceMoveSl) : basePrice * (1 + priceMoveSl);

    setEntryPrice(basePrice.toFixed(decimals));
    setTpPrice(calculatedTp.toFixed(decimals));
    setSlPrice(calculatedSl.toFixed(decimals));
  };

  useEffect(() => {
    if (isOpen && currentPrice > 0) {
      calculateLevels(currentPrice, direction, targetRoe, slRoe);
    }
  }, [isOpen, asset, direction]);

  if (!isOpen) return null;

  const handleRefreshToMarket = () => {
    calculateLevels(currentPrice, direction, targetRoe, slRoe);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = parseFloat(entryPrice) || currentPrice;
    const tp = parseFloat(tpPrice) || (direction === 'BUY' ? entry * 1.025 : entry * 0.975);
    const sl = parseFloat(slPrice) || (direction === 'BUY' ? entry * 0.99 : entry * 1.01);

    const priceMoveTp = Math.abs(tp - entry) / entry;
    const priceMoveSl = Math.abs(sl - entry) / entry;
    const calcRoeTp = Math.round(priceMoveTp * leverage * 1000) / 10;
    const calcRoeSl = Math.round(priceMoveSl * leverage * 1000) / 10;

    const roundVal = (v: number) => parseFloat(v.toFixed(decimals));

    const manualSignal: SignalData = {
      id: `manual-${asset.replace('/', '')}-${Date.now()}`,
      asset,
      timeframe: '1h',
      createdAt: Date.now(),
      timestamp: Date.now(),
      signal: direction === 'BUY' ? 'STRONG BUY' : 'STRONG SELL',
      confidencePercent: 94.0,
      timeHorizon: 'Manual Trader Execution (10x)',
      orderType: 'MARKET ORDER',
      leverageMultiplier: leverage,
      marginMode: 'ISOLATED',
      recommendedMarginUsdt: marginUsdt,
      targetRoePercent: calcRoeTp,
      entryPrice: entry,
      entryRange: {
        min: roundVal(entry * (direction === 'BUY' ? 0.9985 : 0.999)),
        max: roundVal(entry * (direction === 'BUY' ? 1.001 : 1.0015)),
      },
      takeProfit: [
        {
          target: 'TP 1',
          price: tp,
          targetRoePercent: calcRoeTp,
        },
      ],
      stopLoss: {
        price: sl,
        slRoePercent: -calcRoeSl,
        riskRewardRatio: (calcRoeTp / (calcRoeSl || 1)).toFixed(1) + ':1',
      },
      technicalConfluence: [
        'Manual Order Flow Execution at Institutional Order Block',
        `Risk managed strictly with ${leverage}x leverage isolated margin`,
      ],
      smartMoneyConcept: {
        liquidityZone: `${asset} Institutional Value Area`,
        orderBlock: `Key 1H Order Block at $${entry.toLocaleString()}`,
        fairValueGap: 'Direct Manual Execution',
        marketBias: direction === 'BUY' ? 'Bullish Expansion' : 'Bearish Liquidity Run',
      },
      macroeconomicCatalyst: 'Manual Trader Discretionary Strategy',
      newsCatalyst: 'Discretionary Trade Executed by Portfolio Owner',
      riskManagementNote: `Max risk isolated at $${Math.round(marginUsdt * (calcRoeSl / 100))} USDT (${calcRoeSl}% ROE)`,
      status: 'RUNNING',
    };

    onOpenTrade(manualSignal);
    onClose();
  };

  const isAlreadyOpen = !!activeSignals[asset];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-teal-500/30 p-4 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-teal-500/20">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-white tracking-wide font-mono">
                Buka Posisi Manual
              </h2>
              <p className="text-[10px] text-teal-300/80 font-mono">
                Crypto Futures 10x Multiplier
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning if asset already in trade */}
        {isAlreadyOpen && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
            ⚠️ <strong>{asset}</strong> saat ini sedang memiliki posisi terbuka. Membuka posisi baru akan menggantikan posisi tersebut.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3.5 space-y-3 font-mono">
          {/* Asset Selector */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Pilih Asset Crypto:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['BTC/USDT', 'ETH/USDT', 'XRP/USDT'] as AssetSymbol[]).map((a) => {
                const isSelected = asset === a;
                const p = a === 'BTC/USDT' ? currentPrices.btc : a === 'ETH/USDT' ? currentPrices.eth : currentPrices.xrp;
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAsset(a)}
                    className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-teal-500/25 border-teal-400 text-white shadow-md shadow-teal-500/20'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs">{a.split('/')[0]}</div>
                    <div className="text-[10px] text-teal-300 tabular-nums">
                      ${p > 0 ? (a === 'XRP/USDT' ? p.toFixed(4) : p.toFixed(1)) : '...'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direction Selector (LONG vs SHORT) */}
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Arah Posisi:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('BUY')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                  direction === 'BUY'
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span>LONG (BUY)</span>
              </button>
              <button
                type="button"
                onClick={() => setDirection('SELL')}
                className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                  direction === 'SELL'
                    ? 'bg-rose-500/25 border-rose-400 text-rose-300 shadow-md shadow-rose-500/20'
                    : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-rose-400 stroke-[3]" />
                <span>SHORT (SELL)</span>
              </button>
            </div>
          </div>

          {/* Margin & Leverage */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Margin USDT:</label>
              <input
                type="number"
                value={marginUsdt}
                onChange={(e) => setMarginUsdt(Math.max(10, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white tabular-nums focus:outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Leverage Multiplier:</label>
              <div className="bg-slate-900/80 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-teal-300 font-bold">
                10x Futures
              </div>
            </div>
          </div>

          {/* Entry Price with Refresh */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Harga Entry @:</span>
              <button
                type="button"
                onClick={handleRefreshToMarket}
                className="inline-flex items-center gap-1 text-[10px] text-teal-300 hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Ambil Harga Pasar
              </button>
            </div>
            <input
              type="text"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="w-full bg-slate-900/80 border border-teal-500/30 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold tabular-nums focus:outline-none focus:border-teal-400"
              placeholder="0.00"
              required
            />
          </div>

          {/* TP & SL Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-emerald-400 block mb-1">
                Target TP (+{targetRoe}% ROE):
              </label>
              <input
                type="text"
                value={tpPrice}
                onChange={(e) => setTpPrice(e.target.value)}
                className="w-full bg-slate-900/80 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 text-xs text-emerald-300 font-bold tabular-nums focus:outline-none focus:border-emerald-400"
                required
              />
              <span className="text-[9px] text-emerald-400/80 block mt-0.5">
                Estimasi Profit: +${((marginUsdt * targetRoe) / 100).toFixed(2)}
              </span>
            </div>
            <div>
              <label className="text-[11px] text-rose-400 block mb-1">
                Stop Loss (-{slRoe}% ROE):
              </label>
              <input
                type="text"
                value={slPrice}
                onChange={(e) => setSlPrice(e.target.value)}
                className="w-full bg-slate-900/80 border border-rose-500/30 rounded-xl px-2.5 py-1.5 text-xs text-rose-300 font-bold tabular-nums focus:outline-none focus:border-rose-400"
                required
              />
              <span className="text-[9px] text-rose-400/80 block mt-0.5">
                Maksimal Risiko: -${((marginUsdt * slRoe) / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                direction === 'BUY'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/25 hover:brightness-110 active:scale-[0.98]'
                  : 'bg-gradient-to-r from-rose-500 to-amber-600 text-white shadow-rose-500/25 hover:brightness-110 active:scale-[0.98]'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                EKSEKUSI {direction === 'BUY' ? 'LONG' : 'SHORT'} {asset}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
