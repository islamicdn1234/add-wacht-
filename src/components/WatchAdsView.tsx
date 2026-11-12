import React from 'react';
import { AdSlot, User } from '../types';
import { getAllAdSlots, getSettings, getAdCooldownMs, formatCooldown, formatPKR } from '../lib/storage';
import { 
  Play, 
  Sparkles, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Lock 
} from 'lucide-react';

interface WatchAdsViewProps {
  user: User;
  onSelectSlot: (slot: AdSlot) => void;
}

export const WatchAdsView: React.FC<WatchAdsViewProps> = ({ user, onSelectSlot }) => {
  const settings = getSettings();
  const allSlots = getAllAdSlots().filter((s) => s.active);
  const remaining = Math.max(0, settings.daily_limit - user.ads_today);
  const isLimitReached = user.ads_today >= settings.daily_limit;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Watch <span className="gold">Sponsored Ads</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            <span className="text-yellow-400 font-bold">{user.ads_today} / {settings.daily_limit}</span> watched today · Tap an ad and wait {settings.timer_seconds} seconds. Each ad returns 24 hours after you watch it.
          </p>
        </div>

        {/* Counter Badge */}
        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 self-start sm:self-auto text-xs font-bold border transition ${
          isLimitReached
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
        }`}>
          {isLimitReached ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Daily Goal Completed ({settings.daily_limit}/{settings.daily_limit})</span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-yellow-400" />
              <span>{remaining} Ads Remaining Today</span>
            </>
          )}
        </div>
      </div>

      {/* Daily Limit Completed Banner */}
      {isLimitReached && (
        <div className="glass p-6 text-center border border-emerald-500/30 bg-emerald-500/[0.04] space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-white">
            Congratulations! Daily Goal Reached
          </h3>
          <p className="text-xs text-neutral-300 max-w-md mx-auto">
            You have completed all {settings.daily_limit} ads for today. The daily limit resets at midnight (00:00 PKT). Each specific ad slot becomes available again 24 hours after completion.
          </p>
        </div>
      )}

      {/* Ads Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allSlots.map((slot, index) => {
          const cooldownMs = getAdCooldownMs(user.id, slot.id);
          const isCoolingDown = cooldownMs > 0;
          const isDisabled = isLimitReached || isCoolingDown;

          const colors = [
            'from-amber-500/20 to-yellow-600/10 border-yellow-500/30',
            'from-emerald-500/20 to-teal-600/10 border-emerald-500/30',
            'from-blue-500/20 to-indigo-600/10 border-blue-500/30',
            'from-purple-500/20 to-pink-600/10 border-purple-500/30',
            'from-rose-500/20 to-red-600/10 border-rose-500/30',
            'from-orange-500/20 to-amber-600/10 border-orange-500/30',
          ];
          const colorClass = colors[index % colors.length];

          return (
            <div
              key={slot.id}
              onClick={() => {
                if (!isDisabled) {
                  onSelectSlot(slot);
                }
              }}
              className={`glass overflow-hidden border text-left transition flex flex-col justify-between group ${
                isDisabled
                  ? 'opacity-40 cursor-not-allowed border-white/5'
                  : 'hover:-translate-y-1 hover:border-yellow-500/40 cursor-pointer shadow-lg hover:shadow-yellow-500/10 border-white/10'
              }`}
            >
              {/* Card Banner */}
              <div className={`h-28 bg-gradient-to-br ${colorClass} p-4 flex flex-col justify-between relative overflow-hidden`}>
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-sm border border-white/10">
                    {slot.kind === 'html' ? 'Interactive Ad' : 'Web Sponsor'}
                  </span>
                  
                  {isCoolingDown ? (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-300 bg-black/70 px-2 py-0.5 rounded-full border border-white/10">
                      <Lock className="w-3 h-3 text-amber-400" />
                      <span>In {formatCooldown(cooldownMs)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-yellow-400 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                      <Sparkles className="w-3 h-3 fill-yellow-400" />
                      <span>+{formatPKR(settings.reward)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition shadow-md ${
                    isCoolingDown
                      ? 'bg-neutral-800 text-neutral-400'
                      : 'bg-yellow-500 text-black group-hover:scale-110'
                  }`}>
                    {isCoolingDown ? <Lock className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-black ml-0.5" />}
                  </div>
                  <span className="text-[11px] text-white/90 font-bold">{settings.timer_seconds} Seconds Watch</span>
                </div>

                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 blur-xl pointer-events-none" />
              </div>

              {/* Card Content */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-yellow-400 transition">
                    {slot.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                    {isCoolingDown
                      ? `24h cooldown active. Available in ${formatCooldown(cooldownMs)}.`
                      : 'Watch completely to claim reward directly into your balance.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">
                    {slot.clicks ? `${slot.clicks.toLocaleString()} views` : 'Verified Ad'}
                  </span>
                  <span className={`font-bold ${
                    isCoolingDown
                      ? 'text-neutral-500'
                      : isLimitReached
                      ? 'text-neutral-500'
                      : 'text-yellow-400'
                  }`}>
                    {isCoolingDown
                      ? 'Cooling down'
                      : isLimitReached
                      ? 'Completed'
                      : 'Watch Now →'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {allSlots.length === 0 && (
        <div className="glass p-12 text-center text-neutral-400">
          <p className="text-sm">No ads are currently active. Please check back shortly.</p>
        </div>
      )}
    </div>
  );
};
