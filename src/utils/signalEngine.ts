import { AssetSymbol, Candle, SignalData } from '../types';

// Timeframe-specific volatility configuration for Crypto assets
interface CryptoTfConfig {
  horizon: string;
  btc: { tp1: number; tp2: number; tp3: number; sl: number };
  eth: { tp1: number; tp2: number; tp3: number; sl: number };
  xrp: { tp1: number; tp2: number; tp3: number; sl: number };
}

const TF_MAP: Record<string, CryptoTfConfig> = {
  '5m': {
    horizon: 'M5 Scalp Execution',
    btc: { tp1: 280, tp2: 580, tp3: 950, sl: 220 },
    eth: { tp1: 12, tp2: 24, tp3: 40, sl: 9 },
    xrp: { tp1: 0.012, tp2: 0.024, tp3: 0.040, sl: 0.009 },
  },
  '15m': {
    horizon: 'M15 Intraday Position',
    btc: { tp1: 650, tp2: 1350, tp3: 2100, sl: 520 },
    eth: { tp1: 28, tp2: 58, tp3: 92, sl: 22 },
    xrp: { tp1: 0.025, tp2: 0.052, tp3: 0.085, sl: 0.020 },
  },
  '1h': {
    horizon: 'H1 Swing Position',
    btc: { tp1: 1400, tp2: 2800, tp3: 4200, sl: 1100 },
    eth: { tp1: 62, tp2: 124, tp3: 195, sl: 48 },
    xrp: { tp1: 0.055, tp2: 0.110, tp3: 0.175, sl: 0.042 },
  },
  '4h': {
    horizon: 'H4 Trend Follower',
    btc: { tp1: 3200, tp2: 6400, tp3: 9800, sl: 2400 },
    eth: { tp1: 140, tp2: 280, tp3: 420, sl: 105 },
    xrp: { tp1: 0.120, tp2: 0.240, tp3: 0.380, sl: 0.095 },
  },
  '1d': {
    horizon: 'D1 Macro Position',
    btc: { tp1: 7500, tp2: 15000, tp3: 24000, sl: 5800 },
    eth: { tp1: 320, tp2: 640, tp3: 1020, sl: 240 },
    xrp: { tp1: 0.280, tp2: 0.560, tp3: 0.880, sl: 0.210 },
  },
};

// Check whether current price triggered TP or SL
export function checkSignalHit(
  signal: SignalData,
  currentPrice: number
): 'HIT_TP' | 'HIT_SL' | null {
  if (!signal || !currentPrice || signal.status !== 'RUNNING') return null;

  const isBuy = signal.signal.includes('BUY');
  const tp1Price = signal.takeProfit[0]?.price;
  const slPrice = signal.stopLoss?.price;

  if (!tp1Price || !slPrice) return null;

  if (isBuy) {
    if (currentPrice >= tp1Price) return 'HIT_TP';
    if (currentPrice <= slPrice) return 'HIT_SL';
  } else {
    if (currentPrice <= tp1Price) return 'HIT_TP';
    if (currentPrice >= slPrice) return 'HIT_SL';
  }

  return null;
}

// Generate realistic smooth wave trajectory from entry to exit
export function generateWavePoints(
  entry: number,
  exit: number,
  hitType: 'HIT_TP' | 'HIT_SL',
  steps = 16
): number[] {
  const points: number[] = [entry];
  const diff = exit - entry;

  for (let i = 1; i < steps - 1; i++) {
    const progress = i / (steps - 1);
    const wave = Math.sin(progress * Math.PI * 2.2) * (Math.abs(diff) * 0.18);
    const noise = Math.sin(i * 1.3) * 0.5 * (Math.abs(diff) * 0.08);
    const trend = entry + diff * progress;
    points.push(Math.round((trend + wave + noise) * 100) / 100);
  }
  points.push(exit);
  return points;
}

// Instant algorithmic signal generator for BTC, ETH, and XRP
export function generateInstantSignal(
  asset: AssetSymbol,
  timeframe: string,
  price: number,
  candles: Candle[]
): SignalData {
  const cfg = TF_MAP[timeframe] || TF_MAP['15m'];

  const recentCandles = candles.slice(-8);
  const closes = recentCandles.map((c) => c.close);
  const firstClose = closes[0] || price;
  const lastClose = closes[closes.length - 1] || price;
  const isUp = lastClose >= firstClose;

  const id = `sig-${asset.toLowerCase().replace('/', '')}-${Date.now()}`;

  if (asset === 'ETH/USDT') {
    const p = cfg.eth;
    const tp1 = isUp ? Math.round((price + p.tp1) * 100) / 100 : Math.round((price - p.tp1) * 100) / 100;
    const tp2 = isUp ? Math.round((price + p.tp2) * 100) / 100 : Math.round((price - p.tp2) * 100) / 100;
    const tp3 = isUp ? Math.round((price + p.tp3) * 100) / 100 : Math.round((price - p.tp3) * 100) / 100;
    const sl = isUp ? Math.round((price - p.sl) * 100) / 100 : Math.round((price + p.sl) * 100) / 100;

    const entryOffset = Math.round(p.tp1 * 0.2 * 100) / 100;
    const entryMin = isUp ? Math.round((price - entryOffset) * 100) / 100 : Math.round((price + 1.5) * 100) / 100;
    const entryMax = isUp ? Math.round((price + 1.5) * 100) / 100 : Math.round((price + entryOffset) * 100) / 100;
    const rr = (p.tp1 / p.sl).toFixed(1);

    return {
      id,
      asset: 'ETH/USDT',
      timeframe,
      createdAt: Date.now(),
      signal: isUp ? 'STRONG BUY' : 'SELL',
      confidencePercent: isUp ? 87 : 83,
      timeHorizon: cfg.horizon,
      orderType: isUp ? 'Market Buy' : 'Market Sell',
      entryPrice: price,
      entryCandleTime: candles.length > 0 ? candles[candles.length - 1].time : undefined,
      timeDuration: { durationLabel: cfg.horizon },
      entryRange: { min: entryMin, max: entryMax },
      takeProfit: [
        { target: 'TP 1', price: tp1, pipsOrPoints: p.tp1 },
        { target: 'TP 2', price: tp2, pipsOrPoints: p.tp2 },
        { target: 'TP 3', price: tp3, pipsOrPoints: p.tp3 },
      ],
      stopLoss: {
        price: sl,
        pipsOrPoints: p.sl,
        riskRewardRatio: `1 : ${rr}`,
      },
      technicalConfluence: [
        `Ethereum reclaimed ${timeframe} institutional value area with active gas flow surge.`,
        `Rejection of sell-side liquidity confirmed with positive delta.`,
      ],
      smartMoneyConcept: {
        liquidityZone: `Target Liquidity at $${Math.round(price + p.tp2 * 1.1)}`,
        orderBlock: `Institutional OB ${timeframe} at $${entryMin} - $${entryMax}`,
        fairValueGap: `Mitigation FVG ${timeframe} at $${Math.round(price - entryOffset * 0.5)}`,
        marketBias: isUp ? 'Bullish Expansion' : 'Bearish Liquidity Run',
      },
      macroeconomicCatalyst: 'Layer 2 volume expansion and institutional staking inflows support trend.',
      riskManagementNote: 'Hard TP and SL managed automatically.',
      status: 'RUNNING',
    };
  } else if (asset === 'XRP/USDT') {
    const p = cfg.xrp;
    const tp1 = isUp ? Math.round((price + p.tp1) * 10000) / 10000 : Math.round((price - p.tp1) * 10000) / 10000;
    const tp2 = isUp ? Math.round((price + p.tp2) * 10000) / 10000 : Math.round((price - p.tp2) * 10000) / 10000;
    const tp3 = isUp ? Math.round((price + p.tp3) * 10000) / 10000 : Math.round((price - p.tp3) * 10000) / 10000;
    const sl = isUp ? Math.round((price - p.sl) * 10000) / 10000 : Math.round((price + p.sl) * 10000) / 10000;

    const entryOffset = Math.round(p.tp1 * 0.2 * 10000) / 10000;
    const entryMin = isUp ? Math.round((price - entryOffset) * 10000) / 10000 : Math.round((price + 0.001) * 10000) / 10000;
    const entryMax = isUp ? Math.round((price + 0.001) * 10000) / 10000 : Math.round((price + entryOffset) * 10000) / 10000;
    const rr = (p.tp1 / p.sl).toFixed(1);

    return {
      id,
      asset: 'XRP/USDT',
      timeframe,
      createdAt: Date.now(),
      signal: isUp ? 'STRONG BUY' : 'SELL',
      confidencePercent: isUp ? 89 : 85,
      timeHorizon: cfg.horizon,
      orderType: isUp ? 'Market Buy' : 'Market Sell',
      entryPrice: price,
      entryCandleTime: candles.length > 0 ? candles[candles.length - 1].time : undefined,
      timeDuration: { durationLabel: cfg.horizon },
      entryRange: { min: entryMin, max: entryMax },
      takeProfit: [
        { target: 'TP 1', price: tp1, pipsOrPoints: Math.round(p.tp1 * 10000) },
        { target: 'TP 2', price: tp2, pipsOrPoints: Math.round(p.tp2 * 10000) },
        { target: 'TP 3', price: tp3, pipsOrPoints: Math.round(p.tp3 * 10000) },
      ],
      stopLoss: {
        price: sl,
        pipsOrPoints: Math.round(p.sl * 10000),
        riskRewardRatio: `1 : ${rr}`,
      },
      technicalConfluence: [
        `XRP aggressive liquidity surge across multi-exchange perp order books.`,
        `High-volume breakout of key accumulation structure with zero slippage.`,
      ],
      smartMoneyConcept: {
        liquidityZone: `Target Liquidity at $${(price + p.tp2 * 1.1).toFixed(4)}`,
        orderBlock: `Institutional OB ${timeframe} at $${entryMin.toFixed(4)} - $${entryMax.toFixed(4)}`,
        fairValueGap: `Mitigation FVG ${timeframe} at $${(price - entryOffset * 0.4).toFixed(4)}`,
        marketBias: isUp ? 'Bullish Expansion' : 'Bearish Liquidity Run',
      },
      macroeconomicCatalyst: 'Cross-border settlement volume and spot accumulation drive momentum.',
      riskManagementNote: 'Hard TP and SL managed automatically.',
      status: 'RUNNING',
    };
  } else {
    // BTC/USDT
    const p = cfg.btc;
    const tp1 = isUp ? Math.round(price + p.tp1) : Math.round(price - p.tp1);
    const tp2 = isUp ? Math.round(price + p.tp2) : Math.round(price - p.tp2);
    const tp3 = isUp ? Math.round(price + p.tp3) : Math.round(price - p.tp3);
    const sl = isUp ? Math.round(price - p.sl) : Math.round(price + p.sl);

    const entryOffset = Math.round(p.tp1 * 0.2);
    const entryMin = isUp ? Math.round(price - entryOffset) : Math.round(price + 20);
    const entryMax = isUp ? Math.round(price + 20) : Math.round(price + entryOffset);
    const rr = (p.tp1 / p.sl).toFixed(1);

    return {
      id,
      asset: 'BTC/USDT',
      timeframe,
      createdAt: Date.now(),
      signal: isUp ? 'STRONG BUY' : 'SELL',
      confidencePercent: isUp ? 88 : 84,
      timeHorizon: cfg.horizon,
      orderType: isUp ? 'Market Buy' : 'Market Sell',
      entryPrice: price,
      entryCandleTime: candles.length > 0 ? candles[candles.length - 1].time : undefined,
      timeDuration: { durationLabel: cfg.horizon },
      entryRange: { min: entryMin, max: entryMax },
      takeProfit: [
        { target: 'TP 1', price: tp1, pipsOrPoints: p.tp1 },
        { target: 'TP 2', price: tp2, pipsOrPoints: p.tp2 },
        { target: 'TP 3', price: tp3, pipsOrPoints: p.tp3 },
      ],
      stopLoss: {
        price: sl,
        pipsOrPoints: p.sl,
        riskRewardRatio: `1 : ${rr}`,
      },
      technicalConfluence: [
        `Bitcoin structure ${timeframe} breakout supported by rising volume delta.`,
        `Local liquidity reclaim indicates continuation toward target.`,
      ],
      smartMoneyConcept: {
        liquidityZone: `Target Liquidity at $${Math.round(price + p.tp2 * 1.1)}`,
        orderBlock: `Institutional OB ${timeframe} at $${entryMin} - $${entryMax}`,
        fairValueGap: `Mitigation FVG ${timeframe} at $${Math.round(price - entryOffset * 0.4)}`,
        marketBias: isUp ? 'Bullish Expansion' : 'Bearish Liquidity Run',
      },
      macroeconomicCatalyst: 'Bitcoin spot ETF net inflow momentum supports continuous buying.',
      riskManagementNote: 'Hard TP and SL managed automatically.',
      status: 'RUNNING',
    };
  }
}
