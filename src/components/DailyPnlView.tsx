import React, { useMemo } from 'react';
import { ClosedTrade } from '../types';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Trophy, Award, CheckCircle2, ChevronRight } from 'lucide-react';

interface DailyPnlViewProps {
  trades: ClosedTrade[];
}

interface DailyRecord {
  dateStr: string;
  formattedDate: string;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPips: number;
  netDollar: number;
  netPercent: number;
  isProfit: boolean;
}

export const DailyPnlView: React.FC<DailyPnlViewProps> = ({ trades }) => {
  // Aggregate trades by dateStr
  const dailyRecords: DailyRecord[] = useMemo(() => {
    const map = new Map<string, ClosedTrade[]>();

    // If trades list is empty, return empty
    trades.forEach((t) => {
      const existing = map.get(t.dateStr) || [];
      existing.push(t);
      map.set(t.dateStr, existing);
    });

    const dates = Array.from(map.keys()).sort().reverse();

    return dates.map((dateStr) => {
      const items = map.get(dateStr)!;
      const totalTrades = items.length;
      const wins = items.filter((i) => i.hitType === 'HIT_TP').length;
      const losses = items.filter((i) => i.hitType === 'HIT_SL').length;
      const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 1000) / 10 : 0;
      const totalPips = items.reduce((acc, i) => acc + i.pnlPips, 0);

      // Dollar calculation based on $500 account sizing (0.05 lot Gold = $5/pt, 0.02 lot BTC = $0.02/pt)
      const netDollar = items.reduce((acc, i) => {
        const gain =
          i.asset === 'XAU/USD'
            ? (i.exitPrice - i.entryPrice) * (i.direction === 'BUY' ? 1 : -1) * 5
            : (i.exitPrice - i.entryPrice) * (i.direction === 'BUY' ? 1 : -1) * 0.02;
        return acc + gain;
      }, 0);

      const netPercent = Math.round((netDollar / 500) * 100 * 10) / 10;

      // Formatting readable date string
      const [year, month, day] = dateStr.split('-');
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const formattedDate = `${day} ${monthNames[parseInt(month)] || month} ${year}`;

      return {
        dateStr,
        formattedDate,
        totalTrades,
        wins,
        losses,
        winRate,
        totalPips,
        netDollar: Math.round(netDollar * 100) / 100,
        netPercent,
        isProfit: netDollar >= 0,
      };
    });
  }, [trades]);

  // Overall Totals
  const totalNetDollar = useMemo(
    () => Math.round(dailyRecords.reduce((acc, r) => acc + r.netDollar, 0) * 100) / 100,
    [dailyRecords]
  );
  const totalNetPercent = Math.round((totalNetDollar / 500) * 100 * 10) / 10;
  const profitableDaysCount = dailyRecords.filter((r) => r.isProfit).length;
  const bestDay = useMemo(() => {
    if (dailyRecords.length === 0) return null;
    return [...dailyRecords].sort((a, b) => b.netDollar - a.netDollar)[0];
  }, [dailyRecords]);

  return (
    <div className="space-y-4 animate-in fade-in pb-12">
      {/* 1. Daily PnL Hero Overview Card */}
      <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-teal-500/25 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-3 border-b border-teal-500/15 mb-3.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                Rekap Daily PnL
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Akumulasi Laba / Rugi Harian Berdasarkan Sinyal
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
            {profitableDaysCount} / {dailyRecords.length} Profit Days
          </span>
        </div>

        {/* Big Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-teal-500/20 col-span-1">
            <span className="text-[10px] text-slate-400 block mb-0.5">Total Keuntungan Akumulasi</span>
            <div className={`text-xl sm:text-2xl font-black tabular-nums ${totalNetDollar >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalNetDollar >= 0 ? '+' : ''}${totalNetDollar.toFixed(2)}
            </div>
            <span className="text-[10px] text-teal-300 font-bold block mt-0.5">
              +{totalNetPercent}% Return Modal
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-teal-500/20 col-span-1">
            <span className="text-[10px] text-slate-400 block mb-0.5">Hari Terbaik (Best Day)</span>
            <div className="text-xl sm:text-2xl font-black text-amber-300 tabular-nums">
              +${bestDay?.netDollar.toFixed(2) || '0.00'}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {bestDay?.formattedDate || '---'} (+{bestDay?.netPercent}%)
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-teal-500/20 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block mb-0.5">Rata-rata Profit / Hari</span>
            <div className="text-lg sm:text-xl font-black text-white tabular-nums">
              +${dailyRecords.length > 0 ? (totalNetDollar / dailyRecords.length).toFixed(2) : '0.00'}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
              Konsisten Profit Harian
            </span>
          </div>
        </div>
      </div>

      {/* 2. Daily Cards Breakdown List */}
        <div className="flex items-center justify-between px-1 text-xs font-mono text-slate-400">
          <span>CATATAN TRANSAKSI PER HARI</span>
          <span>BASIS MODAL $500</span>
        </div>

        <div className="space-y-3">
          {dailyRecords.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 border border-teal-500/20 text-center space-y-2 font-mono">
            <Calendar className="w-8 h-8 text-teal-400 mx-auto animate-pulse" />
            <div className="text-sm font-bold text-white">
              Sesi Trading Baru Hari Ini Aktif
            </div>
            <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto">
              Platform telah dimulai fresh hari ini. Rekap PnL harian akan otomatis tercatat transparan begitu transaksi pertama selesai.
            </p>
          </div>
        ) : (
          dailyRecords.map((record) => (
            <div
              key={record.dateStr}
              className="glass-panel rounded-2xl p-3.5 sm:p-4 border border-teal-500/20 hover:border-teal-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
            {/* Left: Date & Trade Counts */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  record.isProfit
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                }`}
              >
                {record.isProfit ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white font-mono">
                    {record.formattedDate}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                      record.isProfit
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {record.isProfit ? 'PROFIT DAY' : 'LOSS DAY'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                  <span>{record.totalTrades} Trade</span>
                  <span>·</span>
                  <span className="text-emerald-400 font-bold">{record.wins} Win</span>
                  <span>·</span>
                  <span className="text-rose-400 font-bold">{record.losses} Loss</span>
                  <span>·</span>
                  <span className="text-teal-300 font-bold">{record.winRate}% Win Rate</span>
                </div>
              </div>
            </div>

            {/* Right: Profit Dollar & Return */}
            <div className="flex items-center justify-between sm:justify-end gap-4 font-mono pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
              <div className="text-left sm:text-right">
                <div
                  className={`text-base sm:text-lg font-black tabular-nums ${
                    record.isProfit ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {record.isProfit ? '+' : ''}${record.netDollar.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400">
                  {record.isProfit ? '+' : ''}{record.netPercent}% Return
                </div>
              </div>

              <div className="text-right text-[11px] font-semibold text-teal-300/80 bg-teal-500/10 px-2 py-1 rounded-lg border border-teal-500/20">
                +{record.totalPips} pips
              </div>
            </div>
          </div>
        ))
      )}
    </div>
    </div>
  );
};
