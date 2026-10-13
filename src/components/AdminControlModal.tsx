import React, { useState } from 'react';
import { AssetSymbol, SignalData } from '../types';
import { Play, Pause, PlusCircle, Trash2, X, Sliders, RefreshCw } from 'lucide-react';
import { setBotControlInCloud, clearAllTradesInCloud } from '../utils/tradeDbService';

interface AdminControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBotRunning: boolean;
  onToggleBot: (running: boolean) => void;
  activeSignals: Record<AssetSymbol, SignalData | null>;
  onForceCloseSignal: (asset: AssetSymbol, hitType: 'HIT_TP' | 'HIT_SL') => void;
  onAddManualSignal: (signal: SignalData) => void;
  onResetAllHistory: () => void;
  currentPrices: { btc: number; xau: number };
}

export const AdminControlModal: React.FC<AdminControlModalProps> = ({
  isOpen,
  onClose,
  isBotRunning,
  onToggleBot,
  activeSignals,
  onForceCloseSignal,
  onAddManualSignal,
  onResetAllHistory,
  currentPrices,
}) => {
  const [activeTab, setActiveTab] = useState<'bot' | 'create' | 'manage'>('bot');

  // Manual Signal Form State
  const [manualAsset, setManualAsset] = useState<AssetSymbol>('BTC/USDT');
  const [manualDirection, setManualDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [manualEntry, setManualEntry] = useState<string>('');
  const [manualTp, setManualTp] = useState<string>('');
  const [manualSl, setManualSl] = useState<string>('');
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBotSwitch = async (newStatus: boolean) => {
    onToggleBot(newStatus);
    await setBotControlInCloud(newStatus);
  };

  const handleAutoFillPrices = () => {
    const price = manualAsset === 'BTC/USDT' ? currentPrices.btc : currentPrices.xau;
    setManualEntry(price.toFixed(2));
    if (manualDirection === 'BUY') {
      const tp = manualAsset === 'BTC/USDT' ? price + 750 : price + 8.5;
      const sl = manualAsset === 'BTC/USDT' ? price - 350 : price - 3.5;
      setManualTp(tp.toFixed(2));
      setManualSl(sl.toFixed(2));
    } else {
      const tp = manualAsset === 'BTC/USDT' ? price - 750 : price - 8.5;
      const sl = manualAsset === 'BTC/USDT' ? price + 350 : price + 3.5;
      setManualTp(tp.toFixed(2));
      setManualSl(sl.toFixed(2));
    }
  };

  const handleSubmitManualSignal = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = parseFloat(manualEntry);
    const tp = parseFloat(manualTp);
    const sl = parseFloat(manualSl);

    if (!entry || !tp || !sl) {
      setFormFeedback('Please fill Entry, TP, and SL price levels.');
      return;
    }

    const newSignal: SignalData = {
      id: `manual-sig-${Date.now()}`,
      asset: manualAsset,
      timeframe: '1h',
      createdAt: Date.now(),
      signal: manualDirection === 'BUY' ? 'STRONG BUY' : 'STRONG SELL',
      confidencePercent: 94.0,
      timeHorizon: 'H1 Manual Admin Order',
      orderType: 'Instant Market Execution',
      entryPrice: entry,
      entryRange: { min: entry - 1, max: entry + 1 },
      takeProfit: [{ target: 'TP1', price: tp, pipsOrPoints: Math.abs(tp - entry) }],
      stopLoss: {
        price: sl,
        pipsOrPoints: Math.abs(entry - sl),
        riskRewardRatio: '1:2.0',
      },
      technicalConfluence: ['Admin Direct Confluence', 'Institutional Order Block'],
      smartMoneyConcept: {
        liquidityZone: 'Admin Direct Execution',
        orderBlock: 'Targeted Institutional Block',
        fairValueGap: 'Direct Fair Value Shift',
        marketBias: manualDirection === 'BUY' ? 'Bullish Expansion' : 'Bearish Liquidity Run',
      },
      macroeconomicCatalyst: 'Admin Direct Market Execution',
      riskManagementNote: 'Capital discipline 1.5% max risk',
      status: 'RUNNING',
    };

    onAddManualSignal(newSignal);
    setFormFeedback('✅ Manual signal published to all users!');
    setTimeout(() => {
      setFormFeedback(null);
      onClose();
    }, 1200);
  };

  const handleResetHistory = async () => {
    if (confirm('Are you sure you want to reset all trade history? The database will be wiped fresh starting at 0 trades.')) {
      await clearAllTradesInCloud();
      onResetAllHistory();
      setFormFeedback('✅ All trade history deleted. Platform is fresh!');
      setTimeout(() => setFormFeedback(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-5 border border-amber-500/30 shadow-2xl space-y-4 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 border-b border-amber-500/20 pb-3">
          <div className="p-2 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black font-mono text-white tracking-wide flex items-center gap-1.5">
              <span>ADMIN CONTROL PANEL</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md">
                MASTER
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              Manage AI trading bot, publish manual signals, and control state.
            </p>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center p-1 bg-slate-900/80 rounded-2xl border border-white/5 font-mono text-xs">
          <button
            onClick={() => setActiveTab('bot')}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'bot'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bot AI
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            New Signal
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Database
          </button>
        </div>

        {formFeedback && (
          <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-mono text-center font-bold animate-in fade-in">
            {formFeedback}
          </div>
        )}

        {/* TAB 1: BOT TRADING AI (START / STOP / OVERRIDE) */}
        {activeTab === 'bot' && (
          <div className="space-y-4 font-mono text-xs">
            {/* Bot Status Switcher */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">AI Trading Bot Engine</span>
                  <span className="text-sm font-black text-white flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isBotRunning ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                      }`}
                    />
                    <span>Status: {isBotRunning ? 'ACTIVE (RUNNING)' : 'PAUSED'}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleBotSwitch(!isBotRunning)}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                    isBotRunning
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                  }`}
                >
                  {isBotRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5 text-rose-400" />
                      <span>Stop Bot</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Start Bot</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                {isBotRunning
                  ? 'Bot is actively analyzing market ticks and monitoring TP/SL.'
                  : 'Bot is paused. No new automatic positions will open until resumed.'}
              </p>
            </div>

            {/* Quick Action: Force Close Active Signals */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Manage Active Positions (Force Close)
              </span>

              {(['BTC/USDT', 'XAU/USD'] as AssetSymbol[]).map((asset) => {
                const sig = activeSignals[asset];
                if (!sig) {
                  return (
                    <div
                      key={asset}
                      className="p-2.5 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between text-slate-500"
                    >
                      <span>{asset}</span>
                      <span>No Active Position</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={asset}
                    className="p-3 rounded-2xl bg-slate-900/70 border border-teal-500/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white">
                        {asset} · {sig.signal}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Entry @ ${sig.entryPrice?.toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <button
                        onClick={() => onForceCloseSignal(asset, 'HIT_TP')}
                        className="flex-1 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 font-bold text-[11px] cursor-pointer"
                      >
                        Force TP 🎯
                      </button>
                      <button
                        onClick={() => onForceCloseSignal(asset, 'HIT_SL')}
                        className="flex-1 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 font-bold text-[11px] cursor-pointer"
                      >
                        Force SL 🛑
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PUBLISH MANUAL SIGNAL */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmitManualSignal} className="space-y-3 font-mono text-xs">
            {/* Asset & Direction Picker */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Asset Symbol</label>
                <div className="flex rounded-xl bg-slate-900 border border-white/10 p-0.5">
                  <button
                    type="button"
                    onClick={() => setManualAsset('BTC/USDT')}
                    className={`flex-1 py-1 rounded-lg font-bold cursor-pointer ${
                      manualAsset === 'BTC/USDT' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
                    }`}
                  >
                    BTC
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualAsset('XAU/USD')}
                    className={`flex-1 py-1 rounded-lg font-bold cursor-pointer ${
                      manualAsset === 'XAU/USD' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
                    }`}
                  >
                    GOLD
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Order Direction</label>
                <div className="flex rounded-xl bg-slate-900 border border-white/10 p-0.5">
                  <button
                    type="button"
                    onClick={() => setManualDirection('BUY')}
                    className={`flex-1 py-1 rounded-lg font-bold cursor-pointer ${
                      manualDirection === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualDirection('SELL')}
                    className={`flex-1 py-1 rounded-lg font-bold cursor-pointer ${
                      manualDirection === 'SELL' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Auto-Fill Button */}
            <button
              type="button"
              onClick={handleAutoFillPrices}
              className="w-full py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 font-bold text-[11px] cursor-pointer transition-all"
            >
              ⚡ Auto-Calculate Levels from Market Price
            </button>

            {/* Entry Price */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Entry Price ($)</label>
              <input
                type="number"
                step="any"
                value={manualEntry}
                onChange={(e) => setManualEntry(e.target.value)}
                placeholder="Market Entry Price"
                className="w-full p-2 rounded-xl bg-slate-900 border border-white/10 text-white font-bold"
                required
              />
            </div>

            {/* TP & SL Row */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Take Profit ($)</label>
                <input
                  type="number"
                  step="any"
                  value={manualTp}
                  onChange={(e) => setManualTp(e.target.value)}
                  placeholder="Target TP"
                  className="w-full p-2 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-300 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Stop Loss ($)</label>
                <input
                  type="number"
                  step="any"
                  value={manualSl}
                  onChange={(e) => setManualSl(e.target.value)}
                  placeholder="Stop Loss"
                  className="w-full p-2 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-300 font-bold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black tracking-wide shadow-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish Signal to Users</span>
            </button>
          </form>
        )}

        {/* TAB 3: MANAGE DATABASE & FRESH START */}
        {activeTab === 'manage' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <Trash2 className="w-4 h-4" />
                <span>Fresh Start (Reset History)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                This action purges all historical closed trades both locally and in Firestore Cloud. Database resets to 0 trades for a clean track record today.
              </p>
              <button
                type="button"
                onClick={handleResetHistory}
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset All History (Fresh Start)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
