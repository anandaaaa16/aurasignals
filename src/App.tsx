import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AssetSymbol, MarketTicker, SignalData, ClosedTrade } from './types';
import { generateInstantSignal, checkSignalHit, generateWavePoints, isGoldMarketOpen } from './utils/signalEngine';
import { INITIAL_TRADES } from './utils/initialTrades';
import { playAlertSound } from './utils/sound';
import { AssetHero } from './components/AssetHero';
import { ModernCandleChart } from './components/ModernCandleChart';
import { TpProgressCard } from './components/TpProgressCard';
import { SignalHistoryTable } from './components/SignalHistoryTable';
import { OwnerLivePortfolio } from './components/OwnerLivePortfolio';
import { DailyPnlView } from './components/DailyPnlView';
import { BottomNavBar, NavSection } from './components/BottomNavBar';
import { AiTradeJournalCard } from './components/AiTradeJournalCard';
import { AccessCodeModal } from './components/AccessCodeModal';
import { GuestSignalLock } from './components/GuestSignalLock';
import { AdminControlModal } from './components/AdminControlModal';
import { generateLiveJournalEntry, INITIAL_AI_JOURNALS } from './utils/aiTradingAgent';
import {
  subscribeToClosedTrades,
  saveClosedTradeToCloud,
  saveJournalEntryToCloud,
  testFirestoreConnection,
  subscribeToBotControl,
  clearAllTradesInCloud,
} from './utils/tradeDbService';
import { AiTradeJournalEntry } from './types';
import { Sparkles, Bell, BellOff, KeyRound, Crown, UserCheck, Sliders } from 'lucide-react';

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

const DEFAULT_XAU: MarketTicker = {
  symbol: 'XAU/USD',
  name: 'Gold Spot / US Dollar',
  price: 4191.5,
  change24h: 4.5,
  changePercent: 0.11,
  high24h: 4198.0,
  low24h: 4182.0,
  bid: 4191.3,
  ask: 4191.7,
  spread: 0.4,
  candles: [],
  timestamp: Date.now(),
};

const CLOUD_API_BASE = 'https://ais-dev-nlprz5n5jrknbcv3r6n6vn-86391396603.asia-southeast1.run.app';

export default function App() {
  // Navigation: Sinyal Live vs Daily PNL vs Akurasi Signal
  const [activeSection, setActiveSection] = useState<NavSection>('chart');
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>('BTC/USDT');

  // Sound Alerts
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Market Data (Always initialized with real baseline, never null)
  const [xauTicker, setXauTicker] = useState<MarketTicker>(DEFAULT_XAU);
  const [btcTicker, setBtcTicker] = useState<MarketTicker>(DEFAULT_BTC);
  const xauTickerRef = useRef<MarketTicker>(DEFAULT_XAU);
  const btcTickerRef = useRef<MarketTicker>(DEFAULT_BTC);

  // 1-Second Price Flash (Kedip Hijau saat naik, Kedip Merah saat turun)
  const prevPriceRef = useRef<number>(83674.0);
  const [priceTickDirection, setPriceTickDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  // TRADE HISTORY STATE (Fresh Start - Bersih mulai hari ini)
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);

  // ACTIVE SIGNALS: Maintained separately for BTC and XAU on H1 timeframe
  const [activeSignals, setActiveSignals] = useState<Record<AssetSymbol, SignalData | null>>({
    'BTC/USDT': null,
    'XAU/USD': null,
  });
  const activeSignalsRef = useRef<Record<AssetSymbol, SignalData | null>>({
    'BTC/USDT': null,
    'XAU/USD': null,
  });
  const [liveConfidence, setLiveConfidence] = useState<number>(88.4);

  // AI TRADING AGENT: Historical journal audit trail
  const [historicalJournals, setHistoricalJournals] = useState<AiTradeJournalEntry[]>([]);

  // BOT AI TRADING CONTROL: Running 24/7 vs Paused/Stopped by Admin
  const [isBotRunning, setIsBotRunning] = useState<boolean>(true);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);

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

  // Clean obsolete mock data from localStorage once on boot
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aurasignals_closed_trades');
      if (saved && (saved.includes('trade-init') || saved.includes('trade-hist'))) {
        localStorage.removeItem('aurasignals_closed_trades');
        localStorage.removeItem('aurasignals_ai_journals');
      }
    } catch (e) {}
  }, []);

  // REAL-TIME FIRESTORE SYNC: Synchronize closed trades across all devices
  useEffect(() => {
    testFirestoreConnection();
    const unsubscribeTrades = subscribeToClosedTrades((remoteTrades) => {
      setClosedTrades(remoteTrades || []);
    });
    const unsubscribeBot = subscribeToBotControl((running) => {
      setIsBotRunning(running);
    });
    return () => {
      unsubscribeTrades();
      unsubscribeBot();
    };
  }, []);

  // 1-second Gold tick fetcher (supports Cloud, GitHub Pages, & public exchange feeds)
  const fetchXauData = useCallback(async () => {
    // 1. If on full-stack server (not GitHub Pages), use local server
    if (typeof window !== 'undefined' && !window.location.hostname.includes('github.io')) {
      try {
        const res = await fetch('/api/market/xau?interval=1h');
        if (res.ok) {
          const data = await res.json();
          setXauTicker(data);
          xauTickerRef.current = data;
          handleIncomingPrice('XAU/USD', data.price);
          return;
        }
      } catch (e) {}
    }

    // 2. Official Binance Vision public data mirror (open CORS, global, unblocked)
    try {
      const res = await fetch('https://data-api.binance.vision/api/v3/ticker/24hr?symbol=PAXGUSDT');
      if (res.ok) {
        const t = await res.json();
        const price = Math.round(parseFloat(t.lastPrice) * 100) / 100 || 4196.25;
        const change24h = Math.round(parseFloat(t.priceChange) * 100) / 100 || 0;
        const changePercent = Math.round(parseFloat(t.priceChangePercent) * 100) / 100 || 0;
        const high24h = Math.round(parseFloat(t.highPrice) * 100) / 100 || price + 8;
        const low24h = Math.round(parseFloat(t.lowPrice) * 100) / 100 || price - 8;
        const fallbackData: MarketTicker = {
          symbol: 'XAU/USD',
          name: 'Gold Spot / US Dollar',
          price,
          change24h,
          changePercent,
          high24h,
          low24h,
          bid: Math.round((price - 0.2) * 100) / 100,
          ask: Math.round((price + 0.2) * 100) / 100,
          spread: 0.4,
          candles: [],
          timestamp: Date.now(),
        };
        setXauTicker(fallbackData);
        xauTickerRef.current = fallbackData;
        handleIncomingPrice('XAU/USD', price);
        return;
      }
    } catch (err) {}

    // 3. Fallback to Coinbase Exchange (Tier-1, global open CORS)
    try {
      const res = await fetch('https://api.exchange.coinbase.com/products/PAXG-USD/ticker');
      if (res.ok) {
        const t = await res.json();
        const price = Math.round(parseFloat(t.price) * 100) / 100 || 4196.25;
        const fallbackData: MarketTicker = {
          symbol: 'XAU/USD',
          name: 'Gold Spot / US Dollar',
          price,
          change24h: 14.5,
          changePercent: 0.35,
          high24h: Math.round((price + 8) * 100) / 100,
          low24h: Math.round((price - 8) * 100) / 100,
          bid: Math.round((price - 0.2) * 100) / 100,
          ask: Math.round((price + 0.2) * 100) / 100,
          spread: 0.4,
          candles: [],
          timestamp: Date.now(),
        };
        setXauTicker(fallbackData);
        xauTickerRef.current = fallbackData;
        handleIncomingPrice('XAU/USD', price);
      }
    } catch (err) {
      console.warn('Failed to fetch fallback XAU data', err);
    }
  }, []);

  // 1-second BTC tick fetcher (supports Cloud, GitHub Pages, & public exchange feeds)
  const fetchBtcData = useCallback(async () => {
    // 1. If on full-stack server (not GitHub Pages), use local server
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

    // 2. Official Binance Vision public data mirror (open CORS, global, unblocked)
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
        return;
      }
    } catch (err) {}

    // 3. Fallback to Coinbase Exchange (Tier-1, global open CORS)
    try {
      const res = await fetch('https://api.exchange.coinbase.com/products/BTC-USD/ticker');
      if (res.ok) {
        const t = await res.json();
        const price = Math.round(parseFloat(t.price) * 100) / 100 || 83650.0;
        const fallbackData: MarketTicker = {
          symbol: 'BTC/USDT',
          name: 'Bitcoin / Tether USD',
          price,
          change24h: 680.0,
          changePercent: 0.82,
          high24h: Math.round((price + 450) * 100) / 100,
          low24h: Math.round((price - 450) * 100) / 100,
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
    } catch (err) {
      console.warn('Failed to fetch fallback BTC data', err);
    }
  }, []);

  // ========================================================
  // CORE ENGINE: HIT TP / HIT SL LIFECYCLE MONITORING
  // If price hits TP or SL -> close trade, log history, open fresh signal!
  // ========================================================
  const handleIncomingPrice = (asset: AssetSymbol, newPrice: number) => {
    if (!newPrice) return;

    // Visual tick highlight with rapid 1-second flash
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

    // Check TP / SL Hit on active signal
    const sig = activeSignalsRef.current[asset];
    if (sig && sig.status === 'RUNNING') {
      const hitType = checkSignalHit(sig, newPrice);
      if (hitType) {
        const isWin = hitType === 'HIT_TP';
        const isBuy = sig.signal.includes('BUY');
        const avgEntry = sig.entryPrice || (sig.entryRange.min + sig.entryRange.max) / 2;
        const exitPrice = isWin ? sig.takeProfit[0].price : sig.stopLoss.price;
        const isGold = asset === 'XAU/USD';

        const diff = isBuy ? exitPrice - avgEntry : avgEntry - exitPrice;
        const pnlPercent = Math.round((diff / avgEntry) * 100 * 100) / 100;
        const pnlPips = isGold ? Math.round(diff * 10) : Math.round(diff);

        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} WIB`;

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

        // Append to closed trades & persist
        setClosedTrades((prev) => {
          const updated = [closedTradeItem, ...prev];
          try {
            localStorage.setItem('aurasignals_closed_trades', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });

        // Persist to Firebase Firestore (Real-Time Cloud Synchronization!)
        saveClosedTradeToCloud(closedTradeItem);

        // Record to AI Trade Journal Audit Trail (MindStudio Pattern)
        if (sig) {
          const completedJournal: AiTradeJournalEntry = {
            id: `journal-eval-${Date.now()}`,
            timestamp: Date.now(),
            timeStr,
            asset,
            action: isBuy ? 'BUY' : 'SELL',
            confidence: sig.confidencePercent || 88.5,
            setupRationale: isWin
              ? `Target hit cleanly (+${Math.abs(pnlPips)} ${isGold ? 'pips' : 'pts'}). Setup validated according to projected liquidity expansion.`
              : `Invalidation reached (-${Math.abs(pnlPips)} ${isGold ? 'pips' : 'pts'}). Hard Stop Loss protected trading capital under 1.5% max risk rule.`,
            riskGuard: {
              maxCapitalRiskDollar: isGold ? Math.abs(diff) * 5 : Math.abs(diff) * 0.02,
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
              ? `✅ Win: Hit TP (+${Math.abs(pnlPips)} ${isGold ? 'pips' : 'pts'})`
              : `🛑 Controlled Loss: Hit SL (-${Math.abs(pnlPips)} ${isGold ? 'pips' : 'pts'})`,
          };
          setHistoricalJournals((prev) => {
            const updatedJournals = [completedJournal, ...prev.slice(0, 9)];
            try {
              localStorage.setItem('aurasignals_ai_journals', JSON.stringify(updatedJournals));
            } catch (e) {}
            return updatedJournals;
          });

          // Persist journal entry to Firebase Firestore
          saveJournalEntryToCloud(completedJournal);
        }

        // Audio Alert
        if (soundEnabled) playAlertSound(isWin ? 'tp' : 'sl');

        // Toast Alert
        if (isWin) {
          showToast(`🎯 ${asset} HIT TP! (+${Math.abs(pnlPips)} ${isGold ? 'pips' : 'pts'}). New signal active!`);
        } else {
          showToast(`🛑 ${asset} HIT SL! (-${Math.abs(pnlPips)} ${isGold ? 'pips' : 'pts'}). New signal active!`);
        }

        // Open fresh H1 signal for this asset (ONLY if market is open AND bot is running!)
        if (asset === 'XAU/USD' && !isGoldMarketOpen().isOpen) {
          activeSignalsRef.current[asset] = null;
          setActiveSignals({ ...activeSignalsRef.current });
          return;
        }

        if (!isBotRunning) {
          activeSignalsRef.current[asset] = null;
          setActiveSignals({ ...activeSignalsRef.current });
          showToast(`AI Trading Bot paused by Admin.`);
          return;
        }

        const ticker = asset === 'BTC/USDT' ? btcTickerRef.current : xauTickerRef.current;
        const candles = ticker?.candles || [];
        const freshSignal = generateInstantSignal(asset, '1h', newPrice, candles);
        activeSignalsRef.current[asset] = freshSignal;
        setActiveSignals({ ...activeSignalsRef.current });
      }
    }
  };

  // Immediate fetch & 1-second interval loop for fast TradingView-like ticks
  useEffect(() => {
    fetchBtcData();
    fetchXauData();

    const interval = setInterval(() => {
      fetchBtcData();
      fetchXauData();
    }, 1000);

    return () => clearInterval(interval);
  }, [fetchBtcData, fetchXauData]);

  // Micro-fluctuation simulator between remote ticks (creates realistic 1-second heartbeat)
  useEffect(() => {
    const microTickInterval = setInterval(() => {
      const isGold = selectedAsset === 'XAU/USD';
      const ticker = isGold ? xauTickerRef.current : btcTickerRef.current;
      if (!ticker || !ticker.price) return;

      // Realistic sub-pip market jitter
      const delta = isGold
        ? (Math.random() - 0.49) * 0.12
        : (Math.random() - 0.49) * 2.2;
      const updatedPrice = Math.round((ticker.price + delta) * 100) / 100;

      if (updatedPrice > ticker.price) {
        setPriceTickDirection('up');
      } else if (updatedPrice < ticker.price) {
        setPriceTickDirection('down');
      }
      setTimeout(() => setPriceTickDirection('neutral'), 400);

      ticker.price = updatedPrice;
      if (isGold) setXauTicker({ ...ticker });
      else setBtcTicker({ ...ticker });

      prevPriceRef.current = updatedPrice;
      handleIncomingPrice(selectedAsset, updatedPrice);
    }, 1000);

    return () => clearInterval(microTickInterval);
  }, [selectedAsset]);

  const currentTicker = selectedAsset === 'BTC/USDT' ? btcTicker : xauTicker;
  const currentPrice = currentTicker?.price || (selectedAsset === 'BTC/USDT' ? 83040 : 4189.5);
  const isGoldClosed = selectedAsset === 'XAU/USD' && !isGoldMarketOpen().isOpen;

  // Initialize or recalibrate signals for both assets
  useEffect(() => {
    const goldStatus = isGoldMarketOpen();

    (['BTC/USDT', 'XAU/USD'] as AssetSymbol[]).forEach((asset) => {
      // If XAU/USD is closed during weekend, close all positions & do not open new signal!
      if (asset === 'XAU/USD' && !goldStatus.isOpen) {
        activeSignalsRef.current['XAU/USD'] = null;
        return;
      }

      const ticker = asset === 'BTC/USDT' ? btcTicker : xauTicker;
      const fallbackPrice = asset === 'BTC/USDT' ? 83040 : 4189.5;
      const basePrice = ticker?.price || fallbackPrice;
      const candles = ticker?.candles || [];

      const existingSig = activeSignalsRef.current[asset];
      const needsRecalibration =
        !existingSig ||
        (asset === 'XAU/USD' && existingSig.entryRange.min < 3500) ||
        (ticker && Math.abs(existingSig.entryRange.min - ticker.price) > (asset === 'XAU/USD' ? 50 : 2000));

      if (!isBotRunning) {
        return;
      }

      if (needsRecalibration) {
        const sig = generateInstantSignal(asset, '1h', basePrice, candles);
        activeSignalsRef.current[asset] = sig;
      }
    });
    setActiveSignals({ ...activeSignalsRef.current });
  }, [btcTicker, xauTicker, isBotRunning]);

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

  // Current active signal for selected asset (strictly null if Gold market is closed!)
  const activeSignal = isGoldClosed ? null : (activeSignals[selectedAsset] || activeSignalsRef.current[selectedAsset]);

  // AI TRADING AGENT: Live trade journal entry
  const currentJournal = useMemo(() => {
    return generateLiveJournalEntry(activeSignal, currentPrice, isGoldClosed);
  }, [activeSignal, currentPrice, isGoldClosed]);

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
        {/* Top Header Utilities Strip: Running Status & Sound Toggle */}
        <div className="flex items-center justify-between text-xs text-teal-400/80 px-1 font-mono">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
            <span>
              {activeSection === 'chart'
                ? 'AURASIGNALS · LIVE SIGNALS (H1)'
                : activeSection === 'daily_pnl'
                ? 'AURASIGNALS · DAILY PNL'
                : 'AURASIGNALS · PERFORMANCE'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Admin Control Panel Button (Only visible if Admin) */}
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
              title="Access PIN"
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
                  <span>ENTER PIN</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                showToast(!soundEnabled ? 'Sound enabled' : 'Sound disabled');
              }}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Toggle Sound"
            >
              {soundEnabled ? <Bell className="w-3.5 h-3.5 text-teal-400" /> : <BellOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Bot Paused Banner (if Admin paused the bot) */}
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

        {/* TAB 1: Sinyal Live (Header BTC/XAU, Chart Simpel Elegan H1 + 1 TP & SL + Akun Live Owner) */}
        {activeSection === 'chart' && (
          <div className="space-y-3">
            {/* 1. Header with Big Asset Title (BTC / XAU), 1-Sec Kedip Flash Price, High/Low */}
            <AssetHero
              selectedAsset={selectedAsset}
              onSelectAsset={(asset) => {
                setSelectedAsset(asset);
                prevPriceRef.current = 0;
              }}
              currentTicker={currentTicker}
              priceTickDirection={priceTickDirection}
              isMarketClosed={isGoldClosed}
            />

            {/* 2. Sinyal Aktif Card & AI Trade Journal Card (BLURRED UNTUK GUEST, UNLOCKED UNTUK VIP & ADMIN) */}
            {userRole === 'GUEST' ? (
              <div className="relative">
                <div className="space-y-3 filter blur-[7px] select-none pointer-events-none opacity-60">
                  <TpProgressCard
                    signal={activeSignal}
                    currentPrice={currentPrice}
                    liveConfidence={liveConfidence}
                    isMarketClosed={isGoldClosed}
                  />
                  <AiTradeJournalCard
                    currentJournal={currentJournal}
                    historicalJournals={historicalJournals}
                    isMarketClosed={isGoldClosed}
                  />
                </div>

                <GuestSignalLock onOpenAccessModal={() => setIsAccessModalOpen(true)} />
              </div>
            ) : (
              <>
                <TpProgressCard
                  signal={activeSignal}
                  currentPrice={currentPrice}
                  liveConfidence={liveConfidence}
                  isMarketClosed={isGoldClosed}
                />
                <AiTradeJournalCard
                  currentJournal={currentJournal}
                  historicalJournals={historicalJournals}
                  isMarketClosed={isGoldClosed}
                />
              </>
            )}

            {/* Akun Live Owner (Live Trading - Modal Awal $500, Clean & Minimal) */}
            <OwnerLivePortfolio
              currentSignal={activeSignal}
              currentPrice={currentPrice}
              selectedAsset={selectedAsset}
              closedTrades={closedTrades}
              priceTickDirection={priceTickDirection}
              isMarketClosed={isGoldClosed}
            />
          </div>
        )}

        {/* TAB 2: Daily PNL (Menu Baru Rekap Laba/Rugi Harian) */}
        {activeSection === 'daily_pnl' && (
          <div className="space-y-4 pt-1">
            <DailyPnlView trades={closedTrades} />
          </div>
        )}

        {/* TAB 3: Akurasi Signal (Riwayat Sinyal & Win Rate Akurasi Langsung di Bawah Harga) */}
        {activeSection === 'accuracy' && (
          <div className="space-y-4 pt-1">
            <SignalHistoryTable trades={closedTrades} />
          </div>
        )}
      </div>

      {/* Floating Frosted Glass Bottom Navigation Bar (3 Menus) */}
      <BottomNavBar
        activeSection={activeSection}
        onSelectSection={(sec) => setActiveSection(sec)}
      />

      {/* 6-Digit PIN Modal for Admin & VIP Member Access */}
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
              ? '👑 Login Admin Berhasil!'
              : newRole === 'MEMBER'
              ? '⭐ Akses VIP Member Aktif!'
              : 'Beralih ke mode Guest.'
          );
        }}
      />

      {/* Admin Control Modal (Start/Stop Bot, Sinyal Manual, Fresh Start) */}
      <AdminControlModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        isBotRunning={isBotRunning}
        onToggleBot={(running) => {
          setIsBotRunning(running);
          showToast(
            running
              ? '▶️ Trading Bot AI Diaktifkan.'
              : '⏸️ Trading Bot AI Dihentikan oleh Admin.'
          );
        }}
        activeSignals={activeSignals}
        onForceCloseSignal={handleForceCloseSignal}
        onAddManualSignal={handleAddManualSignal}
        onResetAllHistory={handleResetAllHistory}
        currentPrices={{ btc: btcTicker.price, xau: xauTicker.price }}
      />
    </div>
  );
}
