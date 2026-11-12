import React from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass max-w-lg w-full bg-[#09090b] border border-white/10 max-h-[85vh] flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-yellow-500" />
            <h3 className="text-base font-bold text-white">Terms of Service &amp; Fair Use Policy</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-xs text-neutral-300 space-y-4 leading-relaxed">
          <div>
            <h4 className="font-bold text-white mb-1">1. Single Account &amp; Device Eligibility</h4>
            <p className="text-neutral-400">
              Only one account is permitted per person, device, and network. Creating multiple accounts or using emulator instances will result in immediate suspension and cancellation of all balances.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-1">2. Daily Ads &amp; Reward Crediting</h4>
            <p className="text-neutral-400">
              Users can watch up to 10 ads daily. Each ad must be actively viewed for the full 13-second timer. Rewards are credited immediately upon completion. Limits reset daily at 00:00 (midnight PKT).
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-1">3. Three-Tier Referral Commission Rules</h4>
            <p className="text-neutral-400">
              Team commissions (Level 1: 8%, Level 2: 5%, Level 3: 2%) are activated once a referred member has watched a minimum of 20 lifetime ads. Self-referrals and circular chains are strictly prohibited.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-1">4. Withdrawals to JazzCash &amp; Easypaisa</h4>
            <p className="text-neutral-400">
              First withdrawal threshold is Rs. 200; subsequent withdrawals have a minimum threshold of Rs. 800. All requests are verified by our team and processed within 24 to 72 hours.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-1">5. Anti-Fraud &amp; Bot Prevention</h4>
            <p className="text-neutral-400">
              Use of VPNs, automated scripts, headless browsers, or ad blockers will trigger automatic fraud detection and irreversible forfeiture of earnings.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-1">6. User Privacy &amp; Data Security</h4>
            <p className="text-neutral-400">
              We collect only the essential identifiers (name, email, payment account details, and device hash) needed to process earnings and prevent abuse. Data is never sold or shared with external advertisers.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full btn-gold text-black font-bold text-xs"
          >
            I Understand &amp; Agree
          </button>
        </div>
      </div>
    </div>
  );
};
