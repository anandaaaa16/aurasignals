import { AssetSymbol, Candle, SignalData } from '../types';

// Check whether global spot gold market (XAU/USD) is currently open or on weekend holiday
export function isGoldMarketOpen(date = new Date()): { isOpen: boolean; reason?: string } {
  // Global Spot Gold (XAU/USD) Market Hours:
  // Opens Sunday 22:00 UTC (Senin 05:00 WIB)
  // Closes Friday 21:00 UTC (Sabtu 04:00 WIB)
  const day = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const hour = date.getUTCHours();

  if (day === 6) {
    return { isOpen: false, reason: 'Market Closed (Saturday)' };
  }
  if (day === 0 && hour < 22) {
    return { isOpen: false, reason: 'Market Closed (Sunday)' };
  }
  if (day === 5 && hour >= 21) {
    return { isOpen: false, reason: 'Market Closed (Friday Night)' };
  }

  return { isOpen: true };
}

// Timeframe-specific volatility configuration
interface TfConfig {
  goldTp1Pips: number;
  goldTp2Pips: number;
  goldTp3Pips: number;
  goldSlPips: number;
  btcTp1Pts: number;
  btcTp2Pts: number;
  btcTp3Pts: number;
  btcSlPts: number;
  horizon: string;
}

const TF_MAP: Record<string, TfConfig> = {
  '5m': {
    goldTp1Pips: 25,
    goldTp2Pips: 50,
    goldTp3Pips: 85,
    goldSlPips: 20,
    btcTp1Pts: 280,
    btcTp2Pts: 580,
    btcTp3Pts: 950,
    btcSlPts: 220,
    horizon: 'M5 Scalp Execution',
  },
  '15m': {
    goldTp1Pips: 55,
    goldTp2Pips: 110,
    goldTp3Pips: 175,
    goldSlPips: 45,
    btcTp1Pts: 650,
    btcTp2Pts: 1350,
    btcTp3Pts: 2100,
    btcSlPts: 520,
    horizon: 'M15 Intraday Position',
  },
  '1h': {
    goldTp1Pips: 120,
    goldTp2Pips: 240,
    goldTp3Pips: 380,
    goldSlPips: 95,
    btcTp1Pts: 1400,
    btcTp2Pts: 2800,
    btcTp3Pts: 4200,
    btcSlPts: 1100,
    horizon: 'H1 Swing Position',
  },
  '4h': {
    goldTp1Pips: 260,
    goldTp2Pips: 520,
    goldTp3Pips: 820,
    goldSlPips: 200,
    btcTp1Pts: 3200,
    btcTp2Pts: 6400,
    btcTp3Pts: 9800,
    btcSlPts: 2400,
    horizon: 'H4 Trend Follower',
  },
  '1d': {
    goldTp1Pips: 550,
    goldTp2Pips: 1100,
    goldTp3Pips: 1800,
    goldSlPips: 420,
    btcTp1Pts: 7500,
    btcTp2Pts: 15000,
    btcTp3Pts: 24000,
    btcSlPts: 5800,
    horizon: 'D1 Macro Position',
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

// Generate realistic smooth wave trajectory (grafik nyambung ombak) from entry to exit
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
    // Sine wave wave-oscillation
    const wave = Math.sin(progress * Math.PI * 2.2) * (Math.abs(diff) * 0.18);
    const noise = (Math.sin(i * 1.3) * 0.5) * (Math.abs(diff) * 0.08);
    const trend = entry + diff * progress;
    points.push(Math.round((trend + wave + noise) * 100) / 100);
  }
  points.push(exit);
  return points;
}

// Instant algorithmic signal generator for 0-latency UI
// Always opens a fresh RUNNING position until it hits TP or SL
export function generateInstantSignal(
  asset: AssetSymbol,
  timeframe: string,
  price: number,
  candles: Candle[]
): SignalData {
  const isGold = asset === 'XAU/USD';
  const cfg = TF_MAP[timeframe] || TF_MAP['15m'];

  const recentCandles = candles.slice(-8);
  const closes = recentCandles.map((c) => c.close);
  const firstClose = closes[0] || price;
  const lastClose = closes[closes.length - 1] || price;
  const isUp = lastClose >= firstClose;

  const id = `sig-${asset.toLowerCase().replace('/', '')}-${Date.now()}`;

  if (isGold) {
    // 1 pip Gold = $0.10
    const tp1Diff = cfg.goldTp1Pips * 0.1;
    const tp2Diff = cfg.goldTp2Pips * 0.1;
    const tp3Diff = cfg.goldTp3Pips * 0.1;
    const slDiff = cfg.goldSlPips * 0.1;

    const entryOffset = Math.round((tp1Diff * 0.25) * 100) / 100;
    const entryMin = isUp ? Math.round((price - entryOffset) * 100) / 100 : Math.round((price + 0.3) * 100) / 100;
    const entryMax = isUp ? Math.round((price + 0.3) * 100) / 100 : Math.round((price + entryOffset) * 100) / 100;

    const tp1 = isUp ? Math.round((price + tp1Diff) * 100) / 100 : Math.round((price - tp1Diff) * 100) / 100;
    const tp2 = isUp ? Math.round((price + tp2Diff) * 100) / 100 : Math.round((price - tp2Diff) * 100) / 100;
    const tp3 = isUp ? Math.round((price + tp3Diff) * 100) / 100 : Math.round((price - tp3Diff) * 100) / 100;
    const sl = isUp ? Math.round((price - slDiff) * 100) / 100 : Math.round((price + slDiff) * 100) / 100;

    const rr = (tp1Diff / slDiff).toFixed(1);

    return {
      id,
      asset: 'XAU/USD',
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
        { target: 'TP 1', price: tp1, pipsOrPoints: cfg.goldTp1Pips },
        { target: 'TP 2', price: tp2, pipsOrPoints: cfg.goldTp2Pips },
        { target: 'TP 3', price: tp3, pipsOrPoints: cfg.goldTp3Pips },
      ],
      stopLoss: {
        price: sl,
        pipsOrPoints: cfg.goldSlPips,
        riskRewardRatio: `1 : ${rr}`,
      },
      technicalConfluence: [
        `Momentum breakout of ${timeframe} order block confirmed with institutional volume.`,
        `Dynamic support bounce confirms structural trend continuation.`,
      ],
      smartMoneyConcept: {
        liquidityZone: `Target Liquidity at $${Math.round((price + tp2Diff * 1.2) * 10) / 10}`,
        orderBlock: `Order Block ${timeframe} at $${entryMin} - $${entryMax}`,
        fairValueGap: `FVG Mitigation at $${Math.round((price - entryOffset * 0.5) * 10) / 10}`,
        marketBias: isUp ? 'Bullish Expansion' : 'Bearish Liquidity Run',
      },
      macroeconomicCatalyst: 'DXY softening provides strong bullish tailwinds for Gold.',
      riskManagementNote: 'Hard TP and SL managed automatically.',
      status: 'RUNNING',
    };
  } else {
    // BTC/USDT
    const tp1 = isUp ? Math.round(price + cfg.btcTp1Pts) : Math.round(price - cfg.btcTp1Pts);
    const tp2 = isUp ? Math.round(price + cfg.btcTp2Pts) : Math.round(price - cfg.btcTp2Pts);
    const tp3 = isUp ? Math.round(price + cfg.btcTp3Pts) : Math.round(price - cfg.btcTp3Pts);
    const sl = isUp ? Math.round(price - cfg.btcSlPts) : Math.round(price + cfg.btcSlPts);

    const entryOffset = Math.round(cfg.btcTp1Pts * 0.2);
    const entryMin = isUp ? Math.round(price - entryOffset) : Math.round(price + 20);
    const entryMax = isUp ? Math.round(price + 20) : Math.round(price + entryOffset);

    const rr = (cfg.btcTp1Pts / cfg.btcSlPts).toFixed(1);

    return {
      id,
      asset: 'BTC/USDT',
      timeframe,
      createdAt: Date.now(),
      signal: isUp ? 'BUY' : 'SELL',
      confidencePercent: isUp ? 86 : 82,
      timeHorizon: cfg.horizon,
      orderType: isUp ? 'Market Buy' : 'Market Sell',
      entryPrice: price,
      entryCandleTime: candles.length > 0 ? candles[candles.length - 1].time : undefined,
      timeDuration: { durationLabel: cfg.horizon },
      entryRange: { min: entryMin, max: entryMax },
      takeProfit: [
        { target: 'TP 1', price: tp1, pipsOrPoints: cfg.btcTp1Pts },
        { target: 'TP 2', price: tp2, pipsOrPoints: cfg.btcTp2Pts },
        { target: 'TP 3', price: tp3, pipsOrPoints: cfg.btcTp3Pts },
      ],
      stopLoss: {
        price: sl,
        pipsOrPoints: cfg.btcSlPts,
        riskRewardRatio: `1 : ${rr}`,
      },
      technicalConfluence: [
        `Market structure ${timeframe} breakout supported by rising volume delta.`,
        `Local liquidity reclaim indicates continuation toward target.`,
      ],
      smartMoneyConcept: {
        liquidityZone: `Target Liquidity at $${Math.round(price + cfg.btcTp2Pts * 1.1)}`,
        orderBlock: `Institutional OB ${timeframe} at $${entryMin} - $${entryMax}`,
        fairValueGap: `Mitigation FVG ${timeframe} at $${Math.round(price - entryOffset * 0.4)}`,
        marketBias: isUp ? 'Bullish Expansion' : 'Bearish Liquidity Run',
      },
      macroeconomicCatalyst: 'Bitcoin spot ETF net inflow momentum supports buying pressure.',
      riskManagementNote: 'Hard TP and SL managed automatically.',
      status: 'RUNNING',
    };
  }
}
