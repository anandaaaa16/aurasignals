import React from 'react';
import { Lock, KeyRound, Sparkles } from 'lucide-react';

interface GuestSignalLockProps {
  onOpenAccessModal: () => void;
}

export const GuestSignalLock: React.FC<GuestSignalLockProps> = ({ onOpenAccessModal }) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-5 bg-[#020b0e]/75 backdrop-blur-md rounded-3xl border border-teal-500/30 text-center space-y-3.5 shadow-2xl animate-in fade-in">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shadow-lg shadow-teal-500/10">
        <Lock className="w-7 h-7 text-amber-400 stroke-[2.5]" />
      </div>

      <div className="space-y-1 max-w-xs">
        <h3 className="text-base font-black font-mono text-white tracking-wide flex items-center justify-center gap-1.5">
          <span>SINYAL & BOT AI TERKUNCI</span>
        </h3>
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          Posisi live BUY / SELL, target TP & SL, serta analisis AI Trading Agent hanya dapat diakses oleh <strong className="text-teal-300">VIP Member & Admin</strong>.
        </p>
      </div>

      <button
        onClick={onOpenAccessModal}
        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 text-slate-950 font-mono font-black text-xs tracking-wide shadow-xl shadow-teal-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
      >
        <KeyRound className="w-4 h-4 text-slate-950" />
        <span>Buka Akses dengan PIN 6-Digit</span>
      </button>

      <span className="text-[10px] text-slate-400 font-mono">
        💡 Rekap laba/rugi tetap dapat Anda pantau bebas di menu <strong>Daily PNL</strong>
      </span>
    </div>
  );
};
