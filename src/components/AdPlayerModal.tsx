import React, { useState, useEffect } from 'react';
import { AdSlot } from '../types';
import { getSettings, formatPKR } from '../lib/storage';
import { X, Clock, Sparkles, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdPlayerModalProps {
  slot: AdSlot | null;
  isOpen: boolean;
  onClose: () => void;
  onClaim: (slotId: string) => void;
}

export const AdPlayerModal: React.FC<AdPlayerModalProps> = ({
  slot,
  isOpen,
  onClose,
  onClaim,
}) => {
  const settings = getSettings();
  const totalSeconds = settings.timer_seconds || 20;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(totalSeconds);
      setIsCompleted(false);
      setShowExitConfirm(false);
    }
  }, [isOpen, slot, totalSeconds]);

  useEffect(() => {
    if (!isOpen || isCompleted) return;

    if (secondsLeft > 0) {
      const timer = setTimeout(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsCompleted(true);
    }
  }, [isOpen, secondsLeft, isCompleted]);

  if (!isOpen || !slot) return null;

  const handleCloseAttempt = () => {
    if (isCompleted) {
      onClose();
    } else {
      setShowExitConfirm(true);
    }
  };

  const handleClaim = () => {
    onClaim(slot.id);
  };

  const progress = Math.max(0, Math.min(100, ((totalSeconds - secondsLeft) / totalSeconds) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="glass max-w-lg w-full bg-[#0a0a0c] border border-white/15 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-4 py-3 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white truncate max-w-[220px] sm:max-w-xs">
              {slot.title}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Timer Pill */}
            <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>00:{String(secondsLeft).padStart(2, '0')}</span>
            </div>

            <button
              onClick={handleCloseAttempt}
              className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              title="Close Ad"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/5 h-1.5">
          <div
            className={`h-full transition-all duration-300 ease-linear ${
              isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-amber-400 to-yellow-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Ad Content Container */}
        <div className="p-4 overflow-y-auto flex-1 min-h-[220px] flex flex-col justify-center items-center bg-black/40">
          {slot.kind === 'html' ? (
            <div 
              className="w-full ad-preview-content"
              dangerouslySetInnerHTML={{ __html: slot.content }}
            />
          ) : (
            <div className="w-full h-56 rounded-xl overflow-hidden border border-white/10 bg-neutral-900">
              <iframe
                src={slot.content}
                title={slot.title}
                sandbox="allow-scripts allow-popups allow-same-origin"
                className="w-full h-full border-0"
              />
            </div>
          )}
        </div>

        {/* Bottom Reward / Timer Action Bar */}
        <div className="p-4 bg-white/[0.03] border-t border-white/10 text-center">
          {!isCompleted ? (
            <div className="space-y-1">
              <p className="text-3xl font-black gold tracking-wider font-mono">
                00:{String(secondsLeft).padStart(2, '0')}
              </p>
              <p className="text-xs text-neutral-400">
                Please wait — your reward of <b className="text-yellow-400">{formatPKR(settings.reward)}</b> unlocks when the timer reaches 00:00
              </p>
            </div>
          ) : (
            <div className="space-y-2 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Timer complete! Reward is ready to claim.</span>
              </div>
              <button
                onClick={handleClaim}
                className="w-full py-3.5 px-6 rounded-full btn-gold text-black font-extrabold text-base flex items-center justify-center gap-2 shadow-xl shadow-yellow-500/25 hover:scale-[1.02] transition"
              >
                <Sparkles className="w-5 h-5 fill-black" />
                <span>Claim Reward (+ {formatPKR(settings.reward)})</span>
              </button>
            </div>
          )}

          {/* Exit confirmation modal overlay */}
          {showExitConfirm && (
            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 text-left flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  Leaving now cancels your <b>{formatPKR(settings.reward)}</b> reward! Only {secondsLeft} seconds remain.
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px]"
                >
                  Stay
                </button>
                <button
                  onClick={onClose}
                  className="px-2.5 py-1 rounded-md bg-red-500/30 hover:bg-red-500/40 text-red-300 font-semibold text-[11px]"
                >
                  Exit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
