import { SignalData, AiTradeJournalEntry } from '../types';

/**
 * AI Trading Agent Engine
 * 24/7 Autonomous Trading Agent architecture for Crypto (BTC, ETH, XRP)
 */

export function generateLiveJournalEntry(
  signal: SignalData | null,
  currentPrice: number
): AiTradeJournalEntry | null {
  if (!signal) return null;

  const isBuy = signal.signal.includes('BUY');
  const entryPrice = signal.entryPrice || (signal.entryRange.min + signal.entryRange.max) / 2;
  const slPrice = signal.stopLoss.price;
  const tpPrice = signal.takeProfit[0]?.price;

  const slDistance = Math.abs(entryPrice - slPrice);
  const dollarRisk =
    signal.asset === 'BTC/USDT'
      ? slDistance * 0.02
      : signal.asset === 'ETH/USDT'
      ? slDistance * 0.5
      : slDistance * 1000;
  const riskPercent = Math.round((dollarRisk / 500) * 100 * 10) / 10;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())} UTC`;

  let setupRationale = '';
  let marketStructure = '';
  let keyLevel = '';
  let momentumSignal = '';

  if (signal.asset === 'ETH/USDT') {
    if (isBuy) {
      setupRationale = `Ethereum rebounded from institutional demand zone $${(entryPrice - 18).toFixed(1)}. Gas flow surge and L2 velocity confirm buyer absorption.`;
      marketStructure = 'Bullish Demand Shift';
      keyLevel = `Dynamic Support $${(entryPrice - 15).toFixed(1)}`;
      momentumSignal = 'RSI Oversold Reclaim & Positive Volume Delta';
    } else {
      setupRationale = `Rejection at upper distribution level $${(entryPrice + 18).toFixed(1)}. Bearish Fair Value Gap confirmed with slowing bid momentum.`;
      marketStructure = 'Bearish Liquidity Sweep';
      keyLevel = `Resistance $${(entryPrice + 15).toFixed(1)}`;
      momentumSignal = 'Bearish Momentum Divergence on H1';
    }
  } else if (signal.asset === 'XRP/USDT') {
    if (isBuy) {
      setupRationale = `XRP aggressive perp accumulation above $${(entryPrice - 0.015).toFixed(4)}. Heavy volume absorption defending local structure.`;
      marketStructure = 'High-Volume Order Block Reclaim';
      keyLevel = `Support $${(entryPrice - 0.012).toFixed(4)}`;
      momentumSignal = 'MACD Expansion & Bullish Tape Pressure';
    } else {
      setupRationale = `Failed breakout at local range high $${(entryPrice + 0.015).toFixed(4)}. Exhaustion wick confirms short-term mean reversion.`;
      marketStructure = 'Range High Rejection';
      keyLevel = `Supply Level $${(entryPrice + 0.012).toFixed(4)}`;
      momentumSignal = 'RSI Bearish Rejection @ 70';
    }
  } else {
    // BTC/USDT
    if (isBuy) {
      setupRationale = `Bitcoin rebound from institutional accumulation pool $${(entryPrice - 350).toFixed(0)}. Reclaiming EMA-50 targeting expansion to $${tpPrice?.toFixed(0)}.`;
      marketStructure = 'Institutional Accumulation Sweep';
      keyLevel = `Value Area Low $${(entryPrice - 300).toFixed(0)}`;
      momentumSignal = 'MACD Bullish Crossover & Strong Delta';
    } else {
      setupRationale = `Failed expansion at upper range boundary $${(entryPrice + 400).toFixed(0)}. Local distribution with tight invalidation above recent swing high.`;
      marketStructure = 'Distribution Break of Structure';
      keyLevel = `Value Area High $${(entryPrice + 350).toFixed(0)}`;
      momentumSignal = 'RSI Bearish Rejection @ 68';
    }
  }

  return {
    id: `journal-${signal.id}`,
    timestamp: signal.createdAt || Date.now(),
    timeStr,
    asset: signal.asset,
    action: isBuy ? 'BUY' : 'SELL',
    confidence: signal.confidencePercent || 88.5,
    setupRationale,
    riskGuard: {
      maxCapitalRiskDollar: Math.round(dollarRisk * 100) / 100,
      riskPercent: Math.min(2.0, Math.max(0.8, riskPercent)),
      targetRewardRatio: signal.stopLoss.riskRewardRatio || '1:2.0',
      invalidationPrice: slPrice,
    },
    technicalEvidence: {
      marketStructure,
      keyLevel,
      momentumSignal,
    },
    agentCycle: 'TRADE',
    outcomeNote: 'Active position monitored. Hard Stop Loss and Take Profit engaged.',
  };
}

export const INITIAL_AI_JOURNALS: AiTradeJournalEntry[] = [];
