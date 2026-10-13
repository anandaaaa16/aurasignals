import React from 'react';
import { Lock, Sparkles, KeyRound, QrCode } from 'lucide-react';

interface GuestSignalLockProps {
  onOpenAccessModal: () => void;
  onOpenVipPayment?: () => void;
}

export const GuestSignalLock: React.FC<GuestSignalLockProps> = ({
  onOpenAccessModal,
  onOpenVipPayment,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 pointer-events-auto gap-2">
      <button
        type="button"
        onClick={onOpenVipPayment || onOpenAccessModal}
        className="group px-5 py-3 rounded-2xl bg-[#03131d]/85 backdrop-blur-xl border border-teal-500/40 hover:border-teal-300 text-white shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-3 ring-1 ring-white/10"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
          <Lock className="w-5 h-5 text-amber-400 stroke-[2.5]" />
        </div>

        <div className="text-left font-mono">
          <div className="text-xs sm:text-sm font-black tracking-wide text-white group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
            <span>Join VIP for full access</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-[10px] text-teal-400/90 flex items-center gap-1 mt-0.5">
            <QrCode className="w-3 h-3 text-teal-300" />
            <span>Instant Activation via QRIS & USDT</span>
          </div>
        </div>
      </button>

      {/* Small subtle secondary link to enter existing PIN */}
      <button
        type="button"
        onClick={onOpenAccessModal}
        className="px-3 py-1 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 text-slate-400 hover:text-white text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all"
      >
        <KeyRound className="w-3 h-3 text-teal-300" />
        <span>Already a member? Enter 6-digit PIN</span>
      </button>
    </div>
  );
};
