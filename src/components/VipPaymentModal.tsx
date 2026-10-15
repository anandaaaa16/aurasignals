import React, { useState } from 'react';
import {
  X,
  Crown,
  CheckCircle,
  Copy,
  Check,
  Coins,
  Send,
  Zap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { VipPaymentRequest } from '../types';
import { submitVipPaymentRequest } from '../utils/tradeDbService';

interface VipPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAccessModal?: () => void;
}

export const VipPaymentModal: React.FC<VipPaymentModalProps> = ({
  isOpen,
  onClose,
  onOpenAccessModal,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'1_MONTH' | '3_MONTHS' | 'LIFETIME'>('3_MONTHS');
  const [usdtNetwork, setUsdtNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [copiedNetwork, setCopiedNetwork] = useState<string | null>(null);

  // Form states
  const [userName, setUserName] = useState('');
  const [userContact, setUserContact] = useState('');
  const [txRef, setTxRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isOpen) return null;

  const plans = {
    '1_MONTH': {
      title: '1 Month Access',
      usdt: '$15 USDT',
      tag: 'Flexible',
    },
    '3_MONTHS': {
      title: '3 Months VIP Pass',
      usdt: '$35 USDT',
      tag: 'Best Value · 22% OFF',
    },
    LIFETIME: {
      title: 'Lifetime Unlimited',
      usdt: '$89 USDT',
      tag: 'One-Time · VIP Lounge',
    },
  };

  const usdtAddresses = {
    TRC20: 'TDdQKPp5ASuQcVsrx8S7WvfTSmbyP6cfe9',
    BEP20: '0x77dD23FE65ABc031d5A73721ABa3caEeC67B8f18',
  };

  const handleCopy = (networkKey: 'TRC20' | 'BEP20', address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedNetwork(networkKey);
    setTimeout(() => setCopiedNetwork(null), 2500);
  };

  const currentPlan = plans[selectedPlan];
  const targetAmount = currentPlan.usdt;

  const handleWhatsAppConfirm = () => {
    const text = encodeURIComponent(
      `Halo Admin AuraSignals! Saya telah menyelesaikan transfer USDT untuk VIP Membership:\n\n` +
      `• Paket: ${currentPlan.title} (${targetAmount})\n` +
      `• Jaringan: ${usdtNetwork === 'TRC20' ? 'USDT TRC-20 (Tron)' : 'USDT BEP-20 (BSC)'}\n` +
      `• Alamat Penerima: ${usdtAddresses[usdtNetwork]}\n` +
      `• Nama Member: ${userName || 'Trader'}\n` +
      `• Kontak / WA: ${userContact || '-'}\n` +
      `• TxID / Hash: ${txRef || 'Sudah transfer'}\n\n` +
      `Mohon verifikasi dan aktifkan 6-digit VIP PIN saya. Terima kasih!`
    );
    window.open(`https://wa.me/6281234567890?text=${text}`, '_blank');
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userContact.trim()) return;

    setIsSubmitting(true);
    const req: VipPaymentRequest = {
      id: `vip-req-${Date.now()}`,
      userName: userName.trim(),
      contact: userContact.trim(),
      plan: selectedPlan,
      method: usdtNetwork === 'TRC20' ? 'USDT_TRC20' : 'USDT_BEP20',
      amount: targetAmount,
      status: 'PENDING',
      txProofOrRef: txRef.trim() || 'USDT transfer completed',
      createdAt: Date.now(),
    };

    const ok = await submitVipPaymentRequest(req);
    setIsSubmitting(false);
    if (ok) {
      setSubmitSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-5 sm:p-6 border border-teal-500/35 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/30 to-teal-500/20 border border-amber-400/40 text-amber-300 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/15">
            <Crown className="w-6 h-6 text-amber-400" />
          </div>

          <h2 className="text-xl font-black font-mono text-white tracking-wide">
            Upgrade to VIP Member (USDT)
          </h2>
          <p className="text-xs text-slate-400 font-sans">
            Unlock real-time 10x Crypto Futures signals, exact entry points, TP/SL, and institutional momentum news
          </p>
        </div>

        {/* VIP Perks */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 p-3 rounded-2xl bg-slate-950/60 border border-teal-500/20">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Uncensored Entry @ Levels</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>10x Futures Multiplier Setups</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Exact TP 1, TP 2 & Stop Loss</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Live Order Flow & Whale News</span>
          </div>
        </div>

        {/* 1. Plan Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-bold text-slate-300 block">
            Select Membership Plan:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['1_MONTH', '3_MONTHS', 'LIFETIME'] as const).map((key) => {
              const p = plans[key];
              const isSelected = selectedPlan === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPlan(key)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-gradient-to-b from-teal-500/20 to-emerald-500/10 border-teal-400 text-white shadow-lg shadow-teal-500/15'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {key === '3_MONTHS' && (
                    <span className="absolute -top-2 right-2 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black uppercase">
                      Popular
                    </span>
                  )}
                  <span className="text-[10px] font-mono block text-slate-400 truncate">
                    {key === '1_MONTH' ? '1 Month' : key === '3_MONTHS' ? '3 Months' : 'Lifetime'}
                  </span>
                  <span className="text-xs sm:text-sm font-black font-mono text-white block mt-0.5">
                    {p.usdt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. USDT WALLET ADDRESS CARDS (NO QR CODE AS REQUESTED) */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-teal-500/25 space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-teal-400" />
              <span>Official USDT Wallet Addresses:</span>
            </span>
            <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Transfer: {targetAmount}
            </span>
          </div>

          {/* Network Selection Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setUsdtNetwork('TRC20')}
              className={`p-2 rounded-xl text-xs font-bold cursor-pointer transition-all border text-center ${
                usdtNetwork === 'TRC20'
                  ? 'bg-teal-500/25 border-teal-400 text-teal-300 shadow-md'
                  : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              TRC-20 (Tron)
            </button>
            <button
              type="button"
              onClick={() => setUsdtNetwork('BEP20')}
              className={`p-2 rounded-xl text-xs font-bold cursor-pointer transition-all border text-center ${
                usdtNetwork === 'BEP20'
                  ? 'bg-teal-500/25 border-teal-400 text-teal-300 shadow-md'
                  : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              BEP-20 (BSC)
            </button>
          </div>

          {/* Address Display Box with 1-Click Copy */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-teal-500/30 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{usdtNetwork === 'TRC20' ? 'Tron Network (TRC-20)' : 'BNB Smart Chain (BEP-20)'}</span>
              <span className="text-[10px] text-teal-300 font-semibold">Instant Deposit</span>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950 border border-white/10">
              <span className="text-xs text-white font-mono break-all font-semibold select-all">
                {usdtAddresses[usdtNetwork]}
              </span>

              <button
                type="button"
                onClick={() => handleCopy(usdtNetwork, usdtAddresses[usdtNetwork])}
                className={`p-2 rounded-lg shrink-0 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  copiedNetwork === usdtNetwork
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-400/40'
                }`}
              >
                {copiedNetwork === usdtNetwork ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Pastikan memilih jaringan {usdtNetwork === 'TRC20' ? 'TRC-20' : 'BEP-20'} yang tepat saat transfer.</span>
            </div>
          </div>
        </div>

        {/* 3. Confirmation Section */}
        {submitSuccess ? (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-center space-y-2 font-mono">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="font-extrabold text-white text-sm">
              Permintaan Pembayaran Terkirim!
            </h3>
            <p className="text-xs text-slate-300 font-sans">
              Admin akan memverifikasi transfer USDT Anda dalam 5-15 menit dan memberikan 6-digit VIP PIN.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleWhatsAppConfirm}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Konfirmasi Instan via WhatsApp</span>
              </button>
              {onOpenAccessModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAccessModal();
                  }}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                >
                  Masukkan VIP PIN
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitProof} className="space-y-3 font-mono">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                Nama & Kontak Anda:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
                  required
                />
                <input
                  type="text"
                  placeholder="WhatsApp / Telegram"
                  value={userContact}
                  onChange={(e) => setUserContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                TxID / Hash Transaksi (Opsional jika konfirmasi via WA):
              </label>
              <input
                type="text"
                placeholder="0x... atau TxID Tron"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsAppConfirm}
                className="py-2.5 px-4 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Konfirmasi WA</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
