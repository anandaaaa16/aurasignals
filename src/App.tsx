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
import { ManualTradeModal } from './components/ManualTradeModal';
import {
  subscribeToClosedTrades,
  saveClosedTradeToCloud,
  saveJournalEntryToCloud,
  subscribeToBotControl,
  subscribeToActiveSignals,
  saveActiveSignalsToCloud,
  clearAllTradesInCloud,
} from './utils/tradeDbService';
import { generateInstantSignal, checkSignalHit, generateWavePoints } from './utils/signalEngine';
import { generateLiveJournalEntry } from './utils/aiTradingAgent';
import { playAlertSound } from './utils/sound';
import { Bell, BellOff, Crown, UserCheck, KeyRound, Sliders, Sparkles, Zap } from 'lucide-react';

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

  // TRADE HISTORY STATE - Clean start (0 trades)
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>(() => {
    try {
      const raw = localStorage.getItem('aurasignals_closed_trades');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });

  // ACTIVE SIGNALS: Maintained with Persistent Storage (Clean start - 0 open positions)
  const [activeSignals, setActiveSignals] = useState<Record<AssetSymbol, SignalData | null>>(() => {
    try {
      const raw = localStorage.getItem('aurasignals_active_signals');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (e) {}
    return {
      'BTC/USDT': null,
      'ETH/USDT': null,
      'XRP/USDT': null,
    };
  });

  const activeSignalsRef = useRef<Record<AssetSymbol, SignalData | null>>(activeSignals);

  const [liveConfidence, setLiveConfidence] = useState<number>(88.4);

  // AI TRADING AGENT: Historical journal audit trail
  const [historicalJournals, setHistoricalJournals] = useState<AiTradeJournalEntry[]>(() => {
    try {
      const raw = localStorage.getItem('aurasignals_ai_journals');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });

  // BOT AI TRADING CONTROL - Default Paused / False so User Can Do Manual Trading
  const [isBotRunning, setIsBotRunning] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isVipPaymentOpen, setIsVipPaymentOpen] = useState<boolean>(false);
  const [isManualTradeModalOpen, setIsManualTradeModalOpen] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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

  // Persistent Active Signals Helper
  const updateAndPersistSignals = useCallback((newSignals: Record<AssetSymbol, SignalData | null>) => {
    activeSignalsRef.current = newSignals;
    setActiveSignals(newSignals);
    try {
      localStorage.setItem('aurasignals_active_signals', JSON.stringify(newSignals));
    } catch (e) {}
    saveActiveSignalsToCloud(newSignals).catch(() => {});
  }, []);

  // Cloud Firestore subscriptions (Closed trades, Active positions, Bot state)
  useEffect(() => {
    const unsubscribeTrades = subscribeToClosedTrades((trades) => {
      setClosedTrades(trades);
    });

    const unsubscribeBot = subscribeToBotControl((running) => {
      setIsBotRunning(running);
    });

    const unsubscribeSignals = subscribeToActiveSignals((cloudSignals) => {
      if (cloudSignals && typeof cloudSignals === 'object') {
        activeSignalsRef.current = cloudSignals;
        setActiveSignals(cloudSignals);
        try {
          localStorage.setItem('aurasignals_active_signals', JSON.stringify(cloudSignals));
        } catch (e) {}
      }
    });

    return () => {
      unsubscribeTrades();
      unsubscribeBot();
      unsubscribeSignals();
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

        // 10x Crypto Futures ROE % and USDT Gain
        const dir = isBuy ? 1 : -1;
        const priceMovePct = avgEntry > 0 ? ((exitPrice - avgEntry) / avgEntry) * dir : 0;
        const leverage = 10;
        const marginUsdt = sig.recommendedMarginUsdt || 150.0;
        const roePercent = Math.round(priceMovePct * leverage * 100 * 10) / 10;
        const gainUsdt = Math.round(marginUsdt * (roePercent / 100) * 100) / 100;
        const pnlPips = Math.round(Math.abs(exitPrice - avgEntry));

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
          leverage,
          marginUsdt,
          gainUsdt,
          roePercent,
          pnlPercent: roePercent,
          pnlPips,
          waveTrajectory: wave,
          timestamp: Date.now(),
        };

        // Update trade history state & persistence
        setClosedTrades((prev) => {
          const updated = [closedTradeItem, ...prev];
          try {
            localStorage.setItem('aurasignals_closed_trades', JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        saveClosedTradeToCloud(closedTradeItem);

        // Play sound alert
        if (soundEnabled) {
          playAlertSound(isWin ? 'tp' : 'sl');
        }

        // AI Journal Audit with Crypto Futures Confluence
        const completedJournal: AiTradeJournalEntry = {
          id: `journal-eval-${Date.now()}`,
          timestamp: Date.now(),
          timeStr,
          asset,
          action: isBuy ? 'BUY' : 'SELL',
          confidence: sig.confidencePercent || 88.5,
          setupRationale: isWin
            ? `Target hit cleanly (+${Math.abs(roePercent).toFixed(1)}% ROE · +$${Math.abs(gainUsdt).toFixed(2)} USDT). 10x Futures setup validated institutional order flow.`
            : `Invalidation reached (-${Math.abs(roePercent).toFixed(1)}% ROE · -$${Math.abs(gainUsdt).toFixed(2)} USDT). Strict 2% margin risk management executed.`,
          riskGuard: {
            maxCapitalRiskDollar: Math.abs(gainUsdt),
            riskPercent: 2.0,
            targetRewardRatio: sig.stopLoss.riskRewardRatio || '1:2.5',
            invalidationPrice: exitPrice,
          },
          technicalEvidence: {
            marketStructure: isWin ? '10x Target Hit (Liquidity Swept)' : 'Stop Out (Capital Protected)',
            keyLevel: `Exit Price $${exitPrice.toLocaleString()}`,
            momentumSignal: isWin ? 'Full ROE Realized' : 'Max Drawdown Prevented',
          },
          agentCycle: 'JOURNAL',
          outcomeNote: isWin
            ? `✅ Win: Hit TP (+${Math.abs(roePercent).toFixed(1)}% ROE · +$${Math.abs(gainUsdt).toFixed(2)} USDT)`
            : `🛑 Risk Managed: Hit SL (-${Math.abs(roePercent).toFixed(1)}% ROE · -$${Math.abs(gainUsdt).toFixed(2)} USDT)`,
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
          showToast(`🎯 ${asset} HIT TP! (+${Math.abs(roePercent).toFixed(1)}% ROE · +$${Math.abs(gainUsdt).toFixed(2)} USDT)`);
        } else {
          showToast(`🛑 ${asset} HIT SL! (-${Math.abs(roePercent).toFixed(1)}% ROE · -$${Math.abs(gainUsdt).toFixed(2)} USDT)`);
        }

        // If automated bot is not running, position finishes and remains closed (Manual mode!)
        if (!isBotRunning) {
          const finishedSignals = { ...activeSignalsRef.current, [asset]: null };
          updateAndPersistSignals(finishedSignals);
          return;
        }

        // If bot is active, generate next signal
        const ticker =
          asset === 'BTC/USDT' ? btcTickerRef.current : asset === 'ETH/USDT' ? ethTickerRef.current : xrpTickerRef.current;
        const candles = ticker?.candles || [];
        const freshSignal = generateInstantSignal(asset, '1h', newPrice, candles);
        const nextSignals = { ...activeSignalsRef.current, [asset]: freshSignal };
        updateAndPersistSignals(nextSignals);
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

  // Micro-fluctuation jitter simulation across ALL 3 crypto assets (BTC, ETH, XRP)
  useEffect(() => {
    const microTickInterval = setInterval(() => {
      const assets: AssetSymbol[] = ['BTC/USDT', 'ETH/USDT', 'XRP/USDT'];
      assets.forEach((asset) => {
        const ticker =
          asset === 'BTC/USDT'
            ? btcTickerRef.current
            : asset === 'ETH/USDT'
            ? ethTickerRef.current
            : xrpTickerRef.current;

        if (!ticker || !ticker.price) return;

        const delta =
          asset === 'BTC/USDT'
            ? (Math.random() - 0.49) * 2.4
            : asset === 'ETH/USDT'
            ? (Math.random() - 0.49) * 0.28
            : (Math.random() - 0.49) * 0.0004;

        const decimals = asset === 'XRP/USDT' ? 4 : 2;
        const updatedPrice = parseFloat((ticker.price + delta).toFixed(decimals));

        if (asset === selectedAsset) {
          if (updatedPrice > ticker.price) {
            setPriceTickDirection('up');
          } else if (updatedPrice < ticker.price) {
            setPriceTickDirection('down');
          }
          setTimeout(() => setPriceTickDirection('neutral'), 400);
          prevPriceRef.current = updatedPrice;
        }

        ticker.price = updatedPrice;
        if (asset === 'BTC/USDT') setBtcTicker({ ...ticker });
        else if (asset === 'ETH/USDT') setEthTicker({ ...ticker });
        else setXrpTicker({ ...ticker });

        handleIncomingPrice(asset, updatedPrice);
      });
    }, 1000);

    return () => clearInterval(microTickInterval);
  }, [selectedAsset]);

  const currentTicker =
    selectedAsset === 'BTC/USDT' ? btcTicker : selectedAsset === 'ETH/USDT' ? ethTicker : xrpTicker;
  const currentPrice = currentTicker?.price || (selectedAsset === 'BTC/USDT' ? 83040 : selectedAsset === 'ETH/USDT' ? 2540 : 1.38);

  // Bot-only Signal Generation Effect (DISABLED when isBotRunning is false!)
  useEffect(() => {
    if (!isBotRunning) return;
    const currentSigObj = { ...activeSignalsRef.current };
    let hasChanges = false;

    (['BTC/USDT', 'ETH/USDT', 'XRP/USDT'] as AssetSymbol[]).forEach((asset) => {
      const existingSig = currentSigObj[asset];
      const ticker =
        asset === 'BTC/USDT' ? btcTickerRef.current : asset === 'ETH/USDT' ? ethTickerRef.current : xrpTickerRef.current;
      const fallbackPrice = asset === 'BTC/USDT' ? 83650 : asset === 'ETH/USDT' ? 2542 : 1.382;
      const basePrice = ticker?.price || fallbackPrice;
      const candles = ticker?.candles || [];

      if (!existingSig || existingSig.status !== 'RUNNING') {
        const sig = generateInstantSignal(asset, '1h', basePrice, candles);
        currentSigObj[asset] = sig;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      updateAndPersistSignals(currentSigObj);
    }
  }, [isBotRunning, updateAndPersistSignals]);

  // MANUAL TRADING ACTIONS
  const handleOpenManualTrade = (signal: SignalData) => {
    const updatedSignals = { ...activeSignalsRef.current, [signal.asset]: signal };
    updateAndPersistSignals(updatedSignals);
    setSelectedAsset(signal.asset);
    showToast(`🚀 Posisi ${signal.asset} (${signal.signal}) berhasil dibuka secara manual!`);
  };

  const handleManualClosePosition = (asset: AssetSymbol) => {
    const sig = activeSignalsRef.current[asset];
    if (!sig) return;

    const ticker =
      asset === 'BTC/USDT' ? btcTickerRef.current : asset === 'ETH/USDT' ? ethTickerRef.current : xrpTickerRef.current;
    const currentMarketPrice = ticker?.price || sig.entryPrice || 0;
    const isBuy = sig.signal.includes('BUY');
    const avgEntry = sig.entryPrice || (sig.entryRange.min + sig.entryRange.max) / 2;
    const dir = isBuy ? 1 : -1;
    const priceMovePct = avgEntry > 0 ? ((currentMarketPrice - avgEntry) / avgEntry) * dir : 0;
    const leverage = 10;
    const marginUsdt = sig.recommendedMarginUsdt || 150.0;
    const roePercent = Math.round(priceMovePct * leverage * 100 * 10) / 10;
    const gainUsdt = Math.round(marginUsdt * (roePercent / 100) * 100) / 100;
    const pnlPips = Math.round(Math.abs(currentMarketPrice - avgEntry));
    const isWin = gainUsdt >= 0;

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} UTC`;

    const closedTradeItem: ClosedTrade = {
      id: `trade-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dateStr,
      timeStr,
      asset,
      direction: isBuy ? 'BUY' : 'SELL',
      entryPrice: avgEntry,
      exitPrice: currentMarketPrice,
      hitType: isWin ? 'HIT_TP' : 'HIT_SL',
      leverage,
      marginUsdt,
      gainUsdt,
      roePercent,
      pnlPercent: roePercent,
      pnlPips,
      waveTrajectory: generateWavePoints(avgEntry, currentMarketPrice, isWin ? 'HIT_TP' : 'HIT_SL'),
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

    // Remove from active signals
    const updatedSignals = { ...activeSignalsRef.current, [asset]: null };
    updateAndPersistSignals(updatedSignals);

    showToast(
      `${isWin ? '🎯' : '🛑'} Posisi ${asset} ditutup di harga $${currentMarketPrice.toLocaleString()} (${isWin ? '+' : ''}$${gainUsdt.toFixed(2)} USDT · ${roePercent}%)`
    );
  };

  // Admin Control Actions
  const handleForceCloseSignal = (asset: AssetSymbol, hitType: 'HIT_TP' | 'HIT_SL') => {
    const sig = activeSignalsRef.current[asset];
    if (!sig) return;
    const targetPrice = hitType === 'HIT_TP' ? sig.takeProfit[0].price : sig.stopLoss.price;
    handleIncomingPrice(asset, targetPrice);
    showToast(`Position ${asset} force closed by Admin (${hitType}).`);
  };

  const handleAddManualSignal = (newSignal: SignalData) => {
    handleOpenManualTrade(newSignal);
  };

  const handleResetAllHistory = () => {
    setClosedTrades([]);
    setHistoricalJournals([]);
    const cleanSignals = {
      'BTC/USDT': null,
      'ETH/USDT': null,
      'XRP/USDT': null,
    };
    updateAndPersistSignals(cleanSignals);
    try {
      localStorage.removeItem('aurasignals_closed_trades');
      localStorage.removeItem('aurasignals_ai_journals');
      localStorage.removeItem('aurasignals_active_signals');
    } catch (e) {}
    clearAllTradesInCloud().catch(() => {});
    showToast('Semua sinyal, posisi, dan riwayat trading berhasil di-reset.');
  };

  const activeSignal = activeSignals[selectedAsset] || activeSignalsRef.current[selectedAsset];

  const currentJournal = useMemo(() => {
    if (!activeSignal) return null;
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
            {/* Quick Manual Trade Button */}
            <button
              onClick={() => setIsManualTradeModalOpen(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 transition-all cursor-pointer shadow-sm shadow-teal-500/20 active:scale-95"
              title="Buka Posisi Manual"
            >
              <Zap className="w-3 h-3 text-teal-400 fill-current" />
              <span>+ TRADE</span>
            </button>

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
                <span>ADMIN</span>
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

            {/* Live Portfolio Combining 3 Crypto Assets (BTC, ETH, XRP) */}
            <OwnerLivePortfolio
              activeSignals={activeSignals}
              currentPrices={{
                'BTC/USDT': btcTicker.price,
                'ETH/USDT': ethTicker.price,
                'XRP/USDT': xrpTicker.price,
              }}
              closedTrades={closedTrades}
              userRole={userRole}
              onOpenAccessModal={() => setIsAccessModalOpen(true)}
              onOpenVipPayment={() => setIsVipPaymentOpen(true)}
              onOpenManualTrade={() => setIsManualTradeModalOpen(true)}
              onClosePosition={handleManualClosePosition}
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
              activeSignal={activeSignals[selectedAsset]}
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

      {/* Manual Trade Modal */}
      <ManualTradeModal
        isOpen={isManualTradeModalOpen}
        onClose={() => setIsManualTradeModalOpen(false)}
        currentPrices={{ btc: btcTicker.price, eth: ethTicker.price, xrp: xrpTicker.price }}
        activeSignals={activeSignals}
        onOpenTrade={handleOpenManualTrade}
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

      {/* VIP Payment Modal (USDT TRC20 & BEP20) */}
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
              : '⏸️ AI Trading Bot Paused (Manual Trading Mode).'
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
