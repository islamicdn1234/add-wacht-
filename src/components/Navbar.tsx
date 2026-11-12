import React from 'react';
import { User } from '../types';
import { formatPKR } from '../lib/storage';
import { 
  Zap, 
  LayoutDashboard, 
  PlayCircle, 
  Users, 
  Wallet, 
  History, 
  ShieldCheck, 
  LogOut,
  Sparkles,
  User as UserIcon
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
  isAdminMode,
  setIsAdminMode,
}) => {
  const navItems = [
    { id: 'dash', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ads', label: 'Watch Ads', icon: PlayCircle },
    { id: 'team', label: 'Referrals', icon: Users },
    { id: 'wd', label: 'Withdraw', icon: Wallet },
    { id: 'hist', label: 'History', icon: History },
    { id: 'prof', label: 'Profile', icon: UserIcon },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#050505]/85 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo */}
        <div 
          onClick={() => {
            if (isAdminMode) setIsAdminMode(false);
            setActiveTab('dash');
          }}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-black font-black shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition">
            <Zap className="w-5 h-5 fill-black stroke-black" />
          </div>
          <div>
            <span className="font-extrabold text-base md:text-lg tracking-tight text-white block leading-none">
              Watch Ads <span className="gold font-black">&amp; Earn</span>
            </span>
            <span className="text-[10px] text-neutral-400 tracking-wider uppercase font-semibold">
              Daily Reward Platform
            </span>
          </div>
        </div>

        {/* Desktop Nav for Logged In User */}
        {user && !isAdminMode && (
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-full px-2 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                    isActive
                      ? 'bg-yellow-500 text-black shadow-sm'
                      : 'text-neutral-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {user && (
            <>
              {/* User Balance Chip */}
              {!isAdminMode && (
                <div 
                  onClick={() => setActiveTab('wd')}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-xs font-bold text-yellow-400 cursor-pointer hover:bg-yellow-500/20 transition"
                  title="Click to withdraw"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{formatPKR(user.balance)}</span>
                </div>
              )}

              {/* Profile Avatar Button */}
              {!isAdminMode && (
                <button
                  onClick={() => {
                    setActiveTab('prof');
                  }}
                  className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center transition border ${
                    activeTab === 'prof'
                      ? 'bg-yellow-400 text-black border-yellow-300 ring-2 ring-yellow-500/40 shadow-sm'
                      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'
                  }`}
                  title="My Profile"
                >
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </button>
              )}

              {/* Admin Mode Switcher if user has is_admin role */}
              {user.is_admin && (
                <button
                  onClick={() => setIsAdminMode(!isAdminMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition border ${
                    isAdminMode
                      ? 'bg-amber-400 text-black border-amber-300 shadow-lg shadow-amber-500/30'
                      : 'bg-white/5 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isAdminMode ? 'Exit Admin' : 'Admin Panel'}</span>
                </button>
              )}

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-neutral-400 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/5 transition"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          )}

          {!user && (
            <div className="text-xs text-neutral-400 font-medium">
              Daily Earnings Guaranteed
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
