import React from 'react';
import { 
  LayoutDashboard, 
  PlayCircle, 
  Users, 
  Wallet, 
  History,
  User as UserIcon
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const items = [
    { id: 'dash', label: 'Home', icon: LayoutDashboard },
    { id: 'ads', label: 'Ads', icon: PlayCircle },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'wd', label: 'Withdraw', icon: Wallet },
    { id: 'hist', label: 'History', icon: History },
    { id: 'prof', label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#09090b]/95 backdrop-blur-lg border-t border-white/10 grid grid-cols-6 text-center text-[10px] pb-[env(safe-area-inset-bottom,0px)]">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`py-2.5 flex flex-col items-center justify-center gap-1 transition ${
              isActive ? 'text-yellow-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <div className={`p-1 rounded-full ${isActive ? 'bg-yellow-500/15' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
