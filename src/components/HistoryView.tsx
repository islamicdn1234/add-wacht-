import React, { useState } from 'react';
import { User } from '../types';
import { formatPKR, getUserTransactions } from '../lib/storage';
import { History, ArrowUpRight, ArrowDownLeft, Filter, Search } from 'lucide-react';

interface HistoryViewProps {
  user: User;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ user }) => {
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const transactions = getUserTransactions(user.id);

  const filtered = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (searchQuery.trim()) {
      return t.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const totalCredits = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Transaction <span className="gold">Ledger</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Complete transparent audit trail of all earnings, referral bonuses, and withdrawals.
          </p>
        </div>

        {/* Quick summary totals */}
        <div className="flex items-center gap-2 text-xs">
          <div className="glass px-3 py-1.5 border border-emerald-500/20 text-emerald-400">
            <span className="text-neutral-400 mr-1.5">Total In:</span>
            <b>+{formatPKR(totalCredits)}</b>
          </div>
          <div className="glass px-3 py-1.5 border border-red-500/20 text-red-400">
            <span className="text-neutral-400 mr-1.5">Total Out:</span>
            <b>-{formatPKR(totalDebits)}</b>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex gap-1.5 bg-white/5 p-1 rounded-full border border-white/10 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              filterType === 'all'
                ? 'bg-yellow-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => setFilterType('credit')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              filterType === 'credit'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Credits Only
          </button>
          <button
            onClick={() => setFilterType('debit')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              filterType === 'debit'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Debits Only
          </button>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input text-xs"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass overflow-x-auto border border-white/10">
        <table className="w-full text-xs min-w-[520px]">
          <thead className="text-neutral-400 text-left border-b border-white/10 bg-white/[0.02]">
            <tr>
              <th className="p-3">Date &amp; Time</th>
              <th className="p-3">Type</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length > 0 ? (
              filtered.map((t) => {
                const isCredit = t.type === 'credit';
                return (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-3 text-neutral-400 whitespace-nowrap font-mono text-[11px]">
                      {new Date(t.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCredit
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}>
                        {isCredit ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        <span>{t.type}</span>
                      </span>
                    </td>
                    <td className={`p-3 font-bold font-mono text-sm ${
                      isCredit ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {isCredit ? '+' : '-'}{formatPKR(t.amount)}
                    </td>
                    <td className="p-3 text-neutral-200">
                      {t.description}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-neutral-500">
                  No transaction records found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
