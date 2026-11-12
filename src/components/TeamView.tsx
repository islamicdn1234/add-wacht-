import React, { useState } from 'react';
import { User } from '../types';
import { getTeamTree } from '../lib/storage';
import { Users, Copy, Check, MessageCircle, GitFork, Award, CheckCircle2, AlertCircle } from 'lucide-react';

interface TeamViewProps {
  user: User;
  showToast: (msg: string) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ user, showToast }) => {
  const [copied, setCopied] = useState(false);
  const team = getTeamTree(user.id);
  const referralLink = `${window.location.origin}${window.location.pathname}?ref=${user.user_code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showToast('Referral link copied! ✓');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = `Earn daily income watching ads on Watch Ads & Earn! Register with my code ${user.user_code}: ${referralLink}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const totalMembers = team.level1.length + team.level2.length + team.level3.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My <span className="gold">Referral Team</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Build your network on 3 tier levels and earn passive commission on every ad watched by your team.
          </p>
        </div>

        <div className="glass px-4 py-2 flex items-center gap-2 text-xs font-bold border border-yellow-500/30 text-yellow-400">
          <Users className="w-4 h-4" />
          <span>Total Network: {totalMembers} Members</span>
        </div>
      </div>

      {/* Referral Link Quick Bar */}
      <div className="glass p-5 border border-white/10 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <span>Invite New Members</span>
          </span>
          <button
            onClick={handleWhatsAppShare}
            className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 transition"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-black" />
            <span>Share via WhatsApp</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="glass-input text-xs font-mono text-neutral-300"
          />
          <button
            onClick={handleCopyLink}
            className="px-5 py-2.5 rounded-full btn-gold text-black font-bold text-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Visual Network Tree */}
      <div className="space-y-4">
        {/* Upline Section */}
        <div className="glass p-5 text-center border border-white/10 max-w-md mx-auto">
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1.5">
            Your Sponsor (Upline)
          </p>
          {team.upline ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-extrabold text-white">{team.upline.name}</span>
              <span className="font-mono text-xs text-yellow-400 px-2 py-0.5 rounded-md bg-yellow-500/10">
                {team.upline.user_code}
              </span>
            </div>
          ) : (
            <span className="text-xs text-neutral-500">Direct Registration (No Upline)</span>
          )}
        </div>

        {/* You Node */}
        <div className="text-center py-1">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-yellow-500 text-black font-black text-sm shadow-xl shadow-yellow-500/20">
            <GitFork className="w-4 h-4" />
            <span>YOU · {user.user_code}</span>
          </div>
        </div>

        {/* Level 1 (8% Commission) */}
        <div className="glass p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
            <div>
              <span className="font-extrabold text-white text-sm">Level 1 Direct Referrals</span>
              <span className="ml-2 text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full text-[11px]">
                8% Commission
              </span>
            </div>
            <span className="text-neutral-400 font-semibold">{team.level1.length} Member(s)</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {team.level1.length > 0 ? (
              team.level1.map((m) => {
                const isCommissionActive = m.ads_total >= 20;
                return (
                  <div
                    key={m.id}
                    className="glass px-3.5 py-2 flex items-center gap-2.5 border border-white/10 text-xs"
                  >
                    <div>
                      <b className="text-white block">{m.name}</b>
                      <span className="text-[10px] text-neutral-400 font-mono">{m.user_code}</span>
                    </div>

                    <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                      isCommissionActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-neutral-400'
                    }`}>
                      {isCommissionActive && <CheckCircle2 className="w-3 h-3" />}
                      <span>{m.ads_total}/20 ads</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-neutral-500 py-3 italic">
                No direct referrals yet. Share your referral code <b className="text-neutral-300">{user.user_code}</b> to start earning!
              </p>
            )}
          </div>
        </div>

        {/* Level 2 (5% Commission) */}
        <div className="glass p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
            <div>
              <span className="font-extrabold text-white text-sm">Level 2 Indirect Referrals</span>
              <span className="ml-2 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full text-[11px]">
                5% Commission
              </span>
            </div>
            <span className="text-neutral-400 font-semibold">{team.level2.length} Member(s)</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {team.level2.length > 0 ? (
              team.level2.map((m) => (
                <div
                  key={m.id}
                  className="glass px-3.5 py-2 flex items-center gap-2.5 border border-white/10 text-xs"
                >
                  <div>
                    <b className="text-white block">{m.name}</b>
                    <span className="text-[10px] text-neutral-400 font-mono">{m.user_code}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded">
                    {m.ads_total}/20 ads
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-500 py-2 italic">
                No level 2 members yet. They will appear here when your direct referrals invite friends.
              </p>
            )}
          </div>
        </div>

        {/* Level 3 (2% Commission) */}
        <div className="glass p-5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
            <div>
              <span className="font-extrabold text-white text-sm">Level 3 Indirect Referrals</span>
              <span className="ml-2 text-yellow-500 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-full text-[11px]">
                2% Commission
              </span>
            </div>
            <span className="text-neutral-400 font-semibold">{team.level3.length} Member(s)</span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {team.level3.length > 0 ? (
              team.level3.map((m) => (
                <div
                  key={m.id}
                  className="glass px-3.5 py-2 flex items-center gap-2.5 border border-white/10 text-xs"
                >
                  <div>
                    <b className="text-white block">{m.name}</b>
                    <span className="text-[10px] text-neutral-400 font-mono">{m.user_code}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 bg-white/5 px-2 py-0.5 rounded">
                    {m.ads_total}/20 ads
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-500 py-2 italic">
                No level 3 members yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
