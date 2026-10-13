import React, { useState } from 'react';
import { KeyRound, Crown, UserCheck, X, CheckCircle, AlertCircle } from 'lucide-react';
import { verifySixDigitCode, UserRoleSession } from '../utils/tradeDbService';

interface AccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRoleSession['role'];
  onRoleChange: (role: UserRoleSession['role'], code: string) => void;
}

export const AccessCodeModal: React.FC<AccessCodeModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onRoleChange,
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg(null);

      // Auto-validate when 6 digits are reached
      if (nextPin.length === 6) {
        validatePin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const validatePin = (inputPin: string) => {
    const res = verifySixDigitCode(inputPin);
    if (res.success) {
      setSuccessMsg(res.message);
      setErrorMsg(null);
      setTimeout(() => {
        onRoleChange(res.role, inputPin);
        setSuccessMsg(null);
        setPin('');
        onClose();
      }, 700);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleLogout = () => {
    onRoleChange('GUEST', '');
    setPin('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-sm glass-panel rounded-3xl p-5 border border-teal-500/30 shadow-2xl space-y-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-300 mx-auto flex items-center justify-center shadow-lg shadow-teal-500/10">
            {currentRole === 'ADMIN' ? (
              <Crown className="w-6 h-6 text-amber-400" />
            ) : currentRole === 'MEMBER' ? (
              <UserCheck className="w-6 h-6 text-emerald-400" />
            ) : (
              <KeyRound className="w-6 h-6 text-teal-300" />
            )}
          </div>

          <h2 className="text-lg font-black font-mono text-white tracking-wide">
            {currentRole === 'ADMIN'
              ? 'Admin Access Active'
              : currentRole === 'MEMBER'
              ? 'VIP Access Active'
              : 'Enter Access Code'}
          </h2>

          <p className="text-xs text-slate-400 font-sans">
            {currentRole !== 'GUEST'
              ? 'You currently have elevated system privileges.'
              : 'Enter your 6-digit PIN code to unlock VIP or Admin access.'}
          </p>
        </div>

        {/* Status Badge If Already Logged In */}
        {currentRole !== 'GUEST' && (
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-teal-500/20 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-500/10 border border-teal-500/25 text-xs font-mono font-bold text-teal-300">
              {currentRole === 'ADMIN' ? '👑 Status: Master Admin' : '⭐ Status: VIP Member'}
            </div>
            <button
              onClick={handleLogout}
              className="block w-full py-2 text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer font-bold"
            >
              Sign Out to Guest Mode
            </button>
          </div>
        )}

        {/* 6 Digit PIN Display */}
        {currentRole === 'GUEST' && (
          <div className="space-y-4">
            <div className="flex justify-center items-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const isFilled = pin.length > index;
                const isCurrent = pin.length === index;
                return (
                  <div
                    key={index}
                    className={`w-10 h-12 rounded-xl flex items-center justify-center font-mono font-black text-lg transition-all ${
                      isFilled
                        ? 'bg-teal-500/20 border-2 border-teal-400 text-teal-200 shadow-md shadow-teal-500/20'
                        : isCurrent
                        ? 'bg-slate-900 border-2 border-teal-500/60 text-white animate-pulse'
                        : 'bg-slate-900/60 border border-white/10 text-slate-600'
                    }`}
                  >
                    {isFilled ? '●' : ''}
                  </div>
                );
              })}
            </div>

            {/* Error or Success Feedback */}
            {errorMsg && (
              <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Number Keypad */}
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDigit(digit)}
                  className="py-3 rounded-2xl bg-slate-900/80 hover:bg-teal-500/20 text-white font-bold text-lg border border-white/5 hover:border-teal-500/30 transition-all cursor-pointer active:scale-95 shadow-inner"
                >
                  {digit}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleDigit('0')}
                className="py-3 rounded-2xl bg-slate-900/80 hover:bg-teal-500/20 text-white font-bold text-lg border border-white/5 hover:border-teal-500/30 transition-all cursor-pointer active:scale-95 shadow-inner"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="py-3 rounded-2xl bg-slate-900/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-bold text-sm border border-white/5 hover:border-rose-500/30 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              >
                DEL
              </button>
            </div>

            <div className="text-center pt-1">
              <span className="text-[10px] text-slate-500 font-mono">
                Admin: <strong className="text-teal-400">889900</strong> · VIP Member: <strong className="text-teal-400">777888</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
