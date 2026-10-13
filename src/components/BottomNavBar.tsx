import React from 'react';
import { Radio, Calendar, BarChart2 } from 'lucide-react';

export type NavSection = 'chart' | 'daily_pnl' | 'accuracy';

interface BottomNavBarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeSection,
  onSelectSection,
}) => {
  return (
    <div className="fixed bottom-3 left-3 right-3 max-w-md mx-auto z-40 pointer-events-auto animate-in slide-in-from-bottom-3">
      {/* Modern High-End Frosted Glass Bottom Bar with 3 Menus */}
      <div className="relative backdrop-blur-3xl bg-[#03131d]/85 text-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] p-1.5 flex items-center justify-between border border-teal-500/30 ring-1 ring-white/10 overflow-hidden">
        {/* Soft internal gradient ambient shine */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-cyan-500/10 pointer-events-none" />

        {/* 1. Sinyal Live */}
        <button
          onClick={() => onSelectSection('chart')}
          className={`relative z-10 flex-1 py-2 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
            activeSection === 'chart'
              ? 'bg-gradient-to-r from-teal-500/25 to-emerald-500/20 text-teal-200 border border-teal-400/40 shadow-[0_0_15px_rgba(20,184,166,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              activeSection === 'chart' ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400' : 'bg-slate-500'
            }`}
          />
          <span className="whitespace-nowrap">Sinyal Live</span>
        </button>

        <div className="w-px h-5 bg-teal-500/20 mx-0.5 shrink-0" />

        {/* 2. Daily PNL (Menu Baru) */}
        <button
          onClick={() => onSelectSection('daily_pnl')}
          className={`relative z-10 flex-1 py-2 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
            activeSection === 'daily_pnl'
              ? 'bg-gradient-to-r from-teal-500/25 to-emerald-500/20 text-teal-200 border border-teal-400/40 shadow-[0_0_15px_rgba(20,184,166,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Calendar
            className={`w-3.5 h-3.5 ${activeSection === 'daily_pnl' ? 'text-teal-300' : 'text-slate-400'}`}
          />
          <span className="whitespace-nowrap">Daily PNL</span>
        </button>

        <div className="w-px h-5 bg-teal-500/20 mx-0.5 shrink-0" />

        {/* 3. Akurasi Signal */}
        <button
          onClick={() => onSelectSection('accuracy')}
          className={`relative z-10 flex-1 py-2 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer ${
            activeSection === 'accuracy'
              ? 'bg-gradient-to-r from-teal-500/25 to-emerald-500/20 text-teal-200 border border-teal-400/40 shadow-[0_0_15px_rgba(20,184,166,0.3)]'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <BarChart2
            className={`w-3.5 h-3.5 ${activeSection === 'accuracy' ? 'text-teal-300' : 'text-slate-400'}`}
          />
          <span className="whitespace-nowrap">Akurasi Signal</span>
        </button>
      </div>
    </div>
  );
};
