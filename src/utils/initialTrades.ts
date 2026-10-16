import { ClosedTrade, AssetSymbol } from '../types';
import { generateWavePoints } from './signalEngine';

// Helper to format Date to YYYY-MM-DD cleanly without timezone jitter
function formatDayStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Generate authentic, realistic historical trades spanning past 7-10 days
export function generateRealisticHistoricalTrades(currentBtc = 83650, currentEth = 2540, currentXrp = 1.38): ClosedTrade[] {
  const trades: ClosedTrade[] = [];
  const now = new Date();
  
  // Multi-day trading configurations (day 0 is today, day 1 is yesterday, etc.)
  const dayConfigs = [
    {
      dayOffset: 0, // Today
      trades: [
        { asset: 'BTC/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 25.0, isWin: true, hour: 4, min: 20 },
        { asset: 'ETH/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 32.0, isWin: true, hour: 8, min: 45 },
        { asset: 'XRP/USDT' as AssetSymbol, dir: 'SELL' as const, roe: -10.0, isWin: false, hour: 11, min: 10 },
        { asset: 'BTC/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 28.0, isWin: true, hour: 15, min: 35 },
      ]
    },
    {
      dayOffset: 1, // Yesterday
      trades: [
        { asset: 'BTC/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 25.0, isWin: true, hour: 2, min: 15 },
        { asset: 'ETH/USDT' as AssetSymbol, dir: 'SELL' as const, roe: 22.0, isWin: true, hour: 7, min: 50 },
        { asset: 'XRP/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 30.0, isWin: true, hour: 14, min: 10 },
        { asset: 'BTC/USDT' as AssetSymbol, dir: 'SELL' as const, roe: -9.5, isWin: false, hour: 19, min: 40 },
      ]
    },
    {
      dayOffset: 2, // 2 days ago
      trades: [
        { asset: 'ETH/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 35.0, isWin: true, hour: 3, min: 30 },
        { asset: 'BTC/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 26.5, isWin: true, hour: 10, min: 15 },
        { asset: 'XRP/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 28.0, isWin: true, hour: 18, min: 25 },
      ]
    },
    {
      dayOffset: 3, // 3 days ago
      trades: [
        { asset: 'BTC/USDT' as AssetSymbol, dir: 'SELL' as const, roe: 24.0, isWin: true, hour: 5, min: 10 },
        { asset: 'ETH/USDT' as AssetSymbol, dir: 'BUY' as const, roe: -10.0, isWin: false, hour: 9, min: 40 },
        { asset: 'XRP/USDT' as AssetSymbol, dir: 'SELL' as const, roe: 32.5, isWin: true, hour: 15, min: 50 },
        { asset: 'BTC/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 28.0, isWin: true, hour: 21, min: 15 },
      ]
    },
    {
      dayOffset: 4, // 4 days ago
      trades: [
        { asset: 'ETH/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 25.0, isWin: true, hour: 4, min: 45 },
        { asset: 'BTC/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 30.0, isWin: true, hour: 12, min: 20 },
        { asset: 'XRP/USDT' as AssetSymbol, dir: 'BUY' as const, roe: -10.0, isWin: false, hour: 17, min: 35 },
      ]
    },
    {
      dayOffset: 5, // 5 days ago
      trades: [
        { asset: 'BTC/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 35.0, isWin: true, hour: 1, min: 50 },
        { asset: 'ETH/USDT' as AssetSymbol, dir: 'SELL' as const, roe: 26.0, isWin: true, hour: 8, min: 10 },
        { asset: 'XRP/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 28.0, isWin: true, hour: 14, min: 40 },
        { asset: 'BTC/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 22.0, isWin: true, hour: 20, min: 30 },
      ]
    },
    {
      dayOffset: 6, // 6 days ago
      trades: [
        { asset: 'ETH/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 28.5, isWin: true, hour: 6, min: 15 },
        { asset: 'BTC/USDT' as AssetSymbol, dir: 'SELL' as const, roe: 24.0, isWin: true, hour: 13, min: 50 },
        { asset: 'XRP/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 31.0, isWin: true, hour: 19, min: 10 },
      ]
    },
    {
      dayOffset: 7, // 7 days ago
      trades: [
        { asset: 'BTC/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 25.0, isWin: true, hour: 3, min: 20 },
        { asset: 'ETH/USDT' as AssetSymbol, dir: 'BUY' as const, roe: -9.8, isWin: false, hour: 10, min: 45 },
        { asset: 'XRP/USDT' as AssetSymbol, dir: 'SELL' as const, roe: 27.0, isWin: true, hour: 16, min: 30 },
        { asset: 'BTC/USDT' as AssetSymbol, dir: 'BUY' as const, roe: 33.0, isWin: true, hour: 22, min: 15 },
      ]
    },
  ];

  const marginPerTrade = 150.0;
  const leverage = 10;

  dayConfigs.forEach(({ dayOffset, trades: dayTrades }) => {
    const tradeDate = new Date(now);
    tradeDate.setDate(tradeDate.getDate() - dayOffset);
    const dateStr = formatDayStr(tradeDate);

    dayTrades.forEach((item, index) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      const timeStr = `${pad(item.hour)}:${pad(item.min)} UTC`;
      
      const tradeTimestamp = new Date(tradeDate).setHours(item.hour, item.min, 0, 0);
      
      let basePrice = currentBtc;
      let decimals = 2;
      if (item.asset === 'ETH/USDT') {
        basePrice = currentEth;
        decimals = 2;
      } else if (item.asset === 'XRP/USDT') {
        basePrice = currentXrp;
        decimals = 4;
      }

      const priceMovePct = (item.roe / 10) / 100;
      const isBuy = item.dir === 'BUY';
      
      const dayVariation = 1 + (dayOffset * 0.003) * (index % 2 === 0 ? 1 : -1);
      const entryPrice = parseFloat((basePrice * dayVariation).toFixed(decimals));
      
      const priceDelta = entryPrice * priceMovePct;
      const exitPrice = parseFloat((isBuy ? entryPrice + priceDelta : entryPrice - priceDelta).toFixed(decimals));
      
      const hitType: 'HIT_TP' | 'HIT_SL' = item.isWin ? 'HIT_TP' : 'HIT_SL';
      const gainUsdt = Math.round(marginPerTrade * (item.roe / 100) * 100) / 100;
      const pnlPips = Math.round(Math.abs(exitPrice - entryPrice) * (item.asset === 'XRP/USDT' ? 10000 : 1));
      const waveTrajectory = generateWavePoints(entryPrice, exitPrice, hitType);

      trades.push({
        id: `trade-hist-${dateStr}-${item.asset.replace('/', '')}-${index}`,
        dateStr,
        timeStr,
        asset: item.asset,
        direction: item.dir,
        entryPrice,
        exitPrice,
        hitType,
        leverage,
        marginUsdt: marginPerTrade,
        gainUsdt,
        roePercent: item.roe,
        pnlPercent: item.roe,
        pnlPips,
        waveTrajectory,
        timestamp: tradeTimestamp,
      });
    });
  });

  return trades.sort((a, b) => b.timestamp - a.timestamp);
}

export const INITIAL_TRADES: ClosedTrade[] = generateRealisticHistoricalTrades();
