import React, { useState } from 'react';
import { User } from '../types';
import { 
  formatPKR, 
  getUserTransactions, 
  getAllWithdrawals, 
  getTeamTree, 
  updateMyName, 
  updateMyPassword 
} from '../lib/storage';
import { 
  User as UserIcon, 
  Coins, 
  PlayCircle, 
  TrendingUp, 
  Wallet, 
  Users, 
  Edit3, 
  KeyRound, 
  Calendar, 
  ShieldCheck 
} from 'lucide-react';

interface ProfileViewProps {
  user: User;
  onRefreshUser: () => void;
  showToast: (msg: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onRefreshUser, showToast }) => {
  const [name, setName] = useState(user.name);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const transactions = getUserTransactions(user.id);
  const withdrawals = getAllWithdrawals().filter((w) => w.user_id === user.id);
  const team = getTeamTree(user.id);
  const totalTeam = team.level1.length + team.level2.length + team.level3.length;

  const totalEarned = transactions
    .filter((t) => t.type === 'credit' && t.description !== 'Withdrawal refunded')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalWithdrawn = withdrawals
    .filter((w) => w.status === 'approved')
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    const res = updateMyName(user.id, name);
    setSavingName(false);
    if (res.error) {
      showToast(res.error);
    } else {
      showToast('Name updated successfully! ✓');
      onRefreshUser();
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.');
      return;
    }

    setSavingPass(true);
    const res = updateMyPassword(user.id, oldPassword, newPassword);
    setSavingPass(false);
    if (res.error) {
      showToast(res.error);
    } else {
      showToast('Password changed successfully! ✓');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onRefreshUser();
    }
  };

  const initial = user.name ? user.name.trim()[0].toUpperCase() : 'U';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* View Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          My <span className="gold">Account Profile</span>
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          View your lifetime earning statistics, update your name, or manage security credentials.
        </p>
      </div>

      {/* Profile Overview Card & Lifetime Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Card */}
        <div className="glass p-6 text-center flex flex-col items-center justify-center border border-white/10">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 text-black text-4xl font-black grid place-items-center shadow-xl shadow-yellow-500/20 mb-3">
            {initial}
          </div>
          <h3 className="text-xl font-bold text-white flex items-center gap-1.5">
            <span>{user.name}</span>
            {user.is_admin && (
              <span className="text-[10px] bg-yellow-500 text-black font-extrabold px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </h3>
          <p className="text-xs text-neutral-400 break-all mt-0.5">{user.email}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono">
            <span className="text-neutral-400">User ID:</span>
            <b className="text-yellow-400">{user.user_code}</b>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Joined {new Date(user.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </p>
        </div>

        {/* Lifetime Earnings & Activity Stats */}
        <div className="grid grid-cols-2 gap-3 content-start">
          <div className="glass p-4 border border-white/10">
            <p className="text-xs text-neutral-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span>Current Balance</span>
            </p>
            <p className="font-extrabold text-lg text-yellow-400 mt-1">
              {formatPKR(user.balance)}
            </p>
          </div>

          <div className="glass p-4 border border-white/10">
            <p className="text-xs text-neutral-400 flex items-center gap-1">
              <PlayCircle className="w-3.5 h-3.5 text-neutral-400" />
              <span>Ads Watched</span>
            </p>
            <p className="font-extrabold text-lg text-white mt-1">
              {user.ads_total} <span className="text-xs font-normal text-neutral-400">total</span>
            </p>
          </div>

          <div className="glass p-4 border border-white/10">
            <p className="text-xs text-neutral-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Total Earned</span>
            </p>
            <p className="font-extrabold text-lg text-emerald-400 mt-1">
              {formatPKR(totalEarned)}
            </p>
          </div>

          <div className="glass p-4 border border-white/10">
            <p className="text-xs text-neutral-400 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-amber-400" />
              <span>Total Withdrawn</span>
            </p>
            <p className="font-extrabold text-lg text-white mt-1">
              {formatPKR(totalWithdrawn)}
            </p>
          </div>

          <div className="glass p-4 col-span-2 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-yellow-400" />
                <span>Referral Team Size</span>
              </p>
              <p className="font-extrabold text-xl text-white mt-0.5">
                {totalTeam} Members
              </p>
            </div>
            <span className="text-xs text-neutral-400">Level 1: {team.level1.length} · Level 2: {team.level2.length} · Level 3: {team.level3.length}</span>
          </div>
        </div>
      </div>

      {/* Account Settings Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Edit Name */}
        <div className="glass p-5 border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-yellow-400" />
            <h4 className="font-semibold text-white text-sm">Edit Full Name</h4>
          </div>
          <form onSubmit={handleSaveName} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input text-sm"
              placeholder="Your full name"
              required
            />
            <button
              type="submit"
              disabled={savingName || name.trim() === user.name}
              className="w-full py-2.5 rounded-full btn-gold text-black font-bold text-xs disabled:opacity-40"
            >
              {savingName ? 'Saving...' : 'Save Name'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="glass p-5 border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-yellow-400" />
            <h4 className="font-semibold text-white text-sm">Change Password</h4>
          </div>
          <form onSubmit={handleSavePassword} className="space-y-2.5">
            <input
              type="password"
              placeholder="Current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="glass-input text-sm"
              required
            />
            <input
              type="password"
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="glass-input text-sm"
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="glass-input text-sm"
              required
            />
            <button
              type="submit"
              disabled={savingPass}
              className="w-full py-2.5 rounded-full btn-gold text-black font-bold text-xs disabled:opacity-40"
            >
              {savingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
