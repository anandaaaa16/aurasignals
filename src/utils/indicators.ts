import { Candle, TechnicalIndicators } from '../types';

export function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const emaArray: number[] = [];

  if (data.length < period) {
    return data;
  }

  // Initial SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let prevEma = sum / period;
  emaArray.push(prevEma);

  for (let i = period; i < data.length; i++) {
    const curEma = data[i] * k + prevEma * (1 - k);
    emaArray.push(curEma);
    prevEma = curEma;
  }

  // Pad beginning with nulls or repeated first value for alignment
  const padding = new Array(period - 1).fill(emaArray[0]);
  return [...padding, ...emaArray];
}

export function calculateRSI(closes: number[], period = 14): number[] {
  if (closes.length < period + 1) {
    return new Array(closes.length).fill(50);
  }

  const rsi: number[] = new Array(period).fill(50);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - 100 / (1 + rs));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(Math.round((100 - 100 / (1 + rs)) * 10) / 10);
  }

  return rsi;
}

export function calculateBollingerBands(closes: number[], period = 20, multiplier = 2) {
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      middle.push(closes[i]);
      upper.push(closes[i]);
      lower.push(closes[i]);
      continue;
    }

    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    middle.push(Math.round(mean * 100) / 100);
    upper.push(Math.round((mean + multiplier * stdDev) * 100) / 100);
    lower.push(Math.round((mean - multiplier * stdDev) * 100) / 100);
  }

  return { upper, middle, lower };
}

export function calculateMACD(closes: number[], fast = 12, slow = 26, signal = 9) {
  const fastEMA = calculateEMA(closes, fast);
  const slowEMA = calculateEMA(closes, slow);

  const macdLine = closes.map((_, i) => (fastEMA[i] || 0) - (slowEMA[i] || 0));
  const signalLine = calculateEMA(macdLine, signal);
  const histogram = macdLine.map((val, i) => Math.round((val - (signalLine[i] || 0)) * 100) / 100);

  return { macdLine, signalLine, histogram };
}

export function calculateATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return 1.0;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close)
    );
    trs.push(tr);
  }
  const recentTR = trs.slice(-period);
  const avg = recentTR.reduce((a, b) => a + b, 0) / recentTR.length;
  return Math.round(avg * 100) / 100;
}

export function computeTechnicalIndicators(candles: Candle[]): TechnicalIndicators {
  if (!candles || candles.length === 0) {
    return {
      rsi: 50,
      macd: { macdLine: 0, signalLine: 0, histogram: 0 },
      ema20: 0,
      ema50: 0,
      ema200: 0,
      bollingerBands: { upper: 0, middle: 0, lower: 0 },
      atr: 1.5,
    };
  }

  const closes = candles.map((c) => c.close);
  const lastIndex = closes.length - 1;

  const rsiArr = calculateRSI(closes, 14);
  const ema20Arr = calculateEMA(closes, 20);
  const ema50Arr = calculateEMA(closes, 50);
  const ema200Arr = calculateEMA(closes, 200);
  const bb = calculateBollingerBands(closes, 20, 2);
  const macd = calculateMACD(closes, 12, 26, 9);
  const atr = calculateATR(candles, 14);

  return {
    rsi: rsiArr[lastIndex] || 50,
    macd: {
      macdLine: Math.round((macd.macdLine[lastIndex] || 0) * 100) / 100,
      signalLine: Math.round((macd.signalLine[lastIndex] || 0) * 100) / 100,
      histogram: macd.histogram[lastIndex] || 0,
    },
    ema20: Math.round((ema20Arr[lastIndex] || closes[lastIndex]) * 100) / 100,
    ema50: Math.round((ema50Arr[lastIndex] || closes[lastIndex]) * 100) / 100,
    ema200: Math.round((ema200Arr[lastIndex] || closes[lastIndex]) * 100) / 100,
    bollingerBands: {
      upper: bb.upper[lastIndex] || closes[lastIndex],
      middle: bb.middle[lastIndex] || closes[lastIndex],
      lower: bb.lower[lastIndex] || closes[lastIndex],
    },
    atr,
  };
}
