export type AssetSymbol = 'XAU/USD' | 'BTC/USDT';

export type Timeframe = '5m' | '15m' | '1h' | '4h' | '1d';

export type SignalType = 'STRONG BUY' | 'BUY' | 'WAIT / NEUTRAL' | 'SELL' | 'STRONG SELL';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketTicker {
  symbol: AssetSymbol;
  name: string;
  price: number;
  change24h: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  bid: number;
  ask: number;
  spread: number;
  dxyImpact?: string;
  volume24h?: number;
  candles: Candle[];
  timestamp: number;
}

export interface TakeProfitTarget {
  target: string;
  price: number;
  pipsOrPoints: number;
}

export interface SignalData {
  id: string;
  asset: AssetSymbol;
  timeframe: string;
  createdAt: number;
  signal: SignalType;
  confidencePercent: number;
  timeHorizon: string;
  orderType: string;
  entryPrice?: number;
  entryCandleTime?: number;
  timeDuration?: {
    durationLabel: string;
  };
  entryRange: {
    min: number;
    max: number;
  };
  takeProfit: TakeProfitTarget[];
  stopLoss: {
    price: number;
    pipsOrPoints: number;
    riskRewardRatio: string;
  };
  technicalConfluence: string[];
  smartMoneyConcept: {
    liquidityZone: string;
    orderBlock: string;
    fairValueGap: string;
    marketBias: 'Bullish Expansion' | 'Bearish Liquidity Run' | 'Range Compression';
  };
  macroeconomicCatalyst: string;
  riskManagementNote: string;
  status: 'RUNNING' | 'HIT_TP' | 'HIT_SL';
}

export interface ClosedTrade {
  id: string;
  dateStr: string; // e.g. '2026-10-10'
  timeStr: string; // e.g. '14:25 WIB'
  asset: AssetSymbol;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  hitType: 'HIT_TP' | 'HIT_SL';
  pnlPercent: number; // positive for TP, negative for SL
  pnlPips: number; // positive for TP, negative for SL
  waveTrajectory: number[]; // continuous price values forming the wave curve
  timestamp: number;
}

export interface DailyAccuracy {
  dateStr: string;
  label: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  netPips: number;
  netPercent: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  ema20: number;
  ema50: number;
  ema200: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  atr: number;
}

export interface EconomicEvent {
  id: string;
  title: string;
  currency: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  date: string;
  time: string;
  forecast: string;
  previous: string;
  affects: string;
  note: string;
}

export interface AiTradeJournalEntry {
  id: string;
  timestamp: number;
  timeStr: string;
  asset: AssetSymbol;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  setupRationale: string;
  riskGuard: {
    maxCapitalRiskDollar: number; // e.g. 7.50 (1.5% of $500)
    riskPercent: number; // 1.5%
    targetRewardRatio: string; // '1:2.0'
    invalidationPrice: number;
  };
  technicalEvidence: {
    marketStructure: string;
    keyLevel: string;
    momentumSignal: string;
  };
  agentCycle: 'RESEARCH' | 'TRADE' | 'JOURNAL';
  outcomeNote?: string;
}
