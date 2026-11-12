import React, { useState, useEffect } from 'react';
import { Sparkles, MessageCircle, CheckCircle2, X } from 'lucide-react';
import { getChannelUrl, getSettings, formatPKR } from '../lib/storage';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose, onClaim }) => {
  const [hasClickedJoin, setHasClickedJoin] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(3);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const channelUrl = getChannelUrl();
  const settings = getSettings();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasClickedJoin && secondsLeft > 0) {
      timer = setTimeout(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (hasClickedJoin && secondsLeft === 0) {
      setIsUnlocked(true);
    }
    return () => clearTimeout(timer);
  }, [hasClickedJoin, secondsLeft]);

  if (!isOpen) return null;

  const handleJoinClick = () => {
    window.open(channelUrl, '_blank', 'noopener,noreferrer');
    if (!hasClickedJoin) {
      setHasClickedJoin(true);
      setSecondsLeft(3);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="glass max-w-sm w-full p-6 text-center bg-[#09090b] border border-yellow-500/30 shadow-2xl shadow-yellow-500/10 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-yellow-500/20 to-amber-400/30 border border-yellow-500/40 flex items-center justify-center text-3xl">
          🎁
        </div>

        <h3 className="text-xl font-extrabold text-white mb-2">
          Join WhatsApp Channel &amp; Claim{' '}
          <span className="gold">{formatPKR(settings.welcome_bonus)} Bonus</span>
        </h3>

        <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
          Stay updated with payment proofs, daily promo codes, and special bonuses. Join our official channel to instantly unlock your free welcome reward.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleJoinClick}
            className="w-full py-3 px-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02]"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Join Official Channel</span>
          </button>

          <button
            disabled={!isUnlocked}
            onClick={onClaim}
            className="w-full py-3 px-4 rounded-full btn-gold text-black font-extrabold text-sm flex items-center justify-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isUnlocked
                ? `Claim ${formatPKR(settings.welcome_bonus)} Bonus Now`
                : hasClickedJoin
                ? `Verifying Channel (${secondsLeft}s)...`
                : 'Claim Bonus (Join First)'}
            </span>
          </button>

          <button
            onClick={onClose}
            className="text-xs text-neutral-500 hover:text-neutral-400 transition pt-1 block mx-auto"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};
