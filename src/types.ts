export type AssetSymbol = 'BTC/USDT' | 'ETH/USDT' | 'XRP/USDT';

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
  spread?: number;
  fundingRate?: number; // e.g. +0.0100% (Crypto Futures)
  openInterest?: string; // e.g. "$1.42B"
  dxyImpact?: string;
  volume24h?: number;
  candles: Candle[];
  timestamp: number;
}

export interface TakeProfitTarget {
  target: string;
  price: number;
  targetRoePercent?: number; // e.g. +25.0% ROE at 10x leverage
  pipsOrPoints?: number; // legacy points distance for backward compatibility
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
  leverageMultiplier: number; // Default 10x Leverage Multiplier
  marginMode?: 'ISOLATED' | 'CROSS';
  recommendedMarginUsdt?: number; // e.g. $150 USDT per trade (2% risk guard)
  targetRoePercent?: number; // Expected ROE % e.g. +25.0%
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
    slRoePercent?: number; // e.g. -10.0% ROE
    pipsOrPoints?: number;
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
  newsCatalyst?: string; // High-impact live news catalyst
  riskManagementNote: string;
  status: 'RUNNING' | 'HIT_TP' | 'HIT_SL';
}

export interface ClosedTrade {
  id: string;
  dateStr: string; // e.g. '2026-10-15'
  timeStr: string; // e.g. '14:25 UTC'
  asset: AssetSymbol;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  hitType: 'HIT_TP' | 'HIT_SL';
  leverage?: number; // 10x
  marginUsdt?: number; // $150 USDT
  gainUsdt?: number; // Realized dollar gain/loss
  roePercent?: number; // ROE % at 10x leverage
  pnlPercent: number; // positive for TP, negative for SL
  pnlPips: number; // points moved
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
    maxCapitalRiskDollar: number; // 2% risk rule
    riskPercent: number; // 2.0%
    targetRewardRatio: string; // '1:2.5'
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

export interface VipPaymentRequest {
  id: string;
  userName: string;
  contact: string; // WhatsApp or Telegram
  plan: '1_MONTH' | '3_MONTHS' | 'LIFETIME';
  method: 'USDT_TRC20' | 'USDT_BEP20';
  amount: string; // e.g. "$15 USDT"
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  txProofOrRef: string;
  createdAt: number;
  approvedPin?: string;
}

/**
 * Crypto Futures Gain Calculation (10x Leverage Multiplier / $150 USDT Margin)
 * ROE % = ((exit - entry) / entry) * direction * leverage * 100%
 * Realized Gain $ = margin * (ROE % / 100)
 */
export function calculateTradeGain(trade: {
  asset: AssetSymbol;
  entryPrice: number;
  exitPrice: number;
  direction: 'BUY' | 'SELL';
  gainUsdt?: number;
  roePercent?: number;
}): number {
  if (typeof trade.gainUsdt === 'number' && !isNaN(trade.gainUsdt)) {
    return trade.gainUsdt;
  }
  const dir = trade.direction === 'BUY' ? 1 : -1;
  const priceMovePct = (trade.exitPrice - trade.entryPrice) / trade.entryPrice * dir;
  const leverage = 10;
  const marginPerTrade = 150.0; // $150 USDT standard margin
  const roePct = priceMovePct * leverage;
  const gain = marginPerTrade * roePct;
  return Math.round(gain * 100) / 100;
}
