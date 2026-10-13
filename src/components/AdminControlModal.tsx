import React, { useState } from 'react';
import { AssetSymbol, SignalData } from '../types';
import { Play, Pause, PlusCircle, Trash2, X, CheckCircle, ShieldAlert, Sliders, RefreshCw } from 'lucide-react';
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
      setFormFeedback('Mohon isi semua level Entry, TP, dan SL.');
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
      macroeconomicCatalyst: 'Eksekusi Langsung Admin Portal',
      riskManagementNote: 'Disiplin modal 1.5% max risk',
      status: 'RUNNING',
    };

    onAddManualSignal(newSignal);
    setFormFeedback('✅ Sinyal manual berhasil diterbitkan ke semua member!');
    setTimeout(() => {
      setFormFeedback(null);
      onClose();
    }, 1200);
  };

  const handleResetHistory = async () => {
    if (confirm('Yakin ingin mereset semua history trades? Database akan dibuat bersih mulai dari 0 untuk hari ini.')) {
      await clearAllTradesInCloud();
      onResetAllHistory();
      setFormFeedback('✅ Semua history telah dihapus. Platform fresh mulai hari ini!');
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
            <span className="text-[11px] text-slate-400 font-mono">
              Kelola Bot AI, Sinyal Manual & Database
            </span>
          </div>
        </div>

        {/* Sub Nav Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/70 rounded-2xl border border-white/5 font-mono text-xs">
          <button
            onClick={() => setActiveTab('bot')}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'bot'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bot AI
          </button>
          <button
            onClick={() => {
              setActiveTab('create');
              handleAutoFillPrices();
            }}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            + Sinyal
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-2 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Database
          </button>
        </div>

        {/* Feedback Alert */}
        {formFeedback && (
          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono text-center animate-in fade-in">
            {formFeedback}
          </div>
        )}

        {/* TAB 1: KONTROL BOT TRADING AI */}
        {activeTab === 'bot' && (
          <div className="space-y-3 pt-1">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-teal-500/20 space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Status Bot AI 24/7</span>
                  <span className="text-[11px] text-slate-400">
                    {isBotRunning
                      ? 'Bot AI aktif mencari peluang & open order'
                      : 'Bot AI dihentikan (tidak ada order otomatis)'}
                  </span>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                    isBotRunning
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {isBotRunning ? 'RUNNING' : 'STOPPED'}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex gap-2">
                <button
                  onClick={() => handleBotSwitch(true)}
                  disabled={isBotRunning}
                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isBotRunning
                      ? 'bg-emerald-500/10 text-emerald-600 opacity-50 cursor-not-allowed'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-emerald-400" />
                  <span>Jalankan Bot AI</span>
                </button>

                <button
                  onClick={() => handleBotSwitch(false)}
                  disabled={!isBotRunning}
                  className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    !isBotRunning
                      ? 'bg-rose-500/10 text-rose-600 opacity-50 cursor-not-allowed'
                      : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <Pause className="w-3.5 h-3.5 fill-rose-400" />
                  <span>Hentikan Bot AI</span>
                </button>
              </div>
            </div>

            {/* Force Close Current Running Positions */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/5 space-y-2.5 font-mono">
              <span className="text-xs font-bold text-slate-300 block">
                Koreksi / Force Close Posisi Berjalan:
              </span>

              {/* BTC Signal */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5 text-[11px]">
                <div className="text-slate-300">
                  <strong>BTC:</strong> {activeSignals['BTC/USDT'] ? activeSignals['BTC/USDT']?.signal : 'Tidak Ada Posisi'}
                </div>
                {activeSignals['BTC/USDT'] && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onForceCloseSignal('BTC/USDT', 'HIT_TP')}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold cursor-pointer"
                    >
                      Close TP
                    </button>
                    <button
                      onClick={() => onForceCloseSignal('BTC/USDT', 'HIT_SL')}
                      className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold cursor-pointer"
                    >
                      Close SL
                    </button>
                  </div>
                )}
              </div>

              {/* XAU Signal */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5 text-[11px]">
                <div className="text-slate-300">
                  <strong>XAU:</strong> {activeSignals['XAU/USD'] ? activeSignals['XAU/USD']?.signal : 'Tidak Ada Posisi'}
                </div>
                {activeSignals['XAU/USD'] && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onForceCloseSignal('XAU/USD', 'HIT_TP')}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold cursor-pointer"
                    >
                      Close TP
                    </button>
                    <button
                      onClick={() => onForceCloseSignal('XAU/USD', 'HIT_SL')}
                      className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold cursor-pointer"
                    >
                      Close SL
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TAMBAH SINYAL MANUAL */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmitManualSignal} className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Aset</label>
                <select
                  value={manualAsset}
                  onChange={(e) => {
                    setManualAsset(e.target.value as AssetSymbol);
                    setTimeout(handleAutoFillPrices, 50);
                  }}
                  className="w-full p-2 rounded-xl bg-slate-900 border border-white/10 text-white font-bold"
                >
                  <option value="BTC/USDT">BTC/USDT</option>
                  <option value="XAU/USD">XAU/USD</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Arah Order</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setManualDirection('BUY');
                      setTimeout(handleAutoFillPrices, 50);
                    }}
                    className={`py-2 rounded-xl font-bold cursor-pointer ${
                      manualDirection === 'BUY'
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setManualDirection('SELL');
                      setTimeout(handleAutoFillPrices, 50);
                    }}
                    className={`py-2 rounded-xl font-bold cursor-pointer ${
                      manualDirection === 'SELL'
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    SELL
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] text-slate-400">Entry Price ($)</label>
                <button
                  type="button"
                  onClick={handleAutoFillPrices}
                  className="text-[10px] text-teal-400 hover:underline cursor-pointer"
                >
                  Isi Harga Live
                </button>
              </div>
              <input
                type="number"
                step="any"
                value={manualEntry}
                onChange={(e) => setManualEntry(e.target.value)}
                placeholder="Contoh: 83500.00"
                className="w-full p-2 rounded-xl bg-slate-900 border border-white/10 text-white font-bold"
                required
              />
            </div>

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
                  placeholder="Batas SL"
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
              <span>Terbitkan Sinyal Baru ke Member</span>
            </button>
          </form>
        )}

        {/* TAB 3: MANAJEMEN DATABASE & FRESH START */}
        {activeTab === 'manage' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <Trash2 className="w-4 h-4" />
                <span>Fresh Start Trading (Mulai Hari Ini)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                Tindakan ini akan menghapus semua riwayat transaksi dummy sebelumnya baik di browser maupun di Firebase Cloud. Database akan kembali bersih dari 0 untuk memulai pencatatan riwayat trading baru hari ini.
              </p>
              <button
                type="button"
                onClick={handleResetHistory}
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Hapus Semua Riwayat Sekarang (Fresh Start)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
