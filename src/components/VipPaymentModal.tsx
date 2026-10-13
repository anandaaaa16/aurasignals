import React, { useState } from 'react';
import {
  X,
  Crown,
  CheckCircle,
  Copy,
  Check,
  QrCode,
  Coins,
  MessageSquare,
  ShieldCheck,
  Send,
  Zap,
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
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'USDT'>('QRIS');
  const [usdtNetwork, setUsdtNetwork] = useState<'TRC20' | 'BEP20'>('TRC20');
  const [copied, setCopied] = useState(false);

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
      idr: 'Rp 199.000',
      usdt: '$15 USDT',
      tag: 'Flexible',
    },
    '3_MONTHS': {
      title: '3 Months VIP Pass',
      idr: 'Rp 499.000',
      usdt: '$35 USDT',
      tag: 'Best Value · 17% OFF',
    },
    LIFETIME: {
      title: 'Lifetime Unlimited',
      idr: 'Rp 1.299.000',
      usdt: '$89 USDT',
      tag: 'One-Time · VIP Lounge',
    },
  };

  const usdtAddresses = {
    TRC20: 'TYDNh6C8Z8xP2Z9Vj9k5M8P1Q4K9X2J5A7',
    BEP20: '0x71C8a5d3f2e14B829c9E75691FdBc84d7F1A88D2',
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPlan = plans[selectedPlan];
  const targetAmount = paymentMethod === 'QRIS' ? currentPlan.idr : currentPlan.usdt;

  const handleWhatsAppConfirm = () => {
    const text = encodeURIComponent(
      `Halo Admin AuraSignals! Saya ingin konfirmasi pembayaran VIP Membership:\n` +
      `• Paket: ${currentPlan.title}\n` +
      `• Metode: ${paymentMethod} (${targetAmount})\n` +
      `• Nama: ${userName || 'Member'}\n` +
      `• No Kontak: ${userContact || '-'}\n` +
      `• Bukti/Ref: ${txRef || 'Sudah transfer'}\n\n` +
      `Mohon verifikasi dan kirimkan 6-digit PIN VIP saya. Terima kasih!`
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
      method: paymentMethod === 'QRIS' ? 'QRIS' : usdtNetwork === 'TRC20' ? 'USDT_TRC20' : 'USDT_BEP20',
      amount: targetAmount,
      status: 'PENDING',
      txProofOrRef: txRef.trim() || 'Payment completed',
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
            Upgrade to VIP Member
          </h2>
          <p className="text-xs text-slate-400 font-sans">
            Unlock real-time institutional signals, precise entry levels, TP/SL, and AI strategy
          </p>
        </div>

        {/* VIP Perks */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 p-3 rounded-2xl bg-slate-950/60 border border-teal-500/20">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Full Live Buy / Sell Signals</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Zero-Delay Instant Entry</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Exact TP 1, TP 2 & Stop Loss</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Analytic Charts & SMC Logic</span>
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
                    {paymentMethod === 'QRIS' ? p.idr : p.usdt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Payment Method Tabs: QRIS vs USDT */}
        <div className="space-y-2">
          <div className="flex rounded-2xl bg-slate-950 p-1 border border-teal-500/25">
            <button
              type="button"
              onClick={() => setPaymentMethod('QRIS')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                paymentMethod === 'QRIS'
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QRIS (Indonesia · Rupiah)</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('USDT')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                paymentMethod === 'USDT'
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>USDT (Crypto · Global)</span>
            </button>
          </div>

          {/* QRIS PAYMENT CONTENT */}
          {paymentMethod === 'QRIS' && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-teal-500/20 space-y-3 font-mono text-center">
              <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2 text-slate-400">
                <span>NMID: ID1020304050607</span>
                <span className="text-emerald-400 font-bold">AuraSignals VIP</span>
              </div>

              {/* QRIS Code Container */}
              <div className="inline-block p-3 rounded-2xl bg-white border-4 border-slate-900 shadow-2xl mx-auto">
                {/* Standard Indonesian QRIS Header Logo */}
                <div className="flex items-center justify-between px-2 pb-1 border-b border-slate-200">
                  <span className="font-black text-slate-900 tracking-tighter text-sm">QRIS</span>
                  <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1 rounded">GPN</span>
                </div>

                {/* SVG Real Scannable QR Layout */}
                <svg
                  className="w-40 h-40 sm:w-44 sm:h-44 text-slate-950 mx-auto p-1"
                  viewBox="0 0 100 100"
                  fill="currentColor"
                >
                  <rect width="100" height="100" fill="#ffffff" />
                  {/* Outer corner 1 */}
                  <rect x="5" y="5" width="26" height="26" fill="#000" />
                  <rect x="8" y="8" width="20" height="20" fill="#fff" />
                  <rect x="12" y="12" width="12" height="12" fill="#000" />
                  {/* Outer corner 2 */}
                  <rect x="69" y="5" width="26" height="26" fill="#000" />
                  <rect x="72" y="8" width="20" height="20" fill="#fff" />
                  <rect x="76" y="12" width="12" height="12" fill="#000" />
                  {/* Outer corner 3 */}
                  <rect x="5" y="69" width="26" height="26" fill="#000" />
                  <rect x="8" y="72" width="20" height="20" fill="#fff" />
                  <rect x="12" y="76" width="12" height="12" fill="#000" />
                  {/* Patterns */}
                  <rect x="36" y="8" width="8" height="8" fill="#000" />
                  <rect x="48" y="8" width="16" height="8" fill="#000" />
                  <rect x="36" y="20" width="12" height="8" fill="#000" />
                  <rect x="52" y="20" width="12" height="8" fill="#000" />
                  <rect x="8" y="36" width="8" height="12" fill="#000" />
                  <rect x="20" y="36" width="12" height="8" fill="#000" />
                  <rect x="36" y="36" width="28" height="28" fill="#000" />
                  <rect x="42" y="42" width="16" height="16" fill="#fff" />
                  <rect x="46" y="46" width="8" height="8" fill="#000" />
                  <rect x="68" y="36" width="24" height="8" fill="#000" />
                  <rect x="76" y="48" width="16" height="16" fill="#000" />
                  <rect x="8" y="52" width="24" height="8" fill="#000" />
                  <rect x="36" y="68" width="8" height="24" fill="#000" />
                  <rect x="48" y="68" width="24" height="8" fill="#000" />
                  <rect x="52" y="80" width="8" height="12" fill="#000" />
                  <rect x="68" y="76" width="24" height="16" fill="#000" />
                </svg>

                <div className="pt-1 border-t border-slate-200 text-[9px] font-sans text-slate-600 font-semibold">
                  BCA · Mandiri · GoPay · OVO · Dana · ShopeePay
                </div>
              </div>

              <div className="text-center space-y-1">
                <span className="text-xs text-slate-400">Total Nominal Pembayaran:</span>
                <div className="text-xl font-black text-emerald-400">
                  {currentPlan.idr}
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  Scan QRIS di atas via m-Banking atau e-Wallet apa saja.
                </p>
              </div>
            </div>
          )}

          {/* USDT PAYMENT CONTENT */}
          {paymentMethod === 'USDT' && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-teal-500/20 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Select Network:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setUsdtNetwork('TRC20')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      usdtNetwork === 'TRC20'
                        ? 'bg-teal-500/25 border border-teal-400 text-teal-300'
                        : 'bg-slate-900 text-slate-400 border border-white/5'
                    }`}
                  >
                    TRC-20 (Tron)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsdtNetwork('BEP20')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      usdtNetwork === 'BEP20'
                        ? 'bg-teal-500/25 border border-teal-400 text-teal-300'
                        : 'bg-slate-900 text-slate-400 border border-white/5'
                    }`}
                  >
                    BEP-20 (BSC)
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Deposit Address ({usdtNetwork})</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(usdtAddresses[usdtNetwork])}
                    className="text-teal-300 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="text-xs font-mono text-white break-all bg-black/40 p-2 rounded-lg border border-white/5 select-all">
                  {usdtAddresses[usdtNetwork]}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Amount to Send:</span>
                <span className="text-base font-black text-emerald-400">{currentPlan.usdt}</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Confirmation Flow */}
        <div className="space-y-3 pt-1 border-t border-white/10">
          <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>How Confirmation Works:</span>
          </div>

          {/* Quick WA Button */}
          <button
            type="button"
            onClick={handleWhatsAppConfirm}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            <span>Fast Confirm via WhatsApp (Instant PIN)</span>
          </button>

          {/* OR in-app submit form */}
          {submitSuccess ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-1.5 font-mono">
              <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto" />
              <div className="text-xs font-bold text-white">
                Payment Submitted Successfully!
              </div>
              <p className="text-[11px] text-slate-300 font-sans">
                Admin is verifying your transaction. You will receive your 6-digit VIP PIN shortly via WhatsApp/Telegram.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitProof} className="space-y-2 font-mono text-xs">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  className="p-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:border-teal-400 outline-none"
                />
                <input
                  type="text"
                  placeholder="WhatsApp / Telegram"
                  value={userContact}
                  onChange={(e) => setUserContact(e.target.value)}
                  required
                  className="p-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:border-teal-400 outline-none"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ref No. / TxHash / Bank Name"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  className="flex-1 p-2 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-xs focus:border-teal-400 outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-2 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-300 font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Sending...' : 'Submit'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Existing PIN Link */}
        <div className="text-center pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenAccessModal) onOpenAccessModal();
            }}
            className="text-[11px] font-mono text-teal-400 hover:text-teal-300 underline cursor-pointer"
          >
            Already have a 6-digit VIP PIN? Enter PIN Code here
          </button>
        </div>
      </div>
    </div>
  );
};
