import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  AssetSymbol,
  MarketTicker,
  SignalData,
  ClosedTrade,
  AiTradeJournalEntry,
} from './types';
import { AssetHero } from './components/AssetHero';
import { TpProgressCard } from './components/TpProgressCard';
import { AiTradeJournalCard } from './components/AiTradeJournalCard';
import { OwnerLivePortfolio } from './components/OwnerLivePortfolio';
import { DailyPnlView } from './components/DailyPnlView';
import { SignalHistoryTable } from './components/SignalHistoryTable';
import { BottomNavBar, NavSection } from './components/BottomNavBar';
import { AccessCodeModal } from './components/AccessCodeModal';
import { AdminControlModal } from './components/AdminControlModal';
import { GuestSignalLock } from './components/GuestSignalLock';
import { VipPaymentModal } from './components/VipPaymentModal';
import { AnalyticChartsView } from './components/AnalyticChartsView';
import {
  subscribeToClosedTrades,
  saveClosedTradeToCloud,
  saveJournalEntryToCloud,
  subscribeToBotControl,
  clearAllTradesInCloud,
} from './utils/tradeDbService';
import { generateInstantSignal, checkSignalHit, generateWavePoints } from './utils/signalEngine';
import { generateLiveJournalEntry } from './utils/aiTradingAgent';
import { Bell, BellOff, Crown, UserCheck, KeyRound, Sliders, Sparkles } from 'lucide-react';

const DEFAULT_BTC: MarketTicker = {
  symbol: 'BTC/USDT',
  name: 'Bitcoin / Tether USD',
  price: 83674.0,
  change24h: 695.0,
  changePercent: 0.84,
  high24h: 84100.0,
  low24h: 82900.0,
  bid: 83673.5,
  ask: 83674.5,
  spread: 1.0,
  candles: [],
  timestamp: Date.now(),
};

const DEFAULT_ETH: MarketTicker = {
  symbol: 'ETH/USDT',
  name: 'Ethereum / Tether USD',
  price: 2542.5,
  change24h: 32.4,
  changePercent: 1.28,
  high24h: 2580.0,
  low24h: 2510.0,
  bid: 2542.4,
  ask: 2542.6,
  spread: 0.2,
  candles: [],
  timestamp: Date.now(),
};

const DEFAULT_XRP: MarketTicker = {
  symbol: 'XRP/USDT',
  name: 'Ripple / Tether USD',
  price: 1.3820,
  change24h: 0.042,
  changePercent: 3.12,
  high24h: 1.4250,
  low24h: 1.3410,
  bid: 1.3818,
  ask: 1.3822,
  spread: 0.0004,
  candles: [],
  timestamp: Date.now(),
};

export default function App() {
  // Navigation: Live Signals vs Daily PnL vs Performance vs Analytic Charts
  const [activeSection, setActiveSection] = useState<NavSection>('chart');
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>('BTC/USDT');

  // Sound Alerts
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Market Data (BTC, ETH, XRP)
  const [btcTicker, setBtcTicker] = useState<MarketTicker>(DEFAULT_BTC);
  const [ethTicker, setEthTicker] = useState<MarketTicker>(DEFAULT_ETH);
  const [xrpTicker, setXrpTicker] = useState<MarketTicker>(DEFAULT_XRP);
  const btcTickerRef = useRef<MarketTicker>(DEFAULT_BTC);
  const ethTickerRef = useRef<MarketTicker>(DEFAULT_ETH);
  const xrpTickerRef = useRef<MarketTicker>(DEFAULT_XRP);

  // 1-Second Price Flash
  const prevPriceRef = useRef<number>(83674.0);
  const [priceTickDirection, setPriceTickDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  // TRADE HISTORY STATE
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);

  // ACTIVE SIGNALS: Maintained separately for BTC, ETH, XRP
  const [activeSignals, setActiveSignals] = useState<Record<AssetSymbol, SignalData | null>>({
    'BTC/USDT': null,
    'ETH/USDT': null,
    'XRP/USDT': null,
  });
  const activeSignalsRef = useRef<Record<AssetSymbol, SignalData | null>>({
    'BTC/USDT': null,
    'ETH/USDT': null,
    'XRP/USDT': null,
  });
  const [liveConfidence, setLiveConfidence] = useState<number>(88.4);

  // AI TRADING AGENT: Historical journal audit trail
  const [historicalJournals, setHistoricalJournals] = useState<AiTradeJournalEntry[]>([]);

  // BOT AI TRADING CONTROL
  const [isBotRunning, setIsBotRunning] = useState<boolean>(true);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isVipPaymentOpen, setIsVipPaymentOpen] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 6-DIGIT ACCESS ROLE: Guest vs Member vs Admin
  const [userRole, setUserRole] = useState<'GUEST' | 'MEMBER' | 'ADMIN'>(() => {
    try {
      const saved = localStorage.getItem('aurasignals_user_role');
      if (saved === 'ADMIN' || saved === 'MEMBER') return saved;
    } catch (e) {}
    return 'GUEST';
  });
  const [isAccessModalOpen, setIsAccessModalOpen] = useState<boolean>(false);

  // Cloud Firestore subscriptions
  useEffect(() => {
    const unsubscribeTrades = subscribeToClosedTrades((trades) => {
      setClosedTrades(trades);
    });

    const unsubscribeBot = subscribeToBotControl((running) => {
      setIsBotRunning(running);
    });

    return () => {
      unsubscribeTrades();
      unsubscribeBot();
    };
  }, []);

  // 1-second BTC tick fetcher
  const fetchBtcData = useCallback(async () => {
    if (typeof window !== 'undefined' && !window.location.hostname.includes('github.io')) {
      try {
        const res = await fetch('/api/market/btc?interval=1h');
        if (res.ok) {
          const data = await res.json();
          setBtcTicker(data);
          btcTickerRef.current = data;
          handleIncomingPrice('BTC/USDT', data.price);
          return;
        }
      } catch (e) {}
    }

    try {
      const res = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT');
      if (res.ok) {
        const t = await res.json();
        const price = Math.round(parseFloat(t.lastPrice) * 100) / 100 || 83650.0;
        const change24h = Math.round(parseFloat(t.priceChange) * 100) / 100 || 0;
        const changePercent = Math.round(parseFloat(t.priceChangePercent) * 100) / 100 || 0;
        const high24h = Math.round(parseFloat(t.highPrice) * 100) / 100 || price + 400;
        const low24h = Math.round(parseFloat(t.lowPrice) * 100) / 100 || price - 400;
        const fallbackData: MarketTicker = {
          symbol: 'BTC/USDT',
          name: 'Bitcoin / Tether USD',
          price,
          change24h,
          changePercent,
          high24h,
          low24h,
          bid: Math.round((price - 0.5) * 100) / 100,
          ask: Math.round((price + 0.5) * 100) / 100,
          spread: 1.0,
          candles: [],
          timestamp: Date.now(),
        };
        setBtcTicker(fallbackData);
        btcTickerRef.current = fallbackData;
        handleIncomingPrice('BTC/USDT', price);
      }
    } catch (err) {}
  }, []);

  // 1-second ETH tick fetcher
  const fetchEthData = useCallback(async () => {
    if (typeof window !== 'undefined' && !window.location.hostname.includes('github.io')) {
      try {
        const res = await fetch('/api/market/eth?interval=1h');
        if (res.ok) {
          const data = await res.json();
          setEthTicker(data);
          ethTickerRef.current = data;
          handleIncomingPrice('ETH/USDT', data.price);
          return;
        }
      } catch (e) {}
    }

    try {
      const res = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=ETHUSDT');
      if (res.ok) {
        const t = await res.json();
        const price = Math.round(parseFloat(t.lastPrice) * 100) / 100 || 2542.0;
        const change24h = Math.round(parseFloat(t.priceChange) * 100) / 100 || 0;
        const changePercent = Math.round(parseFloat(t.priceChangePercent) * 100) / 100 || 0;
        const high24h = Math.round(parseFloat(t.highPrice) * 100) / 100 || price + 25;
        const low24h = Math.round(parseFloat(t.lowPrice) * 100) / 100 || price - 25;
        const fallbackData: MarketTicker = {
          symbol: 'ETH/USDT',
          name: 'Ethereum / Tether USD',
          price,
          change24h,
          changePercent,
          high24h,
          low24h,
          bid: Math.round((price - 0.05) * 100) / 100,
          ask: Math.round((price + 0.05) * 100) / 100,
          spread: 0.1,
          candles: [],
          timestamp: Date.now(),
        };
        setEthTicker(fallbackData);
        ethTickerRef.current = fallbackData;
        handleIncomingPrice('ETH/USDT', price);
      }
    } catch (err) {}
  }, []);

  // 1-second XRP tick fetcher
  const fetchXrpData = useCallback(async () => {
    if (typeof window !== 'undefined' && !window.location.hostname.includes('github.io')) {
      try {
        const res = await fetch('/api/market/xrp?interval=1h');
        if (res.ok) {
          const data = await res.json();
          setXrpTicker(data);
          xrpTickerRef.current = data;
          handleIncomingPrice('XRP/USDT', data.price);
          return;
        }
      } catch (e) {}
    }

    try {
      const res = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=XRPUSDT');
      if (res.ok) {
        const t = await res.json();
        const price = parseFloat(t.lastPrice) || 1.3820;
        const change24h = parseFloat(t.priceChange) || 0;
        const changePercent = parseFloat(t.priceChangePercent) || 0;
        const high24h = parseFloat(t.highPrice) || price + 0.04;
        const low24h = parseFloat(t.lowPrice) || price - 0.04;
        const fallbackData: MarketTicker = {
          symbol: 'XRP/USDT',
          name: 'Ripple / Tether USD',
          price,
          change24h,
          changePercent,
          high24h,
          low24h,
          bid: price - 0.0002,
          ask: price + 0.0002,
          spread: 0.0004,
          candles: [],
          timestamp: Date.now(),
        };
        setXrpTicker(fallbackData);
        xrpTickerRef.current = fallbackData;
        handleIncomingPrice('XRP/USDT', price);
      }
    } catch (err) {}
  }, []);

  // ========================================================
  // CORE ENGINE: HIT TP / HIT SL LIFECYCLE MONITORING
  // ========================================================
  const handleIncomingPrice = (asset: AssetSymbol, newPrice: number) => {
    if (!newPrice) return;

    if (asset === selectedAsset) {
      if (prevPriceRef.current > 0) {
        if (newPrice > prevPriceRef.current) {
          setPriceTickDirection('up');
          setLiveConfidence((prev) => Math.min(94.5, Math.round((prev + 0.15) * 10) / 10));
        } else if (newPrice < prevPriceRef.current) {
          setPriceTickDirection('down');
          setLiveConfidence((prev) => Math.max(68.0, Math.round((prev - 0.15) * 10) / 10));
        }
        setTimeout(() => setPriceTickDirection('neutral'), 450);
      }
      prevPriceRef.current = newPrice;
    }

    const sig = activeSignalsRef.current[asset];
    if (sig && sig.status === 'RUNNING') {
      const hitType = checkSignalHit(sig, newPrice);
      if (hitType) {
        const isWin = hitType === 'HIT_TP';
        const isBuy = sig.signal.includes('BUY');
        const avgEntry = sig.entryPrice || (sig.entryRange.min + sig.entryRange.max) / 2;
        const exitPrice = isWin ? sig.takeProfit[0].price : sig.stopLoss.price;

        const diff = isBuy ? exitPrice - avgEntry : avgEntry - exitPrice;
        const pnlPercent = Math.round((diff / avgEntry) * 100 * 100) / 100;
        const pnlPips =
          asset === 'XRP/USDT'
            ? Math.round(diff * 10000)
            : Math.round(diff);

        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} UTC`;

        const wave = generateWavePoints(avgEntry, exitPrice, hitType);

        const closedTradeItem: ClosedTrade = {
          id: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          dateStr,
          timeStr,
          asset,
          direction: isBuy ? 'BUY' : 'SELL',
          entryPrice: avgEntry,
          exitPrice,
          hitType,
          pnlPercent,
          pnlPips,
          waveTrajectory: wave,
          timestamp: Date.now(),
        };

        setClosedTrades((prev) => {
          const updated = [closedTradeItem, ...prev];
          try {
            localStorage.setItem('aurasignals_closed_trades', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        saveClosedTradeToCloud(closedTradeItem);

        // AI Journal Audit
        const completedJournal: AiTradeJournalEntry = {
          id: `journal-eval-${Date.now()}`,
          timestamp: Date.now(),
          timeStr,
          asset,
          action: isBuy ? 'BUY' : 'SELL',
          confidence: sig.confidencePercent || 88.5,
          setupRationale: isWin
            ? `Target hit cleanly (+${Math.abs(pnlPips)} pts). Setup validated according to projected institutional liquidity.`
            : `Invalidation reached (-${Math.abs(pnlPips)} pts). Hard Stop Loss protected trading capital under 1.5% max risk rule.`,
          riskGuard: {
            maxCapitalRiskDollar: asset === 'BTC/USDT' ? Math.abs(diff) * 0.02 : asset === 'ETH/USDT' ? Math.abs(diff) * 0.5 : Math.abs(diff) * 1000,
            riskPercent: 1.5,
            targetRewardRatio: sig.stopLoss.riskRewardRatio || '1:2.0',
            invalidationPrice: exitPrice,
          },
          technicalEvidence: {
            marketStructure: isWin ? 'Target Hit (Expansion Complete)' : 'Stop Out (Capital Protected)',
            keyLevel: `Exit Price $${exitPrice.toLocaleString()}`,
            momentumSignal: isWin ? 'Full Take Profit Realized' : 'Max Drawdown Prevented',
          },
          agentCycle: 'JOURNAL',
          outcomeNote: isWin
            ? `✅ Win: Hit TP (+${Math.abs(pnlPips)} pts)`
            : `🛑 Controlled Loss: Hit SL (-${Math.abs(pnlPips)} pts)`,
        };
        setHistoricalJournals((prev) => {
          const updatedJournals = [completedJournal, ...prev.slice(0, 9)];
          try {
            localStorage.setItem('aurasignals_ai_journals', JSON.stringify(updatedJournals));
          } catch (e) {}
          return updatedJournals;
        });

        saveJournalEntryToCloud(completedJournal);

        if (isWin) {
          showToast(`🎯 ${asset} HIT TP! (+${Math.abs(pnlPips)} pts). New signal active!`);
        } else {
          showToast(`🛑 ${asset} HIT SL! (-${Math.abs(pnlPips)} pts). New signal active!`);
        }

        if (!isBotRunning) {
          activeSignalsRef.current[asset] = null;
          setActiveSignals({ ...activeSignalsRef.current });
          showToast(`AI Trading Bot paused by Admin.`);
          return;
        }

        const ticker =
          asset === 'BTC/USDT' ? btcTickerRef.current : asset === 'ETH/USDT' ? ethTickerRef.current : xrpTickerRef.current;
        const candles = ticker?.candles || [];
        const freshSignal = generateInstantSignal(asset, '1h', newPrice, candles);
        activeSignalsRef.current[asset] = freshSignal;
        setActiveSignals({ ...activeSignalsRef.current });
      }
    }
  };

  // Immediate fetch & interval loop for real-time Binance ticks
  useEffect(() => {
    fetchBtcData();
    fetchEthData();
    fetchXrpData();

    const interval = setInterval(() => {
      fetchBtcData();
      fetchEthData();
      fetchXrpData();
    }, 1200);

    return () => clearInterval(interval);
  }, [fetchBtcData, fetchEthData, fetchXrpData]);

  // Micro-fluctuation jitter simulation
  useEffect(() => {
    const microTickInterval = setInterval(() => {
      const ticker =
        selectedAsset === 'BTC/USDT'
          ? btcTickerRef.current
          : selectedAsset === 'ETH/USDT'
          ? ethTickerRef.current
          : xrpTickerRef.current;
      if (!ticker || !ticker.price) return;

      const delta =
        selectedAsset === 'BTC/USDT'
          ? (Math.random() - 0.49) * 2.2
          : selectedAsset === 'ETH/USDT'
          ? (Math.random() - 0.49) * 0.25
          : (Math.random() - 0.49) * 0.0004;

      const decimals = selectedAsset === 'XRP/USDT' ? 4 : 2;
      const updatedPrice = parseFloat((ticker.price + delta).toFixed(decimals));

      if (updatedPrice > ticker.price) {
        setPriceTickDirection('up');
      } else if (updatedPrice < ticker.price) {
        setPriceTickDirection('down');
      }
      setTimeout(() => setPriceTickDirection('neutral'), 400);

      ticker.price = updatedPrice;
      if (selectedAsset === 'BTC/USDT') setBtcTicker({ ...ticker });
      else if (selectedAsset === 'ETH/USDT') setEthTicker({ ...ticker });
      else setXrpTicker({ ...ticker });

      prevPriceRef.current = updatedPrice;
      handleIncomingPrice(selectedAsset, updatedPrice);
    }, 1000);

    return () => clearInterval(microTickInterval);
  }, [selectedAsset]);

  const currentTicker =
    selectedAsset === 'BTC/USDT' ? btcTicker : selectedAsset === 'ETH/USDT' ? ethTicker : xrpTicker;
  const currentPrice = currentTicker?.price || (selectedAsset === 'BTC/USDT' ? 83040 : selectedAsset === 'ETH/USDT' ? 2540 : 1.38);

  // Initialize signals for all 3 assets
  useEffect(() => {
    if (!isBotRunning) return;

    (['BTC/USDT', 'ETH/USDT', 'XRP/USDT'] as AssetSymbol[]).forEach((asset) => {
      const ticker =
        asset === 'BTC/USDT' ? btcTicker : asset === 'ETH/USDT' ? ethTicker : xrpTicker;
      const fallbackPrice = asset === 'BTC/USDT' ? 83040 : asset === 'ETH/USDT' ? 2540 : 1.38;
      const basePrice = ticker?.price || fallbackPrice;
      const candles = ticker?.candles || [];

      const existingSig = activeSignalsRef.current[asset];
      const needsRecalibration = !existingSig;

      if (needsRecalibration) {
        const sig = generateInstantSignal(asset, '1h', basePrice, candles);
        activeSignalsRef.current[asset] = sig;
      }
    });
    setActiveSignals({ ...activeSignalsRef.current });
  }, [btcTicker, ethTicker, xrpTicker, isBotRunning]);

  // Admin Control Actions
  const handleForceCloseSignal = (asset: AssetSymbol, hitType: 'HIT_TP' | 'HIT_SL') => {
    const sig = activeSignalsRef.current[asset];
    if (!sig) return;
    const targetPrice = hitType === 'HIT_TP' ? sig.takeProfit[0].price : sig.stopLoss.price;
    handleIncomingPrice(asset, targetPrice);
    showToast(`Position ${asset} force closed by Admin (${hitType}).`);
  };

  const handleAddManualSignal = (newSignal: SignalData) => {
    activeSignalsRef.current[newSignal.asset] = newSignal;
    setActiveSignals({ ...activeSignalsRef.current });
    showToast(`Manual signal ${newSignal.asset} (${newSignal.signal}) published.`);
  };

  const handleResetAllHistory = () => {
    setClosedTrades([]);
    setHistoricalJournals([]);
    try {
      localStorage.removeItem('aurasignals_closed_trades');
      localStorage.removeItem('aurasignals_ai_journals');
    } catch (e) {}
    clearAllTradesInCloud().catch(() => {});
    showToast('All trade history cleared (Fresh Start 0 Trades).');
  };

  const activeSignal = activeSignals[selectedAsset] || activeSignalsRef.current[selectedAsset];

  const currentJournal = useMemo(() => {
    return generateLiveJournalEntry(activeSignal, currentPrice);
  }, [activeSignal, currentPrice]);

  return (
    <div className="relative min-h-screen bg-[#020b0e] text-white font-sans selection:bg-teal-500/20 selection:text-teal-200 pb-24 overflow-x-hidden">
      {/* Ambient Radial Light Glow Gradients */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-teal-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-1/3 -left-32 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-32 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-80 z-50 p-3.5 glass-panel rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs text-white animate-in slide-in-from-top-2 border border-teal-500/30">
          <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
          <p className="font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Main Container Frame */}
      <div className="relative z-10 max-w-md mx-auto px-3 sm:px-4 pt-3 space-y-3">
        {/* Top Header Utilities Strip */}
        <div className="flex items-center justify-between text-xs text-teal-400/80 px-1 font-mono">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
            <span>
              {activeSection === 'chart'
                ? 'AURASIGNALS · LIVE SIGNALS'
                : activeSection === 'daily_pnl'
                ? 'AURASIGNALS · DAILY PNL'
                : activeSection === 'accuracy'
                ? 'AURASIGNALS · PERFORMANCE'
                : 'AURASIGNALS · ANALYTIC CHARTS'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* VIP Upgrade Button */}
            {userRole === 'GUEST' && (
              <button
                onClick={() => setIsVipPaymentOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-gradient-to-r from-amber-500/25 via-teal-500/20 to-emerald-500/25 text-amber-300 border border-amber-400/40 hover:border-amber-300 transition-all cursor-pointer shadow-md shadow-amber-500/10 active:scale-95"
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span>JOIN VIP</span>
              </button>
            )}

            {/* Admin Control Panel Button */}
            {userRole === 'ADMIN' && (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all cursor-pointer shadow-sm shadow-amber-500/20"
                title="Open Admin Control Panel"
              >
                <Sliders className="w-3 h-3 text-amber-400" />
                <span>ADMIN PANEL</span>
              </button>
            )}

            {/* 6-Digit Access PIN Button */}
            <button
              onClick={() => setIsAccessModalOpen(true)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer ${
                userRole === 'ADMIN'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
                  : userRole === 'MEMBER'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
              title="Enter Access PIN"
            >
              {userRole === 'ADMIN' ? (
                <>
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>ADMIN</span>
                </>
              ) : userRole === 'MEMBER' ? (
                <>
                  <UserCheck className="w-3 h-3 text-emerald-400" />
                  <span>VIP</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3 h-3 text-teal-400" />
                  <span>PIN</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                showToast(!soundEnabled ? 'Sound alerts enabled' : 'Sound alerts muted');
              }}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Toggle Sound"
            >
              {soundEnabled ? <Bell className="w-3.5 h-3.5 text-teal-400" /> : <BellOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Bot Paused Banner */}
        {!isBotRunning && (
          <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold flex items-center justify-between animate-pulse">
            <span>⚠️ AI TRADING BOT PAUSED BY ADMIN</span>
            {userRole === 'ADMIN' && (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="underline hover:text-white cursor-pointer text-[11px]"
              >
                Resume Bot
              </button>
            )}
          </div>
        )}

        {/* TAB 1: Sinyal Live */}
        {activeSection === 'chart' && (
          <div className="space-y-3">
            {/* Asset Header with switcher for BTC, ETH, XRP */}
            <AssetHero
              selectedAsset={selectedAsset}
              onSelectAsset={(asset) => {
                setSelectedAsset(asset);
                prevPriceRef.current = 0;
              }}
              currentTicker={currentTicker}
              priceTickDirection={priceTickDirection}
            />

            {/* Sinyal Aktif Card & AI Trade Journal Card */}
            {userRole === 'GUEST' ? (
              <div className="relative">
                <div className="space-y-3 filter blur-[7px] select-none pointer-events-none opacity-60">
                  <TpProgressCard
                    signal={activeSignal}
                    currentPrice={currentPrice}
                    liveConfidence={liveConfidence}
                  />
                  <AiTradeJournalCard
                    currentJournal={currentJournal}
                    historicalJournals={historicalJournals}
                  />
                </div>

                <GuestSignalLock
                  onOpenAccessModal={() => setIsAccessModalOpen(true)}
                  onOpenVipPayment={() => setIsVipPaymentOpen(true)}
                />
              </div>
            ) : (
              <>
                <TpProgressCard
                  signal={activeSignal}
                  currentPrice={currentPrice}
                  liveConfidence={liveConfidence}
                />
                <AiTradeJournalCard
                  currentJournal={currentJournal}
                  historicalJournals={historicalJournals}
                />
              </>
            )}

            {/* Live Portfolio */}
            <OwnerLivePortfolio
              currentSignal={activeSignal}
              currentPrice={currentPrice}
              selectedAsset={selectedAsset}
              closedTrades={closedTrades}
              priceTickDirection={priceTickDirection}
              userRole={userRole}
              onOpenAccessModal={() => setIsVipPaymentOpen(true)}
            />
          </div>
        )}

        {/* TAB 2: Daily PNL */}
        {activeSection === 'daily_pnl' && (
          <div className="space-y-4 pt-1">
            <DailyPnlView trades={closedTrades} />
          </div>
        )}

        {/* TAB 3: Performance */}
        {activeSection === 'accuracy' && (
          <div className="space-y-4 pt-1">
            <SignalHistoryTable trades={closedTrades} />
          </div>
        )}

        {/* TAB 4: Analytic Charts */}
        {activeSection === 'analytics' && (
          <div className="space-y-4 pt-1">
            <AnalyticChartsView
              selectedAsset={selectedAsset}
              onSelectAsset={(asset) => setSelectedAsset(asset)}
              currentTicker={currentTicker}
              userRole={userRole}
              onOpenVipModal={() => setIsVipPaymentOpen(true)}
            />
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation Bar (4 Menus) */}
      <BottomNavBar
        activeSection={activeSection}
        onSelectSection={(sec) => setActiveSection(sec)}
      />

      {/* 6-Digit PIN Modal */}
      <AccessCodeModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        currentRole={userRole}
        onRoleChange={(newRole) => {
          setUserRole(newRole);
          try {
            localStorage.setItem('aurasignals_user_role', newRole);
          } catch (e) {}
          showToast(
            newRole === 'ADMIN'
              ? '👑 Admin access verified'
              : newRole === 'MEMBER'
              ? '⭐ VIP Member access active'
              : 'Switched to Guest mode.'
          );
        }}
        onOpenVipPayment={() => setIsVipPaymentOpen(true)}
      />

      {/* VIP Payment Modal (QRIS & USDT) */}
      <VipPaymentModal
        isOpen={isVipPaymentOpen}
        onClose={() => setIsVipPaymentOpen(false)}
        onOpenAccessModal={() => setIsAccessModalOpen(true)}
      />

      {/* Admin Control Modal */}
      <AdminControlModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isBotRunning={isBotRunning}
        onToggleBot={(running) => {
          setIsBotRunning(running);
          showToast(
            running
              ? '▶️ AI Trading Bot Started.'
              : '⏸️ AI Trading Bot Paused by Admin.'
          );
        }}
        activeSignals={activeSignals}
        onForceCloseSignal={handleForceCloseSignal}
        onAddManualSignal={handleAddManualSignal}
        onResetAllHistory={handleResetAllHistory}
        currentPrices={{ btc: btcTicker.price, eth: ethTicker.price, xrp: xrpTicker.price }}
      />
    </div>
  );
}
