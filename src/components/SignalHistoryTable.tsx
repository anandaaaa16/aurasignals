import React, { useState, useMemo } from 'react';
import { ClosedTrade } from '../types';
import { WavePlaybackChart } from './WavePlaybackChart';
import { Trophy, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Calendar, Filter } from 'lucide-react';

interface SignalHistoryTableProps {
  trades: ClosedTrade[];
}

export const SignalHistoryTable: React.FC<SignalHistoryTableProps> = ({ trades }) => {
  // Available distinct dates from trades
  const dateOptions = useMemo(() => {
    const dates = Array.from(new Set(trades.map((t) => t.dateStr)));
    return dates;
  }, [trades]);

  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [assetFilter, setAssetFilter] = useState<'ALL' | 'BTC/USDT' | 'XAU/USD'>('ALL');

  // Filter trades based on date & asset
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      const matchDate = selectedDate === 'ALL' || t.dateStr === selectedDate;
      const matchAsset = assetFilter === 'ALL' || t.asset === assetFilter;
      return matchDate && matchAsset;
    });
  }, [trades, selectedDate, assetFilter]);

  // Compute daily accuracy statistics
  const stats = useMemo(() => {
    const total = filteredTrades.length;
    const wins = filteredTrades.filter((t) => t.hitType === 'HIT_TP').length;
    const losses = filteredTrades.filter((t) => t.hitType === 'HIT_SL').length;
    const winRate = total > 0 ? Math.round((wins / total) * 1000) / 10 : 0;
    const netPips = filteredTrades.reduce((acc, t) => acc + t.pnlPips, 0);
    const netPercent = Math.round(filteredTrades.reduce((acc, t) => acc + t.pnlPercent, 0) * 100) / 100;

    return { total, wins, losses, winRate, netPips, netPercent };
  }, [filteredTrades]);

  // Format date display label dynamically
  const getDateLabel = (dateStr: string) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const yestDate = new Date(now.getTime() - 86400000);
    const yestStr = `${yestDate.getFullYear()}-${pad(yestDate.getMonth() + 1)}-${pad(yestDate.getDate())}`;

    const [, month, day] = dateStr.split('-');
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const mName = monthNames[parseInt(month)] || 'Okt';

    if (dateStr === todayStr) return `Hari Ini (${day} ${mName})`;
    if (dateStr === yestStr) return `Kemarin (${day} ${mName})`;
    return `${day} ${mName}`;
  };

  return (
    <div className="space-y-3.5 animate-in fade-in pb-12">
      {/* 1. Daily Accuracy Summary Hero Card */}
      <div className="relative overflow-hidden glass-panel rounded-3xl p-4 sm:p-5 shadow-2xl border border-teal-500/20">
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Date Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
          <button
            onClick={() => setSelectedDate('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedDate === 'ALL'
                ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Semua Hari
          </button>
          {dateOptions.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedDate === d
                  ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {getDateLabel(d)}
            </button>
          ))}
        </div>

        {/* Big Win Rate & Profitability Grid */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Akurasi Signal {selectedDate === 'ALL' ? '(Semua)' : getDateLabel(selectedDate)}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight mt-0.5">
              {stats.winRate}% <span className="text-xs sm:text-sm font-semibold text-slate-300">Win Rate</span>
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
              Net Profit
            </div>
            <div className={`text-lg sm:text-xl font-black ${stats.netPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stats.netPercent >= 0 ? '+' : ''}{stats.netPercent}%
            </div>
            <div className="text-[10px] text-slate-400">
              {stats.netPips >= 0 ? '+' : ''}{stats.netPips} pips/pts
            </div>
          </div>
        </div>

        {/* Win vs Loss Transparent Bar (Rugi & Untung Kelihatan Jelas) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats.wins} Hit TP (Menang)</span>
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <XCircle className="w-3.5 h-3.5" />
              <span>{stats.losses} Hit SL (Rugi)</span>
            </span>
          </div>

          <div className="w-full bg-slate-950/80 h-2.5 rounded-full overflow-hidden flex p-0.5 border border-white/5">
            <div
              className="bg-emerald-400 h-full rounded-l-full transition-all duration-500 shadow-sm shadow-emerald-400/50"
              style={{ width: `${stats.total > 0 ? (stats.wins / stats.total) * 100 : 0}%` }}
            />
            <div
              className="bg-rose-500 h-full rounded-r-full transition-all duration-500 shadow-sm shadow-rose-500/50"
              style={{ width: `${stats.total > 0 ? (stats.losses / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Asset Filter Pill Strip */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-mono text-slate-400 font-semibold">
          Daftar Eksekusi ({filteredTrades.length} Sinyal Selesai)
        </span>
        <div className="flex items-center gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-white/10 text-[10px] font-mono">
          <button
            onClick={() => setAssetFilter('ALL')}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
              assetFilter === 'ALL' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setAssetFilter('BTC/USDT')}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
              assetFilter === 'BTC/USDT' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400'
            }`}
          >
            BTC
          </button>
          <button
            onClick={() => setAssetFilter('XAU/USD')}
            className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
              assetFilter === 'XAU/USD' ? 'bg-teal-500/20 text-teal-300' : 'text-slate-400'
            }`}
          >
            GOLD
          </button>
        </div>
      </div>

      {/* 2. Simplified Trade Items with Smooth Wave Chart Playback */}
      <div className="space-y-3">
        {filteredTrades.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 border border-teal-500/20 text-center space-y-2 font-mono">
            <Trophy className="w-8 h-8 text-teal-400 mx-auto animate-pulse" />
            <div className="text-sm font-bold text-white">
              Riwayat Trading Fresh (Mulai Hari Ini)
            </div>
            <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto">
              Belum ada posisi yang selesai hari ini. Setiap sinyal yang menyentuh TP atau SL akan langsung tercatat otomatis di tabel akurasi ini.
            </p>
          </div>
        ) : (
          filteredTrades.map((t) => {
          const isWin = t.hitType === 'HIT_TP';
          const isBuy = t.direction === 'BUY';
          const isGold = t.asset === 'XAU/USD';

          return (
            <div
              key={t.id}
              className={`p-3.5 glass-panel-subtle rounded-2xl border transition-all ${
                isWin ? 'border-emerald-500/20 hover:border-emerald-500/40' : 'border-rose-500/20 hover:border-rose-500/40'
              }`}
            >
              {/* Top Row: Asset, Direction, Outcome Badge & PnL */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isBuy
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {isBuy ? <ArrowUpRight className="w-4 h-4 stroke-[2.5]" /> : <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white">{t.asset}</span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold bg-white/5 px-1 rounded">
                        {t.direction}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {t.timeStr}
                    </div>
                  </div>
                </div>

                {/* Outcome & PnL Pill (Hit TP / Hit SL + % + pips) */}
                <div className="text-right font-mono">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isWin
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {isWin ? 'HIT TP 🎯' : 'HIT SL 🛑'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className={`text-xs font-black ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ({t.pnlPips >= 0 ? '+' : ''}{t.pnlPips} {isGold ? 'pips' : 'pts'})
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Smooth Continuous Wave Chart ("grafik nyambung kaya ombak gitu") */}
              <WavePlaybackChart
                points={t.waveTrajectory}
                isWin={isWin}
                entryPrice={t.entryPrice}
                exitPrice={t.exitPrice}
                isGold={isGold}
              />
            </div>
          );
        }))}
      </div>
    </div>
  );
};
