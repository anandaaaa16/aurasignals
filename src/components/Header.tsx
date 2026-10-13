import React from 'react';
import { Sparkles, Bell, BellOff, Activity } from 'lucide-react';

interface HeaderProps {
  activeSection: 'chart' | 'history';
  onSelectSection: (section: 'chart' | 'history') => void;
  onOpenAiScan: () => void;
  isAiLoading: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isLiveTicking: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onSelectSection,
  onOpenAiScan,
  isAiLoading,
  soundEnabled,
  onToggleSound,
  isLiveTicking,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-14 sm:h-16">
          {/* Brand + Live Status */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectSection('chart');
              }}
              className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap"
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-amber-400 to-amber-600 inline-block" />
              <span>AuraSignals</span>
            </a>

            {/* Real-time 1-second pulse badge */}
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${isLiveTicking ? 'animate-ping' : ''}`} />
              <span className="hidden sm:inline">1s LIVE</span>
            </div>
          </div>

          {/* Primary View Switcher: Mobile Thumb Optimized */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => onSelectSection('chart')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors min-h-[36px] flex items-center gap-1.5 ${
                activeSection === 'chart'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Sinyal Live</span>
            </button>
            <button
              onClick={() => onSelectSection('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors min-h-[36px] flex items-center gap-1.5 ${
                activeSection === 'history'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Riwayat Akurasi</span>
            </button>
          </div>

          {/* Actions: Sound & AI Scan */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Matikan Notifikasi Suara' : 'Aktifkan Notifikasi Suara'}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Toggle Sound"
            >
              {soundEnabled ? <Bell className="w-4 h-4 text-amber-400" /> : <BellOff className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenAiScan}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg transition-colors whitespace-nowrap min-h-[36px] shadow-sm disabled:opacity-60"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isAiLoading ? 'Memindai...' : 'Analisis AI'}</span>
              <span className="sm:hidden">{isAiLoading ? '...' : 'AI'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
