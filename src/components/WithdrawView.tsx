import React, { useState } from 'react';
import { User, WithdrawalMethod } from '../types';
import { formatPKR, getUserWithdrawals, requestWithdrawal, getSettings } from '../lib/storage';
import { 
  Wallet, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Building,
  Smartphone,
  Lock
} from 'lucide-react';

interface WithdrawViewProps {
  user: User;
  onRefreshUser: () => void;
  showToast: (msg: string) => void;
}

export const WithdrawView: React.FC<WithdrawViewProps> = ({
  user,
  onRefreshUser,
  showToast,
}) => {
  const settings = getSettings();
  const [method, setMethod] = useState<WithdrawalMethod>('JazzCash');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const history = getUserWithdrawals(user.id);
  const hasPrior = history.some((w) => w.status !== 'rejected');
  const pendingWithdrawal = history.find((w) => w.status === 'pending');
  const minRequired = hasPrior ? settings.min_next : settings.min_first;

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (pendingWithdrawal) {
      setErrorMsg(`You already have a pending request of ${formatPKR(pendingWithdrawal.amount)}. Please wait until it is processed.`);
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    if (numAmount < minRequired) {
      setErrorMsg(`Minimum withdrawal for ${hasPrior ? 'subsequent' : 'first-time'} requests is Rs. ${minRequired}.00`);
      return;
    }

    if (user.balance < numAmount) {
      setErrorMsg(`Insufficient balance. You currently have ${formatPKR(user.balance)}`);
      return;
    }

    setLoading(true);
    const res = requestWithdrawal(user.id, method, accountTitle, accountNumber, numAmount);
    setLoading(false);

    if (res.error) {
      setErrorMsg(res.error);
      return;
    }

    showToast('Withdrawal request submitted successfully! ✓');
    setAccountTitle('');
    setAccountNumber('');
    setAmount('');
    onRefreshUser();
  };

  const handleQuickAmount = (val: number) => {
    setAmount(String(val));
    setErrorMsg('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* View Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Withdraw <span className="gold">Earnings</span>
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Cash out your daily ad rewards and team commissions directly to your mobile wallet.
        </p>
      </div>

      {/* Grid: Balance Card & Withdrawal Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Info & Balance Card */}
        <div className="glass p-6 border border-white/10 flex flex-col justify-between space-y-5 bg-gradient-to-br from-[#14120a] to-[#0a0a0c]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              <Wallet className="w-4 h-4 text-yellow-500" />
              <span>Available Withdrawable Balance</span>
            </div>
            <div className="text-4xl sm:text-5xl font-black gold my-2">
              {formatPKR(user.balance)}
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Minimum withdrawal limit:</span>
                <b className="text-yellow-400 font-bold">Rs. {minRequired}.00</b>
              </div>
              <p className="text-[11px] text-neutral-400 leading-normal">
                {hasPrior ? (
                  <span>Subsequent withdrawal threshold is <b>Rs. {settings.min_next}.00</b>.</span>
                ) : (
                  <span>First-time introductory threshold: <b>Rs. {settings.min_first}.00</b> (Rs. {settings.min_next}.00 thereafter).</span>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>Processing timeline: <b>24 to 72 business hours</b></span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct payout via verified <b>JazzCash</b> &amp; <b>Easypaisa</b></span>
            </div>
          </div>
        </div>

        {/* Withdrawal Request Form */}
        <div className="glass p-6 border border-white/10 space-y-4">
          <h3 className="font-bold text-white text-base">New Withdrawal Request</h3>

          {pendingWithdrawal && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <b className="font-semibold block text-yellow-300">Active Pending Request</b>
                <span>You already have a pending withdrawal of <b>{formatPKR(pendingWithdrawal.amount)}</b> via {pendingWithdrawal.method}. Only 1 pending request is permitted at a time.</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleWithdraw} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('JazzCash')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                    method === 'JazzCash'
                      ? 'bg-amber-500/20 border-yellow-500 text-yellow-400 shadow-sm'
                      : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>JazzCash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('Easypaisa')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                    method === 'Easypaisa'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                      : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Easypaisa</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Account Holder Name (Title)
              </label>
              <input
                type="text"
                placeholder="e.g. Muhammad Zubair"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                className="glass-input text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                {method} Account Number
              </label>
              <input
                type="text"
                placeholder="03XXXXXXXXX"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="glass-input text-sm font-mono"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-300">
                  Withdrawal Amount (Rs.)
                </label>
                <span className="text-[11px] text-neutral-400">
                  Min: Rs. {minRequired}
                </span>
              </div>
              <input
                type="number"
                placeholder={`Amount (Min ${minRequired})`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="glass-input text-sm font-mono"
                min={minRequired}
                max={user.balance}
                step="any"
                required
              />
            </div>

            {/* Quick amount shortcuts */}
            <div className="flex gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleQuickAmount(minRequired)}
                className="flex-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-neutral-300"
              >
                Min (Rs. {minRequired})
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(500)}
                className="flex-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-neutral-300"
              >
                Rs. 500
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(1000)}
                className="flex-1 py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-neutral-300"
              >
                Rs. 1,000
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(Math.floor(user.balance))}
                className="flex-1 py-1 px-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-[11px] font-bold text-yellow-400"
              >
                Max
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || user.balance < minRequired || !!pendingWithdrawal}
              className="w-full py-3 rounded-full btn-gold text-black font-extrabold text-sm flex items-center justify-center gap-2 mt-3 disabled:opacity-50"
            >
              <span>{pendingWithdrawal ? 'Pending Request in Progress' : 'Submit Withdrawal Request'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Withdrawal History Table */}
      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-white text-base">Your Withdrawal Requests</h3>
        <div className="glass overflow-x-auto border border-white/10">
          <table className="w-full text-xs min-w-[540px]">
            <thead className="text-neutral-400 text-left border-b border-white/10 bg-white/[0.02]">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Method</th>
                <th className="p-3">Account Title &amp; No.</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.length > 0 ? (
                history.map((w) => {
                  return (
                    <tr key={w.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-3 text-neutral-400 whitespace-nowrap">
                        {new Date(w.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3 font-semibold text-white">
                        {w.method}
                      </td>
                      <td className="p-3">
                        <span className="text-white block font-medium">{w.account_title}</span>
                        <span className="text-[11px] font-mono text-neutral-400">{w.account_number}</span>
                      </td>
                      <td className="p-3 font-bold text-yellow-400">
                        {formatPKR(w.amount)}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                          w.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : w.status === 'rejected'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {w.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                          {w.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          {w.status === 'pending' && <Clock className="w-3 h-3" />}
                          <span>{w.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-neutral-500">
                    No withdrawal requests submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
