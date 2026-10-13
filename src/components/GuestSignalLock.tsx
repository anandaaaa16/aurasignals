import React from 'react';
import { Lock, Sparkles, KeyRound } from 'lucide-react';

interface GuestSignalLockProps {
  onOpenAccessModal: () => void;
}

export const GuestSignalLock: React.FC<GuestSignalLockProps> = ({ onOpenAccessModal }) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 pointer-events-auto">
      <button
        onClick={onOpenAccessModal}
        className="group px-5 py-3 rounded-2xl bg-[#03131d]/80 backdrop-blur-xl border border-teal-500/40 hover:border-teal-300 text-white shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-3 ring-1 ring-white/10"
      >
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
          <Lock className="w-4 h-4 text-amber-400 stroke-[2.5]" />
        </div>

        <div className="text-left font-mono">
          <div className="text-xs sm:text-sm font-black tracking-wide text-white group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
            <span>Join VIP for full access</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-[10px] text-teal-400/80 flex items-center gap-1 mt-0.5">
            <KeyRound className="w-3 h-3 text-teal-300" />
            <span>Enter PIN code to unlock</span>
          </div>
        </div>
      </button>
    </div>
  );
};
