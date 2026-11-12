import React, { useState } from 'react';
import { User } from '../types';
import { formatPKR, getTeamTree, getSettings } from '../lib/storage';
import { 
  PlayCircle, 
  Copy, 
  Check, 
  Share2, 
  Sparkles, 
  ArrowUpRight, 
  Users, 
  Coins, 
  Layers, 
  Gift, 
  TrendingUp,
  MessageCircle
} from 'lucide-react';

interface DashboardViewProps {
  user: User;
  onNavigate: (tab: string) => void;
  showToast: (msg: string) => void;
  onOpenBonusModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onNavigate,
  showToast,
  onOpenBonusModal,
}) => {
  const [copied, setCopied] = useState(false);
  const settings = getSettings();
  const team = getTeamTree(user.id);
  const totalTeamMembers = team.level1.length + team.level2.length + team.level3.length;

  const referralLink = `${window.location.origin}${window.location.pathname}?ref=${user.user_code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showToast('Referral link copied to clipboard! ✓');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = `Join Watch Ads & Earn and earn real money daily! Watch ${settings.daily_limit} ads per day and get paid via JazzCash/Easypaisa. Use my referral code: ${user.user_code} -> ${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const adsProgress = Math.min(100, Math.round((user.ads_today / settings.daily_limit) * 100));

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome, <span className="gold">{user.name.split(' ')[0]}</span>
            </h2>
            <span className="text-xl">👋</span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Complete your daily 10 ads to maximize your guaranteed PKR rewards.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="glass px-3.5 py-1.5 flex items-center gap-2 text-xs border border-white/10">
            <span className="text-neutral-400">User ID:</span>
            <b className="font-mono text-yellow-400 font-bold">{user.user_code}</b>
          </div>

          {!user.bonus_claimed && (
            <button
              onClick={onOpenBonusModal}
              className="px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/40 text-yellow-400 text-xs font-bold flex items-center gap-1.5 hover:bg-yellow-500/25 transition animate-pulse"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Claim Rs. 50</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Total Balance Card */}
      <div 
        className="glass p-6 sm:p-8 relative overflow-hidden border border-yellow-500/25 bg-gradient-to-br from-[#12110c] to-[#09090b]"
        style={{ boxShadow: '0 0 60px rgba(234,179,8,0.12) inset' }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span>Total Available Balance</span>
            </div>
            <div className="text-4xl sm:text-6xl font-black gold tracking-tight">
              {formatPKR(user.balance)}
            </div>
            <p className="text-xs text-neutral-400 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Available for instant withdrawal to JazzCash or Easypaisa</span>
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <button
              onClick={() => onNavigate('wd')}
              className="flex-1 sm:flex-none px-6 py-3 rounded-full btn-gold text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition"
            >
              <span>Withdraw Funds</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('hist')}
              className="flex-1 sm:flex-none px-5 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition"
            >
              History
            </button>
          </div>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Ads Today */}
        <div className="glass p-5 border border-white/10 hover:border-yellow-500/30 transition">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Ads Watched Today</span>
            <span className="text-[10px] text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full">
              Daily Limit
            </span>
          </div>
          <div className="text-2xl font-black text-white my-1 flex items-baseline gap-1">
            <span>{user.ads_today}</span>
            <span className="text-neutral-500 text-sm font-semibold">/ {settings.daily_limit}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mt-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-300 transition-all duration-500"
              style={{ width: `${adsProgress}%` }}
            />
          </div>
        </div>

        {/* Reward per ad */}
        <div className="glass p-5 border border-white/10 hover:border-yellow-500/30 transition">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Reward Per Ad</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Fixed Rate
            </span>
          </div>
          <div className="text-2xl font-black text-white my-1">
            {formatPKR(settings.reward)}
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">
            Earn up to <b>{formatPKR(settings.reward * settings.daily_limit)} daily</b> from personal ad views.
          </p>
        </div>

        {/* Total Referrals */}
        <div className="glass p-5 border border-white/10 hover:border-yellow-500/30 transition">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
            <span>Total Team Members</span>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full">
              3 Levels
            </span>
          </div>
          <div className="text-2xl font-black text-white my-1 flex items-baseline gap-1.5">
            <span>{totalTeamMembers}</span>
            <span className="text-xs text-neutral-400 font-normal">referrals</span>
          </div>
          <p className="text-[11px] text-neutral-400 mt-2">
            Earn <b>{settings.c1}% · {settings.c2}% · {settings.c3}%</b> commissions from team activity.
          </p>
        </div>
      </div>

      {/* Big Action CTA */}
      <button
        onClick={() => onNavigate('ads')}
        className="w-full py-4 sm:py-5 px-6 rounded-2xl btn-gold text-black font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-2xl shadow-yellow-500/30 hover:scale-[1.01] active:scale-[0.99] transition group"
      >
        <PlayCircle className="w-7 h-7 fill-black group-hover:scale-110 transition" />
        <span>Watch Ads &amp; Earn Now</span>
        <span className="text-xs font-extrabold uppercase bg-black text-yellow-400 px-2.5 py-1 rounded-full hidden sm:inline-block">
          {Math.max(0, settings.daily_limit - user.ads_today)} Left Today
        </span>
      </button>

      {/* Referral Link & Team Share Section */}
      <div className="glass p-6 border border-white/10 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center text-yellow-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Your Exclusive Referral Link</h3>
              <p className="text-xs text-neutral-400">Share your link to build your 3-level commission tree.</p>
            </div>
          </div>

          <button
            onClick={handleWhatsAppShare}
            className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 transition"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-black" />
            <span>Share on WhatsApp</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="glass-input text-xs font-mono text-neutral-300 select-all"
          />
          <button
            onClick={handleCopyLink}
            className={`px-6 py-2.5 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0 ${
              copied
                ? 'bg-emerald-500 text-black'
                : 'btn-gold text-black'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>

        {/* Commission Rules Info Box */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <b className="text-yellow-400 block mb-0.5">Level 1: {settings.c1}% Commission</b>
            <span className="text-neutral-400 text-[11px]">Direct friends you invite to the platform.</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <b className="text-yellow-400 block mb-0.5">Level 2: {settings.c2}% Commission</b>
            <span className="text-neutral-400 text-[11px]">Members invited by your direct referrals.</span>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <b className="text-yellow-400 block mb-0.5">Level 3: {settings.c3}% Commission</b>
            <span className="text-neutral-400 text-[11px]">3rd level network earnings credited daily.</span>
          </div>
        </div>

        <p className="text-[11px] text-neutral-500 italic">
          * Note: Team commission activates once a referred member has watched at least {settings.ref_threshold} lifetime ads.
        </p>
      </div>
    </div>
  );
};
