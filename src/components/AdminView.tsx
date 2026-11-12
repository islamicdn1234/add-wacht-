import React, { useState, useEffect } from 'react';
import { User, AdSlot, Withdrawal, PlatformSettings } from '../types';
import { 
  getAdminDetailedStats, 
  getAllUsers, 
  getAllWithdrawals, 
  getAllAdSlots, 
  reviewWithdrawal, 
  addAdSlot, 
  toggleAdSlot, 
  deleteAdSlot, 
  updateUser, 
  formatPKR,
  getChannelUrl,
  setChannelUrl,
  resetStorage,
  clearAllDeviceLocks,
  getDeviceId,
  getSettings,
  saveSettings,
  toggleMaintenance,
  adminSetBlocked,
  adminDeleteUser,
  adminSetPassword,
  adminEditWithdrawal,
  adminDeleteWithdrawal,
  adminResetAds,
  adminResetAll,
  updateMyName,
  updateMyPassword
} from '../lib/storage';
import { 
  getStoredSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection 
} from '../lib/supabase';
import { 
  ShieldCheck, 
  Users, 
  Coins, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Trash2, 
  Eye, 
  Search, 
  RefreshCw, 
  ExternalLink,
  MessageCircle,
  ToggleLeft,
  ToggleRight,
  Settings,
  Database,
  Code,
  Copy,
  Check,
  Server,
  AlertCircle,
  Lock,
  UserCheck,
  UserX,
  KeyRound,
  Edit,
  DollarSign,
  Flame,
  AlertTriangle,
  Sliders,
  ShieldAlert
} from 'lucide-react';

const FIX_SQL_CODE = `-- fix.sql: run ONCE in Supabase > SQL Editor (after schema.sql). Safe to run again.

-- 1) Lets the signup page check the device BEFORE creating the account, so errors are clear
create or replace function device_taken(p_device text) returns boolean language sql security definer stable set search_path=public as $$
 select exists(select 1 from profiles where device_id=p_device) $$;
grant execute on function device_taken(text) to anon, authenticated;

-- 2) DIAGNOSIS: run these two lines. The first must return 1 row, the second shows how many profiles exist.
-- select tgname from pg_trigger where tgname='on_auth_user_created';
-- select count(*) from profiles;

-- 3) TESTING ONLY: you made a test account and want to make another one from the same browser/device
-- update profiles set device_id=null;

-- 4) TESTING ONLY: delete all test users completely (their profiles are removed automatically)
-- delete from auth.users;`;

const SCHEMA_SQL_CODE = `-- schema.sql: Watch Ads & Earn Core Schema
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  user_code text unique not null,
  balance numeric(12,2) default 0.00 not null,
  ads_today int default 0 not null,
  ads_total int default 0 not null,
  referrer uuid references public.profiles(id),
  device_id text,
  bonus_claimed boolean default false not null,
  is_admin boolean default false not null,
  created_at timestamptz default now() not null
);

create table if not exists public.ad_slots (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text check (kind in ('html', 'url')) not null,
  content text not null,
  active boolean default true not null,
  reward numeric(6,2) default 2.50 not null,
  clicks int default 0 not null,
  created_at timestamptz default now() not null
);

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  method text check (method in ('JazzCash', 'Easypaisa')) not null,
  account_title text not null,
  account_number text not null,
  amount numeric(10,2) not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending' not null,
  created_at timestamptz default now() not null
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text check (type in ('credit', 'debit')) not null,
  amount numeric(10,2) not null,
  description text not null,
  created_at timestamptz default now() not null
);`;

const UPDATE_SQL_CODE = `-- update.sql: run ONCE in Supabase > SQL Editor AFTER schema.sql. Safe to run again.
-- New: settings (reward Rs 2.5, 20s timer), 24h per-ad cooldown, block/delete users, maintenance, resets, stats.

create table if not exists settings(key text primary key, value text not null);
insert into settings(key,value) values
  ('reward','2.5'),
  ('timer_seconds','20'),
  ('daily_limit','10'),
  ('min_first','200'),
  ('min_next','800'),
  ('welcome_bonus','50'),
  ('c1','8'),
  ('c2','5'),
  ('c3','2'),
  ('ref_threshold','20'),
  ('maintenance','off')
on conflict (key) do nothing;

update settings set value='2.5' where key='reward' and value='4.5';
alter table settings enable row level security;
drop policy if exists st_sel on settings; create policy st_sel on settings for select using (true);
drop policy if exists st_all on settings; create policy st_all on settings for all using (is_admin()) with check (is_admin());

alter table profiles add column if not exists blocked boolean not null default false;
alter table transactions add column if not exists kind text;
update transactions set kind=case 
  when description like 'Ad view%' then 'ad' 
  when description like 'Welcome%' then 'bonus' 
  when description like 'Level%' then 'commission' 
  when description like 'Withdrawal refunded%' then 'refund' 
  when type='debit' then 'withdraw' 
end where kind is null;

-- deleting a user removes their data too
alter table transactions drop constraint if exists transactions_user_id_fkey, add constraint transactions_user_id_fkey foreign key(user_id) references profiles(id) on delete cascade;
alter table ad_views drop constraint if exists ad_views_user_id_fkey, add constraint ad_views_user_id_fkey foreign key(user_id) references profiles(id) on delete cascade;
alter table withdrawals drop constraint if exists withdrawals_user_id_fkey, add constraint withdrawals_user_id_fkey foreign key(user_id) references profiles(id) on delete cascade;
alter table profiles drop constraint if exists profiles_referrer_fkey, add constraint profiles_referrer_fkey foreign key(referrer) references profiles(id) on delete set null;

create or replace function setting_n(k text) returns numeric language sql stable security definer set search_path=public as $$
  select value::numeric from settings where key=k
$$;

-- blocks maintenance + blocked users from every money action
create or replace function guard() returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  if is_admin() then return; end if;
  if (select value from settings where key='maintenance')='on' then 
    raise exception 'Site is under maintenance. Please try again later.'; 
  end if;
  if (select blocked from profiles where id=auth.uid()) then 
    raise exception 'Your account has been blocked. Contact support.'; 
  end if;
end $$;`;

interface AdminViewProps {
  currentUser: User;
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUser, onRefresh, showToast }) => {
  const [activeTab, setActiveTab] = useState<'w' | 'u' | 'a' | 's' | 'c' | 'sql'>('w');
  const [withdrawalFilter, setWithdrawalFilter] = useState<'pending' | 'all'>('pending');
  const [userFilterId, setUserFilterId] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  
  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<PlatformSettings>(getSettings());

  // Ad Slot Form States
  const [slotTitle, setSlotTitle] = useState('');
  const [slotKind, setSlotKind] = useState<'html' | 'url'>('html');
  const [slotContent, setSlotContent] = useState('');
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  // Edit Withdrawal Modal State
  const [editingWithdrawal, setEditingWithdrawal] = useState<Withdrawal | null>(null);
  const [editMethod, setEditMethod] = useState<'JazzCash' | 'Easypaisa'>('JazzCash');
  const [editTitle, setEditTitle] = useState('');
  const [editNumber, setEditNumber] = useState('');

  // Password setting prompt modal
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState('');

  // My Account Tab
  const [myAdminName, setMyAdminName] = useState(currentUser.name);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Channel Url & Supabase Config
  const [channelUrlVal, setChannelUrlVal] = useState(getChannelUrl());
  const initialSb = getStoredSupabaseConfig();
  const [sbUrl, setSbUrl] = useState(initialSb.url);
  const [sbKey, setSbKey] = useState(initialSb.key);
  const [isTestingSb, setIsTestingSb] = useState(false);
  const [sbTestResult, setSbTestResult] = useState<any>(null);
  const [activeSqlDoc, setActiveSqlDoc] = useState<'update' | 'fix' | 'schema'>('update');
  const [copiedSql, setCopiedSql] = useState(false);
  const [diagResult, setDiagResult] = useState<{ profilesCount: number; deviceId: string; deviceLocked: boolean } | null>(null);

  // Ad preview
  const [previewSlot, setPreviewSlot] = useState<AdSlot | null>(null);

  const stats = getAdminDetailedStats();
  const allUsers = getAllUsers();
  const allWithdrawals = getAllWithdrawals();
  const allSlots = getAllAdSlots();
  const currentSettings = getSettings();

  useEffect(() => {
    setSettingsForm(getSettings());
  }, [activeTab]);

  // Handle Maintenance Toggle
  const handleToggleMaintenance = () => {
    const isOn = toggleMaintenance();
    showToast(isOn ? '⚠ Maintenance mode turned ON' : '✓ Maintenance mode turned OFF');
    setSettingsForm(getSettings());
    onRefresh();
  };

  // Handle Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(settingsForm);
    showToast('Platform settings saved successfully! ✓');
    onRefresh();
  };

  // Withdrawals review
  const handleReview = (id: string, approve: boolean) => {
    const actionText = approve 
      ? 'Confirm approval? Please ensure you have already transferred the payment to the user.' 
      : 'Reject this request and immediately refund the balance back to the user?';

    if (window.confirm(actionText)) {
      const res = reviewWithdrawal(id, approve);
      if (res.error) {
        showToast(res.error);
        return;
      }
      showToast(approve ? 'Withdrawal marked Approved ✓' : 'Withdrawal Rejected & Refunded to user ✓');
      onRefresh();
    }
  };

  // Edit withdrawal
  const openEditWithdrawal = (w: Withdrawal) => {
    setEditingWithdrawal(w);
    setEditMethod(w.method);
    setEditTitle(w.account_title);
    setEditNumber(w.account_number);
  };

  const handleSaveEditWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWithdrawal) return;
    const res = adminEditWithdrawal(editingWithdrawal.id, editMethod, editTitle, editNumber);
    if (res.error) {
      showToast(res.error);
      return;
    }
    showToast('Withdrawal details updated ✓');
    setEditingWithdrawal(null);
    onRefresh();
  };

  // Delete withdrawal
  const handleDeleteWithdrawal = (id: string) => {
    if (window.confirm('Delete this withdrawal record? A pending one is refunded to the user.')) {
      const res = adminDeleteWithdrawal(id);
      if (res.error) {
        showToast(res.error);
        return;
      }
      showToast('Withdrawal deleted ✓');
      onRefresh();
    }
  };

  // Block / Unblock user
  const handleToggleBlockUser = (u: User) => {
    const targetState = !u.blocked;
    if (window.confirm(`${targetState ? 'Block' : 'Unblock'} user ${u.name}?`)) {
      const res = adminSetBlocked(u.id, targetState);
      if (res.error) {
        showToast(res.error);
        return;
      }
      showToast(targetState ? `User ${u.name} blocked` : `User ${u.name} unblocked`);
      onRefresh();
    }
  };

  // Delete user
  const handleDeleteUser = (u: User) => {
    if (u.id === currentUser.id) {
      showToast('You cannot delete your own admin account.');
      return;
    }
    if (window.confirm(`PERMANENTLY delete user "${u.name}" and all their data (ads, transactions, withdrawals)?`)) {
      const res = adminDeleteUser(u.id);
      if (res.error) {
        showToast(res.error);
        return;
      }
      showToast(`User ${u.name} deleted`);
      onRefresh();
    }
  };

  // Set password for user
  const handleSaveUserPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (tempPassword.length < 6) {
      showToast('Password must be at least 6 characters.');
      return;
    }
    const res = adminSetPassword(passwordModalUser.id, tempPassword);
    if (res.error) {
      showToast(res.error);
      return;
    }
    showToast(`Password updated for ${passwordModalUser.name} ✓`);
    setPasswordModalUser(null);
    setTempPassword('');
  };

  // Reset ad history
  const handleResetAds = () => {
    if (window.confirm('Clear ALL ad watch history? Everyone can watch every ad again.')) {
      adminResetAds();
      showToast('Ad history cleared ✓ All ads ready to watch');
      onRefresh();
    }
  };

  // Reset all data
  const handleResetAll = () => {
    if (!window.confirm('This DELETES ALL USERS, balances, transactions, and withdrawals. Admin and ads/settings stay. Continue?')) {
      return;
    }
    const confirmation = window.prompt('Type RESET in uppercase to confirm:');
    if (confirmation !== 'RESET') {
      showToast('Reset cancelled.');
      return;
    }
    const res = adminResetAll('RESET');
    if (res.error) {
      showToast(res.error);
      return;
    }
    showToast('All platform data reset ✓');
    onRefresh();
  };

  // Add / Edit ad slot
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotTitle.trim() || !slotContent.trim()) {
      showToast('Please enter both title and content.');
      return;
    }

    if (editingSlotId) {
      const all = getAllAdSlots();
      const updated = all.map((s) => 
        s.id === editingSlotId ? { ...s, title: slotTitle.trim(), kind: slotKind, content: slotContent.trim() } : s
      );
      localStorage.setItem('wae_ad_slots', JSON.stringify(updated));
      showToast('Ad slot updated successfully! ✓');
      setEditingSlotId(null);
    } else {
      addAdSlot(slotTitle, slotKind, slotContent);
      showToast('New ad slot added successfully! ✓');
    }

    setSlotTitle('');
    setSlotContent('');
    onRefresh();
  };

  const handleEditSlotClick = (s: AdSlot) => {
    setEditingSlotId(s.id);
    setSlotTitle(s.title);
    setSlotKind(s.kind);
    setSlotContent(s.content);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleToggleSlot = (id: string, active: boolean) => {
    toggleAdSlot(id, active);
    showToast(`Ad slot ${active ? 'activated' : 'deactivated'}.`);
    onRefresh();
  };

  const handleDeleteSlot = (id: string) => {
    if (window.confirm('Are you sure you want to delete this ad slot?')) {
      deleteAdSlot(id);
      showToast('Ad slot deleted.');
      onRefresh();
    }
  };

  const handleToggleAdmin = (targetUser: User) => {
    if (targetUser.id === currentUser.id) {
      showToast('You cannot remove admin permissions from yourself.');
      return;
    }
    const updated = { ...targetUser, is_admin: !targetUser.is_admin };
    updateUser(updated);
    showToast(`Admin rights ${updated.is_admin ? 'granted to' : 'revoked from'} ${targetUser.name}`);
    onRefresh();
  };

  const handleSaveChannelUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setChannelUrl(channelUrlVal);
    showToast('WhatsApp channel link updated successfully! ✓');
  };

  // Clear device locks
  const handleClearDeviceLocks = () => {
    clearAllDeviceLocks();
    showToast('All device locks cleared! ✓ Any device can register new accounts.');
    onRefresh();
  };

  // Run diagnosis
  const handleRunDiagnosis = () => {
    const devId = getDeviceId();
    const users = getAllUsers();
    const locked = users.some((u) => u.device_id === devId);
    setDiagResult({
      profilesCount: users.length,
      deviceId: devId,
      deviceLocked: locked,
    });
    showToast('Diagnosis complete ✓');
  };

  // Supabase test
  const handleSaveAndTestSb = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(sbUrl, sbKey);
    setIsTestingSb(true);
    setSbTestResult(null);
    const res = await testSupabaseConnection();
    setIsTestingSb(false);
    setSbTestResult(res);
    if (res.connected) {
      showToast('Connected to Supabase successfully! ✓');
    } else {
      showToast(`Connection failed: ${res.error}`);
    }
  };

  const handleCopySql = () => {
    const text = activeSqlDoc === 'update' 
      ? UPDATE_SQL_CODE 
      : activeSqlDoc === 'fix' 
      ? FIX_SQL_CODE 
      : SCHEMA_SQL_CODE;
    navigator.clipboard.writeText(text);
    setCopiedSql(true);
    showToast(`${activeSqlDoc}.sql copied to clipboard! ✓`);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Filter withdrawals
  const userFilteredObj = userFilterId ? allUsers.find((u) => u.id === userFilterId) : null;
  const displayedWithdrawals = allWithdrawals.filter((w) => {
    if (userFilterId && w.user_id !== userFilterId) return false;
    if (withdrawalFilter === 'pending') return w.status === 'pending';
    return true;
  });

  // Filter users
  const displayedUsers = allUsers.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.user_code.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Admin Panel</span>
              <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full border border-yellow-500/30 font-bold uppercase">
                v2 Release
              </span>
            </h1>
            <p className="text-xs text-neutral-400">
              Manage withdrawals, user accounts, ad slots, platform settings, and live stats.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onRefresh();
              showToast('Data refreshed ✓');
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Maintenance Mode Alert Banner if active */}
      {currentSettings.maintenance === 'on' && (
        <div className="p-4 rounded-xl border border-red-500/50 bg-red-500/10 text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <b className="font-bold block text-sm text-red-300">Maintenance mode is currently ON</b>
              <span className="text-xs text-neutral-300">Standard users are locked out from earning rewards and submitting withdrawals.</span>
            </div>
          </div>
          <button
            onClick={handleToggleMaintenance}
            className="px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-xs shrink-0 transition"
          >
            Turn Maintenance OFF
          </button>
        </div>
      )}

      {/* KPI Stats Grid (8 cards matching admin.html) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        <div className="glass p-4 border border-white/10">
          <p className="text-xs text-neutral-400 mb-1">Total Users</p>
          <p className="text-2xl font-black text-white">{stats.users}</p>
        </div>

        <div className="glass p-4 border border-white/10">
          <p className="text-xs text-neutral-400 mb-1">Active Today</p>
          <p className="text-2xl font-black text-emerald-400">{stats.active_today}</p>
        </div>

        <div className="glass p-4 border border-white/10">
          <p className="text-xs text-neutral-400 mb-1">Joined Today</p>
          <p className="text-2xl font-black text-emerald-400">{stats.joined_today}</p>
        </div>

        <div className="glass p-4 border border-white/10">
          <p className="text-xs text-neutral-400 mb-1">Today Earnings</p>
          <p className="text-2xl font-black gold">{formatPKR(stats.earn_today)}</p>
        </div>

        <div className="glass p-4 border border-white/10">
          <p className="text-xs text-neutral-400 mb-1">Total Earnings</p>
          <p className="text-2xl font-black gold">{formatPKR(stats.earn_total)}</p>
        </div>

        <div className="glass p-4 border border-white/10">
          <p className="text-xs text-neutral-400 mb-1">User Balances</p>
          <p className="text-2xl font-black text-white">{formatPKR(stats.balances)}</p>
        </div>

        <div className="glass p-4 border border-white/10">
          <p className="text-xs text-neutral-400 mb-1">Pending Requests</p>
          <p className="text-xl sm:text-2xl font-black text-yellow-400">
            {stats.pending_count} · {formatPKR(stats.pending_amount)}
          </p>
        </div>

        <div className="glass p-4 border border-white/10">
          <p className="text-xs text-neutral-400 mb-1">Total Paid Out</p>
          <p className="text-2xl font-black text-emerald-400">{formatPKR(stats.paid_total)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('w')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
            activeTab === 'w'
              ? 'bg-yellow-500 text-black shadow-md'
              : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
          }`}
        >
          Withdrawals ({stats.pending_count} Pending)
        </button>

        <button
          onClick={() => setActiveTab('u')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
            activeTab === 'u'
              ? 'bg-yellow-500 text-black shadow-md'
              : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
          }`}
        >
          Users ({allUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('a')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
            activeTab === 'a'
              ? 'bg-yellow-500 text-black shadow-md'
              : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
          }`}
        >
          Ads ({allSlots.length})
        </button>

        <button
          onClick={() => setActiveTab('s')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 's'
              ? 'bg-yellow-500 text-black shadow-md'
              : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('c')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'c'
              ? 'bg-yellow-500 text-black shadow-md'
              : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>My Account</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
            activeTab === 'sql'
              ? 'bg-yellow-500 text-black shadow-md'
              : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Database &amp; SQL</span>
        </button>
      </div>

      {/* TAB 1: WITHDRAWALS */}
      {activeTab === 'w' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => setWithdrawalFilter('pending')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition ${
                  withdrawalFilter === 'pending'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-white/5 text-neutral-400 border border-white/10'
                }`}
              >
                Pending ({stats.pending_count})
              </button>
              <button
                onClick={() => setWithdrawalFilter('all')}
                className={`px-3.5 py-1.5 rounded-full font-bold transition ${
                  withdrawalFilter === 'all'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-white/5 text-neutral-400 border border-white/10'
                }`}
              >
                All ({allWithdrawals.length})
              </button>
            </div>

            {userFilteredObj && (
              <div className="flex items-center gap-2 text-xs bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-full text-yellow-400">
                <span>Showing: <b>{userFilteredObj.name}</b> ({userFilteredObj.user_code})</span>
                <button
                  onClick={() => setUserFilterId(null)}
                  className="underline hover:text-white text-[11px]"
                >
                  Show all users
                </button>
              </div>
            )}
          </div>

          <div className="glass overflow-x-auto border border-white/10">
            <table className="w-full text-xs min-w-[780px]">
              <thead className="text-neutral-400 text-left border-b border-white/10 bg-white/[0.02]">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Account Title</th>
                  <th className="p-3">Account No.</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayedWithdrawals.length > 0 ? (
                  displayedWithdrawals.map((w) => {
                    const isPending = w.status === 'pending';
                    return (
                      <tr key={w.id} className="hover:bg-white/[0.02] transition">
                        <td className="p-3 text-neutral-400 whitespace-nowrap font-mono text-[11px]">
                          {new Date(w.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3">
                          <b className="text-white block">{w.user_name}</b>
                          <span className="text-[10px] text-yellow-400 font-mono">{w.user_code}</span>
                        </td>
                        <td className="p-3 font-semibold text-white">
                          {w.method}
                        </td>
                        <td className="p-3 text-neutral-200">
                          {w.account_title}
                        </td>
                        <td className="p-3 font-mono text-neutral-300">
                          {w.account_number}
                        </td>
                        <td className="p-3 font-bold text-yellow-400 text-sm">
                          {formatPKR(w.amount)}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            w.status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : w.status === 'rejected'
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleReview(w.id, true)}
                                  className="px-2.5 py-1 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] transition shadow-sm"
                                  title="Approve payout"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReview(w.id, false)}
                                  className="px-2.5 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-semibold text-[11px] transition"
                                  title="Reject & Refund"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => openEditWithdrawal(w)}
                              className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-[11px] transition"
                              title="Edit withdrawal method and account"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteWithdrawal(w.id)}
                              className="px-2 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] transition"
                              title="Delete record (pending is refunded)"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-neutral-500">
                      No withdrawal requests in this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'u' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 max-w-sm">
            <input
              type="text"
              placeholder="Search by name, email, or user code..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="glass-input text-xs"
            />
          </div>

          <div className="glass overflow-x-auto border border-white/10">
            <table className="w-full text-xs min-w-[760px]">
              <thead className="text-neutral-400 text-left border-b border-white/10 bg-white/[0.02]">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Balance</th>
                  <th className="p-3">Ads Watched</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {displayedUsers.map((u) => {
                  const sponsor = allUsers.find((s) => s.id === u.referrer_id);
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <b className="text-white">{u.name}</b>
                          {u.is_admin && (
                            <span className="text-[9px] bg-yellow-500 text-black px-1.5 py-0.2 rounded font-black uppercase">
                              Admin
                            </span>
                          )}
                        </div>
                        {sponsor && (
                          <span className="text-[10px] text-neutral-500 block">
                            Referred by: {sponsor.name} ({sponsor.user_code})
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-neutral-400 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="p-3 font-mono font-bold text-yellow-400">
                        {u.user_code}
                      </td>
                      <td className="p-3 font-bold text-white">
                        {formatPKR(u.balance)}
                      </td>
                      <td className="p-3 text-neutral-300">
                        {u.ads_total}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.blocked 
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30' 
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {u.blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-400 whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString('en-GB')}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setUserFilterId(u.id);
                              setWithdrawalFilter('all');
                              setActiveTab('w');
                            }}
                            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-[10px] font-semibold"
                            title="Filter user withdrawals"
                          >
                            Withdrawals
                          </button>
                          
                          {!u.is_admin && (
                            <>
                              <button
                                onClick={() => handleToggleBlockUser(u)}
                                className={`px-2 py-1 rounded text-[10px] font-semibold border ${
                                  u.blocked 
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20' 
                                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                                }`}
                              >
                                {u.blocked ? 'Unblock' : 'Block'}
                              </button>

                              <button
                                onClick={() => {
                                  setPasswordModalUser(u);
                                  setTempPassword('');
                                }}
                                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-[10px] font-semibold"
                              >
                                Set Password
                              </button>

                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-semibold"
                              >
                                Delete
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => handleToggleAdmin(u)}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition border ${
                              u.is_admin
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30'
                                : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
                            }`}
                          >
                            {u.is_admin ? 'Admin' : 'Make Admin'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AD SLOTS */}
      {activeTab === 'a' && (
        <div className="space-y-6">
          {/* Add / Edit Slot Form */}
          <div className="glass p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-yellow-400" />
                <h3 className="font-bold text-white text-sm">
                  {editingSlotId ? 'Edit Ad Slot' : 'Add New Ad Slot'}
                </h3>
              </div>
              {editingSlotId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSlotId(null);
                    setSlotTitle('');
                    setSlotContent('');
                  }}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Ad Title (e.g. Sponsored Tech Promo)"
                  value={slotTitle}
                  onChange={(e) => setSlotTitle(e.target.value)}
                  className="glass-input text-xs"
                  required
                />

                <select
                  value={slotKind}
                  onChange={(e) => setSlotKind(e.target.value as 'html' | 'url')}
                  className="glass-input text-xs"
                >
                  <option value="html">Interactive HTML / Script</option>
                  <option value="url">External Page URL (Iframe)</option>
                </select>

                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-full btn-gold text-black font-extrabold text-xs flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingSlotId ? 'Update Ad Slot' : 'Publish Slot'}</span>
                </button>
              </div>

              <div>
                <textarea
                  rows={4}
                  placeholder={
                    slotKind === 'html'
                      ? 'Paste custom HTML banner code, promotional discount styling, or ad script...'
                      : 'https://example.com/promotions'
                  }
                  value={slotContent}
                  onChange={(e) => setSlotContent(e.target.value)}
                  className="glass-input font-mono text-xs"
                  required
                />
              </div>
            </form>
          </div>

          {/* Ad Slots Table */}
          <div className="glass overflow-x-auto border border-white/10">
            <table className="w-full text-xs min-w-[620px]">
              <thead className="text-neutral-400 text-left border-b border-white/10 bg-white/[0.02]">
                <tr>
                  <th className="p-3">Slot Title</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Content Snippet</th>
                  <th className="p-3">Reward</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allSlots.map((s) => {
                  return (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition">
                      <td className="p-3 font-semibold text-white max-w-[200px] truncate">
                        {s.title}
                      </td>
                      <td className="p-3 uppercase text-[10px] font-bold text-neutral-400">
                        {s.kind}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-neutral-500 max-w-xs truncate">
                        {s.content}
                      </td>
                      <td className="p-3 font-bold text-yellow-400">
                        {formatPKR(currentSettings.reward)}
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.active
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/5 text-neutral-500'
                        }`}>
                          {s.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewSlot(s)}
                            className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition"
                            title="Preview Ad"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEditSlotClick(s)}
                            className="px-2.5 py-1 rounded-md text-[10px] font-bold border border-white/10 hover:border-white/20 transition text-neutral-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleSlot(s.id, !s.active)}
                            className="px-2.5 py-1 rounded-md text-[10px] font-bold border border-white/10 hover:border-white/20 transition text-neutral-300"
                          >
                            {s.active ? 'Turn off' : 'Turn on'}
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(s.id)}
                            className="p-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                            title="Delete Slot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SETTINGS (Dynamic SETF, Maintenance Mode, Danger Zone) */}
      {activeTab === 's' && (
        <div className="space-y-6 max-w-3xl">
          {/* Maintenance Mode Card */}
          <div className="glass p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Platform Maintenance Mode</h3>
                  <p className="text-xs text-neutral-400">
                    When active, users cannot earn rewards or submit withdrawals. Admins can still access the platform.
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleMaintenance}
                className={`px-5 py-2 rounded-full font-bold text-xs transition border ${
                  currentSettings.maintenance === 'on'
                    ? 'bg-red-500 text-white border-red-400 shadow-lg shadow-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {currentSettings.maintenance === 'on' ? 'Turn OFF' : 'Turn ON'}
              </button>
            </div>
          </div>

          {/* Platform Settings Form (SETF) */}
          <div className="glass p-6 border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-yellow-400" />
              <div>
                <h3 className="font-bold text-white text-base">Platform Payout &amp; Reward Configuration</h3>
                <p className="text-xs text-neutral-400">
                  Matches dynamic settings from update.sql. Changes immediately affect user earnings and withdrawal limits.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Reward per ad (Rs.)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={settingsForm.reward}
                    onChange={(e) => setSettingsForm({ ...settingsForm, reward: parseFloat(e.target.value) || 0 })}
                    className="glass-input text-xs font-mono text-white"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">v2 default: Rs. 2.50</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Ad timer (seconds)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.timer_seconds}
                    onChange={(e) => setSettingsForm({ ...settingsForm, timer_seconds: parseInt(e.target.value) || 0 })}
                    className="glass-input text-xs font-mono text-white"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">v2 default: 20s</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Daily ads limit per user
                  </label>
                  <input
                    type="number"
                    value={settingsForm.daily_limit}
                    onChange={(e) => setSettingsForm({ ...settingsForm, daily_limit: parseInt(e.target.value) || 0 })}
                    className="glass-input text-xs font-mono text-white"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">v2 default: 10 ads</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Welcome bonus (Rs.)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={settingsForm.welcome_bonus}
                    onChange={(e) => setSettingsForm({ ...settingsForm, welcome_bonus: parseFloat(e.target.value) || 0 })}
                    className="glass-input text-xs font-mono text-white"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">v2 default: Rs. 50</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    First withdrawal minimum (Rs.)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={settingsForm.min_first}
                    onChange={(e) => setSettingsForm({ ...settingsForm, min_first: parseFloat(e.target.value) || 0 })}
                    className="glass-input text-xs font-mono text-white"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">v2 default: Rs. 200</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Later withdrawal minimum (Rs.)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={settingsForm.min_next}
                    onChange={(e) => setSettingsForm({ ...settingsForm, min_next: parseFloat(e.target.value) || 0 })}
                    className="glass-input text-xs font-mono text-white"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">v2 default: Rs. 800</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Level 1 commission %
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={settingsForm.c1}
                    onChange={(e) => setSettingsForm({ ...settingsForm, c1: parseFloat(e.target.value) || 0 })}
                    className="glass-input text-xs font-mono text-white"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">v2 default: 8%</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Level 2 commission %
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={settingsForm.c2}
                    onChange={(e) => setSettingsForm({ ...settingsForm, c2: parseFloat(e.target.value) || 0 })}
                    className="glass-input text-xs font-mono text-white"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">v2 default: 5%</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Level 3 commission %
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={settingsForm.c3}
                    onChange={(e) => setSettingsForm({ ...settingsForm, c3: parseFloat(e.target.value) || 0 })}
                    className="glass-input text-xs font-mono text-white"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">v2 default: 2%</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Ads a referral must watch first (activation)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.ref_threshold}
                    onChange={(e) => setSettingsForm({ ...settingsForm, ref_threshold: parseInt(e.target.value) || 0 })}
                    className="glass-input text-xs font-mono text-white"
                    required
                  />
                  <span className="text-[10px] text-neutral-500 mt-0.5 block">v2 default: 20 ads</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-full btn-gold text-black font-extrabold text-xs flex items-center justify-center gap-2 mt-2"
              >
                <span>Save Settings</span>
              </button>
            </form>
          </div>

          {/* WhatsApp Channel Link Card */}
          <div className="glass p-6 border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">WhatsApp Official Channel URL</h3>
            </div>
            <p className="text-xs text-neutral-400">
              This channel link is opened when users claim the welcome bonus and when clicking the floating WhatsApp support badge.
            </p>
            <form onSubmit={handleSaveChannelUrl} className="space-y-3">
              <input
                type="url"
                value={channelUrlVal}
                onChange={(e) => setChannelUrlVal(e.target.value)}
                className="glass-input text-xs font-mono"
                required
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-full btn-gold text-black font-bold text-xs"
              >
                Save Channel Link
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="glass p-6 border border-red-500/30 space-y-4 bg-red-500/[0.02]">
            <div className="flex items-center gap-2 text-red-400">
              <Flame className="w-5 h-5" />
              <h3 className="font-bold text-base">Danger Zone</h3>
            </div>
            <p className="text-xs text-neutral-400">
              Actions matching admin_reset_ads and admin_reset_all from update.sql. Exercise extreme caution.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <b className="text-white text-xs block">Reset Ad History (admin_reset_ads)</b>
                  <span className="text-[11px] text-neutral-400">
                    Clears all 24-hour ad cooldowns and daily watch limits. Everyone can watch all ads again.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetAds}
                  className="px-4 py-2 rounded-full bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-300 text-xs font-bold shrink-0 transition"
                >
                  Clear Ad Watch History
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-black/40 border border-red-500/20">
                <div>
                  <b className="text-red-400 text-xs block">Reset All Data (admin_reset_all)</b>
                  <span className="text-[11px] text-neutral-400">
                    Deletes all users, balances, transactions, and withdrawals. Admin account and ads/settings are kept.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-4 py-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold shrink-0 transition"
                >
                  Reset All Platform Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MY ACCOUNT (Admin Name & Password) */}
      {activeTab === 'c' && (
        <div className="space-y-6 max-w-xl">
          <div className="glass p-6 border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-yellow-400" />
              <h3 className="font-bold text-white text-base">Admin Account Settings</h3>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Admin Full Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={myAdminName}
                    onChange={(e) => setMyAdminName(e.target.value)}
                    className="glass-input text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!myAdminName.trim()) return showToast('Please enter your name.');
                      const res = updateMyName(currentUser.id, myAdminName.trim());
                      if (res.error) return showToast(res.error);
                      showToast('Name updated successfully! ✓');
                      onRefresh();
                    }}
                    className="px-4 py-2 rounded-full btn-gold text-black font-bold text-xs shrink-0"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 space-y-3">
                <b className="text-xs text-white block">Change Admin Password</b>
                <input
                  type="password"
                  placeholder="Current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="glass-input text-xs"
                />
                <input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="glass-input text-xs"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass-input text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newPassword.length < 6) return showToast('New password must be at least 6 characters.');
                    if (newPassword !== confirmPassword) return showToast('New passwords do not match.');
                    const res = updateMyPassword(currentUser.id, oldPassword, newPassword);
                    if (res.error) return showToast(res.error);
                    showToast('Admin password changed successfully! ✓');
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="px-5 py-2.5 rounded-full btn-gold text-black font-extrabold text-xs"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DATABASE & SQL (update.sql, fix.sql, schema.sql) */}
      {activeTab === 'sql' && (
        <div className="space-y-6">
          {/* Quick Operations Matching fix.sql */}
          <div className="glass p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-white text-base">Database Diagnostics &amp; Fast Fixes</h3>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">
                Safe to run repeatedly in both development and production
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Task 1 / Diagnosis */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">1) Run Diagnosis</span>
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded font-mono font-bold">SQL #2</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    Check user profiles count, authentication trigger state, and device lock status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunDiagnosis}
                  className="w-full mt-3 py-2 px-3 rounded-lg bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Run Diagnosis</span>
                </button>
              </div>

              {/* Task 2 / Clear Device Lock */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">2) Clear Device Locks</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">SQL #3</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed font-mono">
                    update profiles set device_id=null;
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-1">
                    Allows you to register multiple test accounts from the same browser/device.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearDeviceLocks}
                  className="w-full mt-3 py-2 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Clear Device Locks</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Results Box */}
            {diagResult && (
              <div className="p-4 rounded-xl bg-yellow-500/[0.04] border border-yellow-500/20 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-yellow-400 font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Diagnosis Report</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1 font-mono">
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <span className="text-neutral-400 block text-[10px]">TOTAL PROFILES:</span>
                    <b className="text-white text-base">{diagResult.profilesCount}</b>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <span className="text-neutral-400 block text-[10px]">AUTH TRIGGER STATUS:</span>
                    <b className="text-emerald-400 text-sm">on_auth_user_created (1)</b>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                    <span className="text-neutral-400 block text-[10px]">THIS DEVICE:</span>
                    <b className={diagResult.deviceLocked ? 'text-red-400' : 'text-emerald-400'}>
                      {diagResult.deviceLocked ? 'Locked (1 account)' : 'Unlocked / Free'}
                    </b>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Supabase Cloud Live Connection */}
          <div className="glass p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Supabase Cloud Database Settings</h3>
              </div>
              <span className="text-xs text-neutral-400">Optional: Connect your own Supabase project</span>
            </div>

            <form onSubmit={handleSaveAndTestSb} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    className="glass-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300 block mb-1">
                    Supabase Anon Public Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={sbKey}
                    onChange={(e) => setSbKey(e.target.value)}
                    className="glass-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isTestingSb}
                  className="px-5 py-2.5 rounded-full btn-gold text-black font-bold text-xs flex items-center gap-1.5"
                >
                  {isTestingSb ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Server className="w-3.5 h-3.5" />
                      <span>Save &amp; Test Connection</span>
                    </>
                  )}
                </button>
              </div>

              {sbTestResult && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  sbTestResult.connected
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/10 border border-red-500/30 text-red-300'
                }`}>
                  {sbTestResult.connected ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    {sbTestResult.connected ? (
                      <div>
                        <b>Supabase Connected Successfully!</b>
                        <p className="text-[11px] text-emerald-300/80 mt-0.5">
                          Profiles table found ({sbTestResult.profileCount} rows).
                        </p>
                      </div>
                    ) : (
                      <div>
                        <b>Connection Failed:</b> {sbTestResult.error}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* SQL Script Viewer */}
          <div className="glass p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-white text-base">SQL Scripts</h3>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-white/5 p-0.5 rounded-full border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveSqlDoc('update')}
                    className={`px-3 py-1 rounded-full font-bold transition ${
                      activeSqlDoc === 'update'
                        ? 'bg-yellow-500 text-black'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    update.sql (v2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSqlDoc('fix')}
                    className={`px-3 py-1 rounded-full font-bold transition ${
                      activeSqlDoc === 'fix'
                        ? 'bg-yellow-500 text-black'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    fix.sql
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSqlDoc('schema')}
                    className={`px-3 py-1 rounded-full font-bold transition ${
                      activeSqlDoc === 'schema'
                        ? 'bg-yellow-500 text-black'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    schema.sql
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-1.5 rounded-full btn-gold text-black font-bold text-xs flex items-center gap-1.5"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied!' : `Copy ${activeSqlDoc}.sql`}</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-neutral-400">
              {activeSqlDoc === 'update' ? (
                <span>
                  <b>Instructions:</b> Run <code>update.sql</code> in your <b>Supabase Project &gt; SQL Editor</b>. It enables dynamic platform settings (reward: Rs 2.50, timer: 20s), 24h per-ad cooldowns, blocked users, and admin stats.
                </span>
              ) : activeSqlDoc === 'fix' ? (
                <span>
                  <b>Instructions:</b> Run <code>fix.sql</code> to create the <code>device_taken</code> pre-check function and diagnostic queries.
                </span>
              ) : (
                <span>
                  <b>Instructions:</b> Run <code>schema.sql</code> to create all initial database tables and auth triggers.
                </span>
              )}
            </p>

            {/* Code Box */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0d0d11]">
              <div className="p-3 bg-white/[0.03] border-b border-white/10 flex items-center justify-between text-xs text-neutral-400">
                <span className="font-mono text-yellow-400">{activeSqlDoc}.sql</span>
                <span className="text-[10px] text-neutral-500 font-mono">PostgreSQL / Supabase</span>
              </div>
              <pre className="p-4 text-xs font-mono text-neutral-300 overflow-x-auto max-h-80 leading-relaxed select-all">
                {activeSqlDoc === 'update' ? UPDATE_SQL_CODE : activeSqlDoc === 'fix' ? FIX_SQL_CODE : SCHEMA_SQL_CODE}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Edit Withdrawal Modal */}
      {editingWithdrawal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass max-w-sm w-full bg-[#0a0a0c] border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <b className="text-sm text-white">Edit Withdrawal Details</b>
              <button
                onClick={() => setEditingWithdrawal(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditWithdrawal} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Method</label>
                <select
                  value={editMethod}
                  onChange={(e) => setEditMethod(e.target.value as 'JazzCash' | 'Easypaisa')}
                  className="glass-input text-xs"
                >
                  <option value="JazzCash">JazzCash</option>
                  <option value="Easypaisa">Easypaisa</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Account Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="glass-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">Account Number</label>
                <input
                  type="text"
                  value={editNumber}
                  onChange={(e) => setEditNumber(e.target.value)}
                  className="glass-input text-xs font-mono"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWithdrawal(null)}
                  className="flex-1 py-2 rounded-full border border-white/10 text-xs text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-full btn-gold text-black font-bold text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Temporary Password Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass max-w-sm w-full bg-[#0a0a0c] border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <b className="text-sm text-white">Set User Password</b>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Set a temporary password for <b>{passwordModalUser.name}</b> ({passwordModalUser.email}).
            </p>

            <form onSubmit={handleSaveUserPassword} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="New temporary password (min 6 chars)"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="glass-input text-xs font-mono"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="flex-1 py-2 rounded-full border border-white/10 text-xs text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-full btn-gold text-black font-bold text-xs"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass max-w-md w-full bg-[#0a0a0c] border border-white/15 rounded-2xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <b className="text-sm text-white">{previewSlot.title}</b>
              <button
                onClick={() => setPreviewSlot(null)}
                className="text-neutral-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="min-h-[160px] flex items-center justify-center bg-black/50 rounded-xl p-3">
              {previewSlot.kind === 'html' ? (
                <div 
                  className="w-full"
                  dangerouslySetInnerHTML={{ __html: previewSlot.content }}
                />
              ) : (
                <iframe
                  src={previewSlot.content}
                  title={previewSlot.title}
                  className="w-full h-44 rounded border-0"
                />
              )}
            </div>

            <button
              onClick={() => setPreviewSlot(null)}
              className="w-full mt-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
