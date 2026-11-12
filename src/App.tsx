import React, { useState, useEffect } from 'react';
import { User, AdSlot } from './types';
import { 
  getCurrentUser, 
  setCurrentUserId, 
  claimWelcomeBonus, 
  claimAdReward, 
  getChannelUrl, 
  initializeStorage,
  formatPKR,
  getSettings
} from './lib/storage';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { WatchAdsView } from './components/WatchAdsView';
import { TeamView } from './components/TeamView';
import { WithdrawView } from './components/WithdrawView';
import { HistoryView } from './components/HistoryView';
import { ProfileView } from './components/ProfileView';
import { AdminView } from './components/AdminView';
import { WhatsAppModal } from './components/WhatsAppModal';
import { TermsModal } from './components/TermsModal';
import { AdPlayerModal } from './components/AdPlayerModal';
import { MessageCircle, Shield, Sparkles } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dash');
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  
  // Modals
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [watchingSlot, setWatchingSlot] = useState<AdSlot | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Initialize storage & current user on mount
  useEffect(() => {
    initializeStorage();
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (!user.bonus_claimed) {
        // Auto open welcome bonus modal after a brief delay
        setTimeout(() => {
          setIsBonusModalOpen(true);
        }, 600);
      }
    }
  }, []);

  const refreshUser = () => {
    const updated = getCurrentUser();
    setCurrentUser(updated ? { ...updated } : null);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (!user.bonus_claimed) {
      setTimeout(() => {
        setIsBonusModalOpen(true);
      }, 500);
    }
    setActiveTab('dash');
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setCurrentUser(null);
    setIsAdminMode(false);
    setActiveTab('dash');
    showToast('Logged out successfully.');
  };

  const settings = getSettings();

  const handleClaimBonus = () => {
    if (!currentUser) return;
    const res = claimWelcomeBonus(currentUser.id);
    if (res.error) {
      showToast(res.error);
    } else {
      showToast(`🎉 ${formatPKR(settings.welcome_bonus)} Welcome Bonus added to your balance!`);
      refreshUser();
      setIsBonusModalOpen(false);
    }
  };

  const handleClaimAdReward = (slotId: string) => {
    if (!currentUser) return;
    const res = claimAdReward(currentUser.id, slotId);
    if (res.error) {
      showToast(res.error);
      setWatchingSlot(null);
    } else {
      showToast(`✓ ${formatPKR(settings.reward)} earned and credited to your balance!`);
      refreshUser();
      setWatchingSlot(null);
    }
  };

  const channelUrl = getChannelUrl();

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-[#f5f5f5] selection:bg-yellow-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] glass px-5 py-2.5 rounded-full bg-black/90 text-xs sm:text-sm font-semibold text-white border border-yellow-500/40 shadow-2xl shadow-yellow-500/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Maintenance Mode Overlay (Locked out except admins) */}
      {settings.maintenance === 'on' && !currentUser?.is_admin && (
        <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-xl flex items-center justify-center text-center p-6">
          <div className="max-w-md space-y-4">
            <div className="text-6xl animate-bounce">🛠️</div>
            <h2 className="text-3xl font-extrabold gold">Under Maintenance</h2>
            <p className="text-sm text-neutral-400">
              We are improving the app and performing scheduled database upgrades. Please check back shortly.
            </p>
            {currentUser && (
              <button
                onClick={handleLogout}
                className="mt-4 px-6 py-2.5 rounded-full border border-white/20 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}

      {/* Blocked User Screen */}
      {currentUser?.blocked && !currentUser?.is_admin && (
        <div className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-xl flex items-center justify-center text-center p-6">
          <div className="max-w-md space-y-4">
            <div className="text-6xl">🚫</div>
            <h2 className="text-3xl font-extrabold text-red-500">Account Blocked</h2>
            <p className="text-sm text-neutral-400">
              Your account has been suspended for platform policy violations. If you believe this is an error, contact official WhatsApp support.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-full bg-emerald-500 text-black text-xs font-bold"
              >
                Contact Support
              </a>
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-full border border-white/20 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        isAdminMode={isAdminMode}
        setIsAdminMode={setIsAdminMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-4 pb-28 md:pb-12">
        {!currentUser ? (
          <AuthView
            onSuccess={handleLoginSuccess}
            onOpenTerms={() => setIsTermsModalOpen(true)}
            showToast={showToast}
          />
        ) : isAdminMode ? (
          <AdminView
            currentUser={currentUser}
            onRefresh={refreshUser}
            showToast={showToast}
          />
        ) : (
          <>
            {activeTab === 'dash' && (
              <DashboardView
                user={currentUser}
                onNavigate={(t) => setActiveTab(t)}
                showToast={showToast}
                onOpenBonusModal={() => setIsBonusModalOpen(true)}
              />
            )}

            {activeTab === 'ads' && (
              <WatchAdsView
                user={currentUser}
                onSelectSlot={(slot) => setWatchingSlot(slot)}
              />
            )}

            {activeTab === 'team' && (
              <TeamView
                user={currentUser}
                showToast={showToast}
              />
            )}

            {activeTab === 'wd' && (
              <WithdrawView
                user={currentUser}
                onRefreshUser={refreshUser}
                showToast={showToast}
              />
            )}

            {activeTab === 'hist' && (
              <HistoryView user={currentUser} />
            )}

            {activeTab === 'prof' && (
              <ProfileView
                user={currentUser}
                onRefreshUser={refreshUser}
                showToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      {currentUser && !isAdminMode && (
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Floating WhatsApp Support Button */}
      {currentUser && (
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp Channel"
          className="fixed right-4 bottom-20 md:bottom-6 z-40 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-black text-2xl shadow-xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition group"
          title="Official WhatsApp Channel"
        >
          <MessageCircle className="w-7 h-7 fill-black stroke-black group-hover:rotate-12 transition" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 border-2 border-black rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-yellow-400 border-2 border-black rounded-full" />
        </a>
      )}

      {/* Modals */}
      <WhatsAppModal
        isOpen={isBonusModalOpen}
        onClose={() => setIsBonusModalOpen(false)}
        onClaim={handleClaimBonus}
      />

      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
      />

      <AdPlayerModal
        slot={watchingSlot}
        isOpen={!!watchingSlot}
        onClose={() => setWatchingSlot(null)}
        onClaim={handleClaimAdReward}
      />
    </div>
  );
}
