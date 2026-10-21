import React from 'react';
import { Play, Pause, Bot, Sparkles, Activity } from 'lucide-react';

interface BotControlBannerProps {
  isBotRunning: boolean;
  onToggleBot: (running: boolean) => void;
  activeCount: number;
}

export const BotControlBanner: React.FC<BotControlBannerProps> = ({
  isBotRunning,
  onToggleBot,
  activeCount,
}) => {
  return (
    <div
      className={`rounded-3xl p-3.5 sm:p-4 border transition-all shadow-xl backdrop-blur-2xl ${
        isBotRunning
          ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-teal-950/40 border-emerald-500/35 shadow-emerald-500/10'
          : 'bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-amber-950/30 border-amber-500/30 shadow-amber-500/10'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Bot Status Badge & Description */}
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl border shrink-0 transition-all ${
              isBotRunning
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-500/20'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}
          >
            <Bot className={`w-5 h-5 ${isBotRunning ? 'animate-bounce' : ''}`} />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm font-mono tracking-wide text-white">
                BOT AI TRADING 10X
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isBotRunning
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isBotRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>{isBotRunning ? 'AKTIF (RUNNING)' : 'STANDBY (OFF)'}</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-300/90 font-sans leading-tight">
              {isBotRunning
                ? `Bot aktif memindai order flow Binance (${activeCount} posisi aktif terkelola).`
                : 'Bot dalam keadaan nonaktif. Tekan tombol untuk mulai trading otomatis.'}
            </p>
          </div>
        </div>

        {/* Right: Master Start / Pause Button */}
        <div className="flex items-center gap-2 sm:self-center">
          {isBotRunning ? (
            <button
              onClick={() => onToggleBot(false)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-rose-300 border border-rose-500/40 font-mono font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Jeda / Matikan Bot</span>
            </button>
          ) : (
            <button
              onClick={() => onToggleBot(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 text-slate-950 font-mono font-black text-xs tracking-wider shadow-lg shadow-emerald-500/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer animate-pulse"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>NYALAKAN BOT AI SEKARANG</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
