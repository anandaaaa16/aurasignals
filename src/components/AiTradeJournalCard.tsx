import React, { useState } from 'react';
import { AiTradeJournalEntry, SignalData } from '../types';
import { Brain, ShieldCheck, FileText, ChevronDown, ChevronUp, Zap, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AiTradeJournalCardProps {
  currentJournal: AiTradeJournalEntry | null;
  historicalJournals: AiTradeJournalEntry[];
  isMarketClosed?: boolean;
}

export const AiTradeJournalCard: React.FC<AiTradeJournalCardProps> = ({
  currentJournal,
  historicalJournals,
  isMarketClosed,
}) => {
  const [showHistory, setShowHistory] = useState<boolean>(false);

  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-teal-500/25 shadow-2xl space-y-3.5 backdrop-blur-2xl">
      {/* Top Header: AI Trading Agent & 3-Step Autonomous Loop Status */}
      <div className="flex items-center justify-between border-b border-teal-500/15 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300">
            <Brain className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-white font-mono tracking-wide flex items-center gap-1.5">
              <span>AI Trading Agent</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
            </h3>
            <span className="text-[10px] text-teal-400/80 font-mono block">
              Siklus: Research ➔ Trade ➔ Journal
            </span>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-950/80 border border-teal-500/25 text-[10px] text-teal-300 font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Risk Guard 1.5%</span>
          </span>
        </div>
      </div>

      {/* Jurnal Posisi Aktif Saat Ini */}
      {currentJournal ? (
        <div className="space-y-3">
          {/* Action & Confidence Bar */}
          <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-2xl border border-teal-500/20 font-mono">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-xl text-xs font-black tracking-wide ${
                  currentJournal.action === 'BUY'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : currentJournal.action === 'SELL'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {currentJournal.action} {currentJournal.asset}
              </span>
              <span className="text-[11px] text-slate-400">
                Pukul {currentJournal.timeStr}
              </span>
            </div>

            <div className="text-right text-xs">
              <span className="text-[10px] text-slate-400 block">AI Confidence</span>
              <span className="font-black text-cyan-300">{currentJournal.confidence}%</span>
            </div>
          </div>

          {/* Rationale / Alasan Mengapa Posisi Dibuka */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-teal-500/20 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-teal-300 font-bold">
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              <span>Analisa & Alasan Masuk Pasar (Setup Log):</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {currentJournal.setupRationale}
            </p>
          </div>

          {/* 3-Layer Risk Protection & Technical Evidence Grid */}
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="p-2.5 rounded-2xl bg-slate-900/50 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">
                🛡️ Proteksi Risiko Akun
              </span>
              <div className="text-slate-200">
                Max Loss: <strong className="text-rose-400">${currentJournal.riskGuard.maxCapitalRiskDollar.toFixed(2)}</strong> ({currentJournal.riskGuard.riskPercent}%)
              </div>
              <div className="text-slate-200">
                Target R:R: <strong className="text-emerald-400">{currentJournal.riskGuard.targetRewardRatio}</strong>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-900/50 border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 block font-semibold">
                ⚡ Konfirmasi Teknikal
              </span>
              <div className="text-slate-300 truncate" title={currentJournal.technicalEvidence.marketStructure}>
                {currentJournal.technicalEvidence.marketStructure}
              </div>
              <div className="text-teal-300 truncate" title={currentJournal.technicalEvidence.keyLevel}>
                {currentJournal.technicalEvidence.keyLevel}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-teal-500/15 text-center space-y-1">
          <Clock className="w-5 h-5 text-teal-400 mx-auto animate-pulse" />
          <p className="text-xs font-mono font-bold text-slate-200">
            {isMarketClosed ? 'Bursa Libur · AI Agent Standby' : 'AI Agent Scanning Market...'}
          </p>
          <p className="text-[11px] text-slate-400 font-mono">
            {isMarketClosed
              ? 'Posisi otomatis ditutup flat tanpa risiko akhir pekan.'
              : 'Menunggu konfirmasi pola probabilitas tinggi sebelum entry.'}
          </p>
        </div>
      )}

      {/* Accordion Toggle: Riwayat Audit Jurnal Sebelumnya */}
      <div className="pt-1 border-t border-teal-500/15">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between text-xs font-mono text-slate-400 hover:text-teal-300 transition-colors py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Audit Trail: Catatan Jurnal Sebelumnya ({historicalJournals.length})</span>
          </span>
          {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHistory && (
          <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-1">
            {historicalJournals.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1 text-[11px] font-mono"
              >
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-bold text-white flex items-center gap-1">
                    <span className={item.action === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                      {item.action}
                    </span>
                    <span>{item.asset}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-[10px] text-slate-400">{item.timeStr}</span>
                  </span>
                  <span className="text-[10px] text-teal-300 font-semibold">
                    Conf: {item.confidence}%
                  </span>
                </div>

                <p className="text-slate-400 text-[11px] font-sans leading-relaxed">
                  {item.setupRationale}
                </p>

                {item.outcomeNote && (
                  <div className="text-[10px] text-slate-300 font-semibold pt-0.5 border-t border-white/5">
                    {item.outcomeNote}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
