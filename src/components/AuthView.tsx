import React, { useState, useEffect } from 'react';
import { login, register } from '../lib/storage';
import { User } from '../types';
import { Zap, AlertTriangle, ArrowRight } from 'lucide-react';

interface AuthViewProps {
  onSuccess: (user: User) => void;
  onOpenTerms: () => void;
  showToast: (msg: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onOpenTerms, showToast }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [refCode, setRefCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-fill referral code from URL query parameter ?ref=XXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setRefCode(ref.toUpperCase());
      setIsRegister(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!agreeTerms) {
        setErrorMsg('Please accept the Terms of Service & Privacy Policy.');
        return;
      }

      setLoading(true);
      const res = register(name, email, password, refCode);
      setLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      if (res.user) {
        showToast('Account created successfully! Welcome 🎉');
        onSuccess(res.user);
      }
    } else {
      setLoading(true);
      const res = login(email, password);
      setLoading(false);

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      if (res.user) {
        showToast(`Welcome back, ${res.user.name.split(' ')[0]}!`);
        onSuccess(res.user);
      }
    }
  };

  return (
    <div className="max-w-md mx-auto my-6 px-4 animate-in fade-in duration-300">
      <div className="glass p-6 sm:p-8 bg-[#09090b]/90 border border-white/10 shadow-2xl relative">
        {/* Header Icon */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-black font-black shadow-xl shadow-yellow-500/25">
            <Zap className="w-8 h-8 fill-black stroke-black" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Watch Ads. <span className="gold">Earn Money.</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            Watch ads daily, claim instant cash rewards, and grow your earnings with 3-tier team commissions.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-full mb-6 border border-white/10">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition ${
              !isRegister
                ? 'bg-yellow-500 text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-full transition ${
              isRegister
                ? 'bg-yellow-500 text-black shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <input
                type="text"
                placeholder="Full Name (e.g. Muhammad Ali)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input text-sm"
                required
              />
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="glass-input text-sm"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="glass-input text-sm"
              autoComplete="current-password"
              required
            />
          </div>

          {isRegister && (
            <div>
              <input
                type="text"
                placeholder="Referral Code (Optional, e.g. PK-5821)"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                className="glass-input text-sm uppercase font-mono"
              />
            </div>
          )}

          {isRegister && (
            <label className="flex items-start gap-2 text-xs text-neutral-400 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 accent-yellow-500 rounded"
              />
              <span>
                I agree to the{' '}
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="text-yellow-400 hover:underline font-semibold"
                >
                  Terms &amp; Privacy Policy
                </button>
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full btn-gold text-black font-extrabold text-sm flex items-center justify-center gap-2 mt-2"
          >
            <span>{isRegister ? 'Create Free Account' : 'Login to Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
