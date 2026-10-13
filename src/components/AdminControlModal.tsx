import React, { useState, useEffect } from 'react';
import { AssetSymbol, SignalData, VipPaymentRequest } from '../types';
import {
  Play,
  Pause,
  PlusCircle,
  Trash2,
  X,
  Sliders,
  RefreshCw,
  CreditCard,
  CheckCircle,
  Copy,
  Check,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import {
  setBotControlInCloud,
  clearAllTradesInCloud,
  subscribeToVipPaymentRequests,
  approveVipPayment,
} from '../utils/tradeDbService';

interface AdminControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBotRunning: boolean;
  onToggleBot: (running: boolean) => void;
  activeSignals: Record<AssetSymbol, SignalData | null>;
  onForceCloseSignal: (asset: AssetSymbol, hitType: 'HIT_TP' | 'HIT_SL') => void;
  onAddManualSignal: (signal: SignalData) => void;
  onResetAllHistory: () => void;
  currentPrices: { btc: number; eth: number; xrp: number };
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
  const [activeTab, setActiveTab] = useState<'bot' | 'create' | 'payments' | 'manage'>('bot');

  // Manual Signal Form State
  const [manualAsset, setManualAsset] = useState<AssetSymbol>('BTC/USDT');
  const [manualDirection, setManualDirection] = useState<'BUY' | 'SELL'>('BUY');
  const [manualEntry, setManualEntry] = useState<string>('');
  const [manualTp, setManualTp] = useState<string>('');
  const [manualSl, setManualSl] = useState<string>('');
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  // VIP Payment requests state
  const [vipRequests, setVipRequests] = useState<VipPaymentRequest[]>([]);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [manualGeneratedPin, setManualGeneratedPin] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToVipPaymentRequests((reqs) => {
      setVipRequests(reqs);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBotSwitch = async (newStatus: boolean) => {
    onToggleBot(newStatus);
    await setBotControlInCloud(newStatus);
  };

  const handleAutoFillPrices = () => {
    const price =
      manualAsset === 'BTC/USDT'
        ? currentPrices.btc
        : manualAsset === 'ETH/USDT'
        ? currentPrices.eth
        : currentPrices.xrp;

    const decimals = manualAsset === 'XRP/USDT' ? 4 : 2;
    setManualEntry(price.toFixed(decimals));

    if (manualDirection === 'BUY') {
      const tp =
        manualAsset === 'BTC/USDT'
          ? price + 750
          : manualAsset === 'ETH/USDT'
          ? price + 35
          : price + 0.035;
      const sl =
        manualAsset === 'BTC/USDT'
          ? price - 350
          : manualAsset === 'ETH/USDT'
          ? price - 18
          : price - 0.018;
      setManualTp(tp.toFixed(decimals));
      setManualSl(sl.toFixed(decimals));
    } else {
      const tp =
        manualAsset === 'BTC/USDT'
          ? price - 750
          : manualAsset === 'ETH/USDT'
          ? price - 35
          : price - 0.035;
      const sl =
        manualAsset === 'BTC/USDT'
          ? price + 350
          : manualAsset === 'ETH/USDT'
          ? price + 18
          : price + 0.018;
      setManualTp(tp.toFixed(decimals));
      setManualSl(sl.toFixed(decimals));
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

    const pips =
      manualAsset === 'XRP/USDT'
        ? Math.round(Math.abs(tp - entry) * 10000)
        : Math.round(Math.abs(tp - entry));

    const newSig: SignalData = {
      id: `manual-${manualAsset.toLowerCase().replace('/', '')}-${Date.now()}`,
      asset: manualAsset,
      timeframe: '1h',
      createdAt: Date.now(),
      signal: manualDirection === 'BUY' ? 'STRONG BUY' : 'STRONG SELL',
      confidencePercent: 92,
      timeHorizon: 'Admin Signal Execution',
      orderType: manualDirection === 'BUY' ? 'Market Buy' : 'Market Sell',
      entryPrice: entry,
      entryRange: {
        min: Math.min(entry, manualDirection === 'BUY' ? entry - 10 : entry + 10),
        max: Math.max(entry, manualDirection === 'BUY' ? entry - 10 : entry + 10),
      },
      takeProfit: [{ target: 'TP 1', price: tp, pipsOrPoints: pips }],
      stopLoss: {
        price: sl,
        pipsOrPoints: Math.abs(entry - sl),
        riskRewardRatio: (Math.abs(tp - entry) / Math.abs(entry - sl)).toFixed(1),
      },
      technicalConfluence: ['Manual signal injected directly by Master Administrator.'],
      smartMoneyConcept: {
        liquidityZone: 'Admin Priority Level',
        orderBlock: `Manual Order Block at $${entry}`,
        fairValueGap: 'Admin Verified',
        marketBias: manualDirection === 'BUY' ? 'Bullish Expansion' : 'Bearish Liquidity Run',
      },
      macroeconomicCatalyst: 'Administrator discretionary institutional setup.',
      riskManagementNote: 'Hard TP/SL managed.',
      status: 'RUNNING',
    };

    onAddManualSignal(newSig);
    setFormFeedback(`Active ${manualAsset} ${manualDirection} signal launched!`);
    setTimeout(() => {
      setFormFeedback(null);
      setActiveTab('bot');
    }, 1200);
  };

  const handleResetHistory = async () => {
    if (window.confirm('Reset ALL historical trade data and start fresh today?')) {
      await clearAllTradesInCloud();
      onResetAllHistory();
      alert('Trade history cleared! Fresh start engaged.');
      onClose();
    }
  };

  const handleApproveVip = async (req: VipPaymentRequest) => {
    // Generate random 6 digit PIN (100000 to 999999)
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    await approveVipPayment(req.id, pin);
    setCopiedPin(pin);
  };

  const handleGenerateManualPin = () => {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    try {
      const raw = localStorage.getItem('aurasignals_approved_vip_pins');
      const existing = raw ? JSON.parse(raw) : [];
      if (!existing.includes(pin)) {
        existing.push(pin);
        localStorage.setItem('aurasignals_approved_vip_pins', JSON.stringify(existing));
      }
    } catch (e) {}
    setManualGeneratedPin(pin);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPin(text);
    setTimeout(() => setCopiedPin(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-5 sm:p-6 border border-amber-500/35 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center font-bold">
            👑
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black font-mono text-white tracking-wide">
              Admin Control Center
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Bot Status, Manual Signals, VIP Payments & PIN Minting
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-2xl bg-slate-950 p-1 border border-white/5 font-mono text-xs">
          <button
            onClick={() => setActiveTab('bot')}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'bot'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bot & Signals
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual Signal
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all cursor-pointer relative ${
              activeTab === 'payments'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            VIP Payments
            {vipRequests.filter((r) => r.status === 'PENDING').length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-950 text-[9px] font-black">
                {vipRequests.filter((r) => r.status === 'PENDING').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Reset
          </button>
        </div>

        {/* TAB 1: BOT STATUS & LIVE ACTIVE SIGNALS */}
        {activeTab === 'bot' && (
          <div className="space-y-4 font-mono text-xs">
            {/* Autonomous Trading Bot Toggle */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/25 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-white block">Autonomous AI Bot</span>
                <span className="text-[11px] text-slate-400">
                  {isBotRunning
                    ? 'Bot is actively executing & managing TP/SL 24/7'
                    : 'Trading AI is paused (No automatic new orders)'}
                </span>
              </div>

              {isBotRunning ? (
                <button
                  onClick={() => handleBotSwitch(false)}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1.5 font-bold cursor-pointer transition-all shadow-md active:scale-95"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Stop Bot</span>
                </button>
              ) : (
                <button
                  onClick={() => handleBotSwitch(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 flex items-center gap-1.5 font-bold cursor-pointer transition-all shadow-md active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Bot</span>
                </button>
              )}
            </div>

            {/* Currently Active Signals List */}
            <div className="space-y-2">
              <span className="text-slate-400 text-[11px] block font-bold">
                Active Signal Force Overrides:
              </span>

              {(['BTC/USDT', 'ETH/USDT', 'XRP/USDT'] as AssetSymbol[]).map((asset) => {
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
                        Entry @ ${sig.entryPrice?.toFixed(asset === 'XRP/USDT' ? 4 : 2)}
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

        {/* TAB 2: MANUAL SIGNAL INJECTION */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmitManualSignal} className="space-y-3 font-mono text-xs">
            {/* Asset Selector */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Asset Symbol</label>
              <div className="flex rounded-xl bg-slate-900 border border-white/10 p-0.5">
                {(['BTC/USDT', 'ETH/USDT', 'XRP/USDT'] as AssetSymbol[]).map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setManualAsset(sym)}
                    className={`flex-1 py-1 rounded-lg font-bold cursor-pointer ${
                      manualAsset === sym ? 'bg-amber-500/25 text-amber-300' : 'text-slate-400'
                    }`}
                  >
                    {sym.split('/')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Direction */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Direction</label>
              <div className="flex rounded-xl bg-slate-900 border border-white/10 p-0.5">
                <button
                  type="button"
                  onClick={() => setManualDirection('BUY')}
                  className={`flex-1 py-1 rounded-lg font-bold cursor-pointer ${
                    manualDirection === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                  }`}
                >
                  BUY ↗
                </button>
                <button
                  type="button"
                  onClick={() => setManualDirection('SELL')}
                  className={`flex-1 py-1 rounded-lg font-bold cursor-pointer ${
                    manualDirection === 'SELL' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'
                  }`}
                >
                  SELL ↘
                </button>
              </div>
            </div>

            {/* Prices */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">Target Execution Levels</span>
              <button
                type="button"
                onClick={handleAutoFillPrices}
                className="text-[10px] text-teal-300 hover:text-teal-200 underline cursor-pointer"
              >
                Auto-fill Live Market Levels
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Entry Price</label>
                <input
                  type="number"
                  step="any"
                  value={manualEntry}
                  onChange={(e) => setManualEntry(e.target.value)}
                  placeholder="Entry $"
                  required
                  className="w-full p-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Take Profit (TP)</label>
                <input
                  type="number"
                  step="any"
                  value={manualTp}
                  onChange={(e) => setManualTp(e.target.value)}
                  placeholder="TP $"
                  required
                  className="w-full p-2 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-300 text-xs outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Stop Loss (SL)</label>
                <input
                  type="number"
                  step="any"
                  value={manualSl}
                  onChange={(e) => setManualSl(e.target.value)}
                  placeholder="SL $"
                  required
                  className="w-full p-2 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-300 text-xs outline-none focus:border-rose-400"
                />
              </div>
            </div>

            {formFeedback && (
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-center text-xs">
                {formFeedback}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-teal-400 hover:from-amber-300 hover:to-teal-300 text-slate-950 font-bold font-mono text-xs cursor-pointer shadow-lg active:scale-95"
            >
              Publish Manual Signal Now
            </button>
          </form>
        )}

        {/* TAB 3: VIP PAYMENTS & PIN GENERATION */}
        {activeTab === 'payments' && (
          <div className="space-y-3 font-mono text-xs">
            {/* Manual PIN Minting */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-teal-500/20 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">Generate New 6-Digit VIP PIN</span>
                <span className="text-[10px] text-slate-400">Mint code to send to user manually</span>
              </div>
              <button
                type="button"
                onClick={handleGenerateManualPin}
                className="px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-400 text-teal-300 font-bold hover:bg-teal-500/30 cursor-pointer text-xs"
              >
                + Mint PIN
              </button>
            </div>

            {manualGeneratedPin && (
              <div className="p-3 rounded-2xl bg-teal-500/15 border border-teal-500/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-teal-300 block">Generated VIP PIN:</span>
                  <span className="text-lg font-black text-white tracking-widest">{manualGeneratedPin}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(manualGeneratedPin)}
                  className="px-3 py-1 rounded-xl bg-white/10 text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedPin === manualGeneratedPin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPin === manualGeneratedPin ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}

            {/* Payment Requests List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-300 block">
                User Payment Claims ({vipRequests.length})
              </span>

              {vipRequests.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/5 text-center text-slate-500">
                  No payment claims submitted yet.
                </div>
              ) : (
                vipRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-2xl bg-slate-900/70 border border-white/10 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-xs block">{req.userName}</span>
                        <span className="text-[10px] text-slate-400">
                          {req.contact} · {req.method} ({req.amount})
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 bg-black/40 p-1.5 rounded-lg border border-white/5 break-all">
                      Proof/Ref: {req.txProofOrRef}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      {req.approvedPin ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">PIN:</span>
                          <span className="font-bold text-teal-300 tracking-wider">{req.approvedPin}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(req.approvedPin!)}
                            className="text-[10px] text-slate-400 hover:text-white"
                          >
                            Copy
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleApproveVip(req)}
                          className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                        >
                          Approve & Issue 6-Digit PIN
                        </button>
                      )}

                      <a
                        href={`https://wa.me/?text=Halo%20${encodeURIComponent(req.userName)},%20pembayaran%20VIP%20kamu%20telah%20diverifikasi!%20PIN%20akses%20kamu:%20${req.approvedPin || ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <span>Send WA</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: RESET ALL HISTORY */}
        {activeTab === 'manage' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-2">
              <span className="font-bold text-rose-300 block">Fresh Start Reset</span>
              <p className="text-slate-300 text-[11px] font-sans">
                This will delete all closed trades and AI journal entries from both your local browser
                and Firebase Firestore cloud database. The bot will begin with 0 trades today.
              </p>
              <button
                type="button"
                onClick={handleResetHistory}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete All History & Start Fresh</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
