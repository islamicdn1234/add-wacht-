import { 
  User, 
  AdSlot, 
  Withdrawal, 
  Transaction, 
  TeamMember, 
  PlatformSettings, 
  AdViewRecord, 
  AdminDetailedStats 
} from '../types';
import { getSupabaseClient } from './supabase';

const STORAGE_KEYS = {
  USERS: 'wae_users_v2',
  AD_SLOTS: 'wae_ad_slots_v2',
  WITHDRAWALS: 'wae_withdrawals_v2',
  TRANSACTIONS: 'wae_transactions_v2',
  CURRENT_USER_ID: 'wae_current_user_id_v2',
  DEVICE_ID: 'wae_device_id_v2',
  CHANNEL_URL: 'wae_channel_url_v2',
  SETTINGS: 'wae_settings_v2',
  AD_VIEWS: 'wae_ad_views_v2',
};

export const DEFAULT_CHANNEL_URL = 'https://whatsapp.com/channel/0029VbDrlKV7j6g4pRrhR71u';

export const DEFAULT_SETTINGS: PlatformSettings = {
  reward: 2.5,
  timer_seconds: 20,
  daily_limit: 10,
  min_first: 200,
  min_next: 800,
  welcome_bonus: 50,
  c1: 8,
  c2: 5,
  c3: 2,
  ref_threshold: 20,
  maintenance: 'off',
};

// Pre-seeded interactive ad slots
const INITIAL_AD_SLOTS: AdSlot[] = [
  {
    id: 'slot-1',
    title: 'Samsung Galaxy S26 Ultra - Official Launch Promo',
    kind: 'html',
    content: `
      <div style="font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#0f172a,#1e1b4b);color:#fff;padding:22px;border-radius:16px;text-align:center;">
        <span style="background:#eab308;color:#000;font-size:11px;font-weight:800;padding:4px 10px;border-radius:99px;text-transform:uppercase;">Featured Tech Deal</span>
        <h2 style="font-size:20px;font-weight:800;margin:10px 0 6px 0;background:linear-gradient(90deg,#fde047,#eab308);-webkit-background-clip:text;color:transparent;">Galaxy S26 Ultra (512GB)</h2>
        <p style="font-size:12px;color:#94a3b8;margin-bottom:14px;">200MP AI Camera. Pre-order now and get 25% Instant Cash Back across Pakistan!</p>
        <div style="display:inline-block;background:rgba(255,255,255,0.08);border:1px dashed #eab308;padding:6px 14px;border-radius:8px;font-family:monospace;font-size:13px;color:#fde047;margin-bottom:12px;">
          CODE: <b>GALAXY2026</b>
        </div><br>
        <button style="background:linear-gradient(135deg,#fde047,#eab308);border:none;color:#000;font-weight:700;padding:9px 20px;border-radius:99px;cursor:pointer;font-size:12px;">Claim Exclusive Deal &rarr;</button>
      </div>
    `,
    active: true,
    clicks: 1420,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'slot-2',
    title: 'Digital Marketing & AI Masterclass 2026',
    kind: 'html',
    content: `
      <div style="font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#18181b,#27272a);color:#fff;padding:22px;border-radius:16px;text-align:center;border:1px solid rgba(234,179,8,0.3);">
        <span style="background:rgba(34,197,94,0.2);color:#4ade80;font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;">Online Certification</span>
        <h2 style="font-size:20px;font-weight:800;margin:10px 0 6px 0;color:#fff;">Learn High-Income AI & Freelance Skills</h2>
        <p style="font-size:12px;color:#a1a1aa;margin-bottom:12px;">Earn $500 - $2,000 monthly working remotely. Urdu & English video tutorials.</p>
        <button style="background:#22c55e;border:none;color:#000;font-weight:800;padding:9px 22px;border-radius:99px;cursor:pointer;font-size:12px;">Enroll Free Today</button>
      </div>
    `,
    active: true,
    clicks: 980,
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'slot-3',
    title: 'FastFiber Ultra 50Mbps Fiber-to-Home',
    kind: 'html',
    content: `
      <div style="font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#022c22,#064e3b);color:#fff;padding:22px;border-radius:16px;text-align:center;">
        <span style="background:#fde047;color:#000;font-size:10px;font-weight:800;padding:3px 9px;border-radius:99px;">Pakistani ISP Special</span>
        <h2 style="font-size:20px;font-weight:800;margin:10px 0 4px 0;color:#6ee7b7;">50 Mbps Unlimited Fiber Internet</h2>
        <p style="font-size:12px;color:#cbd5e1;margin-bottom:12px;">Zero installation fee + Free Wi-Fi 6 router across Karachi, Lahore & Islamabad.</p>
        <button style="background:#fde047;border:none;color:#000;font-weight:700;padding:9px 20px;border-radius:99px;cursor:pointer;font-size:12px;">Check Coverage in My Area</button>
      </div>
    `,
    active: true,
    clicks: 760,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'slot-4',
    title: 'MegaBazaar Pakistan Grand Shopping Gala',
    kind: 'html',
    content: `
      <div style="font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#450a0a,#7f1d1d);color:#fff;padding:22px;border-radius:16px;text-align:center;">
        <span style="background:#fbbf24;color:#000;font-size:11px;font-weight:800;padding:3px 8px;border-radius:99px;">FLASHSALE 70% OFF</span>
        <h2 style="font-size:20px;font-weight:800;margin:10px 0 6px 0;color:#fca5a5;">Up to 70% Off Clothing & Shoes</h2>
        <p style="font-size:12px;color:#fecaca;margin-bottom:12px;">Cash on Delivery all across Pakistan. Free 7-day hassle-free returns.</p>
        <button style="background:linear-gradient(135deg,#fbbf24,#f59e0b);border:none;color:#000;font-weight:700;padding:9px 20px;border-radius:99px;cursor:pointer;font-size:12px;">Shop Deals Now</button>
      </div>
    `,
    active: true,
    clicks: 1150,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'slot-5',
    title: 'EasyGold Investment & Digital Savings',
    kind: 'html',
    content: `
      <div style="font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#1c1917,#292524);color:#fff;padding:22px;border-radius:16px;text-align:center;border:1px solid rgba(234,179,8,0.25);">
        <span style="background:#eab308;color:#000;font-size:11px;font-weight:800;padding:3px 8px;border-radius:99px;">Digital Gold & Assets</span>
        <h2 style="font-size:20px;font-weight:800;margin:10px 0 6px 0;color:#fef08a;">Start Investing with Rs. 500</h2>
        <p style="font-size:12px;color:#d6d3d1;margin-bottom:12px;">100% Shariah compliant 24K physical gold backing. Withdraw anytime to JazzCash.</p>
        <button style="background:linear-gradient(135deg,#fde047,#eab308);border:none;color:#000;font-weight:700;padding:9px 20px;border-radius:99px;cursor:pointer;font-size:12px;">Start Investing</button>
      </div>
    `,
    active: true,
    clicks: 530,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'slot-6',
    title: 'Al-Haramain Luxury Watch Collection',
    kind: 'html',
    content: `
      <div style="font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#09090b,#18181b);color:#fff;padding:22px;border-radius:16px;text-align:center;border:1px solid rgba(255,255,255,0.1);">
        <span style="border:1px solid #eab308;color:#eab308;font-size:10px;font-weight:700;padding:3px 8px;border-radius:99px;">Accessories</span>
        <h2 style="font-size:20px;font-weight:800;margin:10px 0 6px 0;color:#fff;">Automatic Quartz Chronographs</h2>
        <p style="font-size:12px;color:#a1a1aa;margin-bottom:12px;">Sapphire crystal glass, waterproof 50m, 2-year replacement guarantee in Pakistan.</p>
        <button style="background:#eab308;border:none;color:#000;font-weight:700;padding:9px 20px;border-radius:99px;cursor:pointer;font-size:12px;">View Catalog</button>
      </div>
    `,
    active: true,
    clicks: 690,
    created_at: new Date().toISOString(),
  },
];

export function getTodayDateString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export function formatPKR(val: number): string {
  return 'Rs. ' + Number(val || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getDeviceId(): string {
  let dev = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!dev) {
    dev = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, dev);
  }
  return dev;
}

// Pre-seeded production accounts (Super Admins)
const INITIAL_USERS: User[] = [
  {
    id: 'admin-1',
    name: 'Administrator',
    email: 'admin@earn.com',
    password: 'admin123',
    user_code: 'ADM-001',
    balance: 0.0,
    ads_today: 0,
    ads_total: 0,
    last_active_date: getTodayDateString(),
    referrer_id: null,
    is_admin: true,
    blocked: false,
    bonus_claimed: true,
    created_at: new Date().toISOString(),
    device_id: 'admin_device_001',
  },
  {
    id: 'admin-owner',
    name: 'Administrator',
    email: 'islamicdn1234@gmail.com',
    password: 'admin123',
    user_code: 'ADM-002',
    balance: 0.0,
    ads_today: 0,
    ads_total: 0,
    last_active_date: getTodayDateString(),
    referrer_id: null,
    is_admin: true,
    blocked: false,
    bonus_claimed: true,
    created_at: new Date().toISOString(),
    device_id: 'admin_device_owner',
  },
];

const INITIAL_WITHDRAWALS: Withdrawal[] = [];

const INITIAL_TRANSACTIONS: Transaction[] = [];

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error('Error reading key:', key, e);
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing key:', key, e);
  }
}

export function initializeStorage(): void {
  // Purge any legacy demo data from development
  const storedUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  if (storedUsers) {
    try {
      const parsed = JSON.parse(storedUsers) as User[];
      const hasDemo = parsed.some(
        (u) => u.id.startsWith('u-demo') || u.id.startsWith('u-down') || u.id.startsWith('u-upline')
      );
      if (hasDemo) {
        const cleaned = parsed.filter(
          (u) => !u.id.startsWith('u-demo') && !u.id.startsWith('u-down') && !u.id.startsWith('u-upline')
        );
        if (!cleaned.some((u) => u.is_admin)) {
          cleaned.unshift(...INITIAL_USERS);
        }
        setStored(STORAGE_KEYS.USERS, cleaned);
      }
    } catch {
      setStored(STORAGE_KEYS.USERS, INITIAL_USERS);
    }
  } else {
    setStored(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  // Purge legacy demo withdrawals
  const storedWd = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
  if (storedWd) {
    try {
      const parsed = JSON.parse(storedWd) as Withdrawal[];
      const cleaned = parsed.filter(
        (w) => !w.user_id.startsWith('u-demo') && !w.user_id.startsWith('u-down') && !w.user_id.startsWith('u-upline')
      );
      if (cleaned.length !== parsed.length) {
        setStored(STORAGE_KEYS.WITHDRAWALS, cleaned);
      }
    } catch {
      setStored(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
    }
  } else {
    setStored(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
  }

  // Purge legacy demo transactions
  const storedTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (storedTx) {
    try {
      const parsed = JSON.parse(storedTx) as Transaction[];
      const cleaned = parsed.filter(
        (t) => !t.user_id.startsWith('u-demo') && !t.user_id.startsWith('u-down') && !t.user_id.startsWith('u-upline')
      );
      if (cleaned.length !== parsed.length) {
        setStored(STORAGE_KEYS.TRANSACTIONS, cleaned);
      }
    } catch {
      setStored(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    }
  } else {
    setStored(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  }

  // If active user session was a demo user, log them out
  const currentUid = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
  if (
    currentUid &&
    (currentUid.includes('u-demo') || currentUid.includes('u-down') || currentUid.includes('u-upline'))
  ) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  }

  if (!localStorage.getItem(STORAGE_KEYS.AD_SLOTS)) {
    setStored(STORAGE_KEYS.AD_SLOTS, INITIAL_AD_SLOTS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setStored(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.AD_VIEWS)) {
    setStored(STORAGE_KEYS.AD_VIEWS, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CHANNEL_URL)) {
    localStorage.setItem(STORAGE_KEYS.CHANNEL_URL, DEFAULT_CHANNEL_URL);
  }
  getDeviceId();
}

export function resetStorage(): void {
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.AD_SLOTS);
  localStorage.removeItem(STORAGE_KEYS.WITHDRAWALS);
  localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.AD_VIEWS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  initializeStorage();
}

// Settings
export function getSettings(): PlatformSettings {
  initializeStorage();
  return getStored<PlatformSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings: Partial<PlatformSettings>): PlatformSettings {
  const current = getSettings();
  const updated: PlatformSettings = { ...current, ...settings };
  setStored(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

export function toggleMaintenance(): boolean {
  const s = getSettings();
  const next = s.maintenance === 'on' ? 'off' : 'on';
  saveSettings({ maintenance: next });
  return next === 'on';
}

// WhatsApp channel link
export function getChannelUrl(): string {
  return localStorage.getItem(STORAGE_KEYS.CHANNEL_URL) || DEFAULT_CHANNEL_URL;
}

export function setChannelUrl(url: string): void {
  localStorage.setItem(STORAGE_KEYS.CHANNEL_URL, url.trim() || DEFAULT_CHANNEL_URL);
}

// Users
export function getAllUsers(): User[] {
  initializeStorage();
  return getStored<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
}

export function saveUsers(users: User[]): void {
  setStored(STORAGE_KEYS.USERS, users);
}

export function getUserById(id: string): User | null {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
}

export function getUserByCode(code: string): User | null {
  const users = getAllUsers();
  const clean = code.trim().toLowerCase();
  return users.find((u) => u.user_code.toLowerCase() === clean) || null;
}

export function getCurrentUser(): User | null {
  initializeStorage();
  const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
  if (!currentId) return null;
  const user = getUserById(currentId);
  if (!user) return null;

  const today = getTodayDateString();
  if (user.last_active_date !== today) {
    user.ads_today = 0;
    user.last_active_date = today;
    updateUser(user);
  }
  return user;
}

export function setCurrentUserId(userId: string | null): void {
  if (userId) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
  }
}

export function updateUser(updated: User): void {
  const users = getAllUsers();
  const idx = users.findIndex((u) => u.id === updated.id);
  if (idx !== -1) {
    users[idx] = updated;
    saveUsers(users);
  }
}

export function updateMyName(userId: string, newName: string): { success: boolean; error?: string } {
  if (!newName.trim() || newName.trim().length < 2) {
    return { success: false, error: 'Please enter a valid name (min 2 characters).' };
  }
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'User not found.' };
  user.name = newName.trim().slice(0, 40);
  updateUser(user);
  return { success: true };
}

export function updateMyPassword(userId: string, oldPass: string, newPass: string): { success: boolean; error?: string } {
  if (!newPass || newPass.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters.' };
  }
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'User not found.' };
  if (user.password && user.password !== oldPass) {
    return { success: false, error: 'Current password is incorrect.' };
  }
  user.password = newPass;
  updateUser(user);
  return { success: true };
}

// Auth operations
export function login(email: string, pass: string): { user?: User; error?: string } {
  initializeStorage();
  const settings = getSettings();
  const users = getAllUsers();
  const cleanEmail = email.trim().toLowerCase();
  const found = users.find(
    (u) => u.email.toLowerCase() === cleanEmail && (!u.password || u.password === pass)
  );
  if (!found) {
    return { error: 'Invalid email or password.' };
  }

  if (found.blocked && !found.is_admin) {
    return { error: 'Your account has been blocked. Contact support via WhatsApp.' };
  }

  // Daily reset check
  const today = getTodayDateString();
  if (found.last_active_date !== today) {
    found.ads_today = 0;
    found.last_active_date = today;
    updateUser(found);
  }

  setCurrentUserId(found.id);
  return { user: found };
}

export function register(
  name: string,
  email: string,
  pass: string,
  refCode?: string
): { user?: User; error?: string } {
  initializeStorage();
  const settings = getSettings();
  if (settings.maintenance === 'on') {
    return { error: 'Site is currently under maintenance. Please try again later.' };
  }

  const users = getAllUsers();
  const cleanEmail = email.trim().toLowerCase();

  if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { error: 'An account with this email already exists. Please log in.' };
  }

  const devId = getDeviceId();
  const existingDeviceUser = users.find((u) => u.device_id === devId && !u.is_admin);
  if (existingDeviceUser && !window.location.search.includes('allow_multi=true')) {
    return {
      error: 'An account has already been registered from this device. Only one account is allowed per device.',
    };
  }

  let referrerId: string | null = null;
  if (refCode && refCode.trim()) {
    const sponsor = getUserByCode(refCode.trim());
    if (sponsor) {
      referrerId = sponsor.id;
    }
  }

  const randomCode = 'PK-' + Math.floor(1000 + Math.random() * 9000);

  const newUser: User = {
    id: 'user_' + Date.now(),
    name: name.trim(),
    email: cleanEmail,
    password: pass,
    user_code: randomCode,
    balance: 0.0,
    ads_today: 0,
    ads_total: 0,
    last_active_date: getTodayDateString(),
    referrer_id: referrerId,
    is_admin: cleanEmail === 'islamicdn1234@gmail.com' || cleanEmail === 'admin@earn.com',
    blocked: false,
    bonus_claimed: false,
    created_at: new Date().toISOString(),
    device_id: devId,
  };

  users.push(newUser);
  saveUsers(users);
  setCurrentUserId(newUser.id);
  return { user: newUser };
}

export function logout(): void {
  setCurrentUserId(null);
}

// Device checks & testing helpers
export async function isDeviceTaken(deviceId: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (sb) {
    try {
      const { data, error } = await sb.rpc('device_taken', { p_device: deviceId });
      if (!error && typeof data === 'boolean') {
        return data;
      }
    } catch (e) {
      console.warn('Supabase device_taken RPC error:', e);
    }
  }
  const users = getAllUsers();
  return users.some((u) => u.device_id === deviceId && !u.is_admin);
}

export function clearAllDeviceLocks(): { count: number } {
  const users = getAllUsers();
  let count = 0;
  users.forEach((u) => {
    if (u.device_id) {
      u.device_id = '';
      count++;
    }
  });
  saveUsers(users);
  const newDev = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
  localStorage.setItem(STORAGE_KEYS.DEVICE_ID, newDev);
  return { count };
}

export function resetCurrentBrowserDevice(): string {
  const users = getAllUsers();
  const currentDev = getDeviceId();
  users.forEach((u) => {
    if (u.device_id === currentDev) {
      u.device_id = '';
    }
  });
  saveUsers(users);
  const newDev = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
  localStorage.setItem(STORAGE_KEYS.DEVICE_ID, newDev);
  return newDev;
}

// Admin user actions
export function adminSetBlocked(userId: string, blocked: boolean): { success: boolean; error?: string } {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'User not found.' };
  if (user.is_admin) return { success: false, error: 'Cannot block an administrator.' };
  user.blocked = blocked;
  updateUser(user);
  return { success: true };
}

export function adminDeleteUser(userId: string): { success: boolean; error?: string } {
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'User not found.' };
  if (user.is_admin) return { success: false, error: 'Cannot delete an administrator.' };

  // Remove user
  const users = getAllUsers().filter((u) => u.id !== userId);
  saveUsers(users);

  // Cascade delete transactions
  const txs = getAllTransactions().filter((t) => t.user_id !== userId);
  setStored(STORAGE_KEYS.TRANSACTIONS, txs);

  // Cascade delete withdrawals
  const wds = getAllWithdrawals().filter((w) => w.user_id !== userId);
  setStored(STORAGE_KEYS.WITHDRAWALS, wds);

  // Cascade delete ad views
  const views = getAllAdViews().filter((v) => v.user_id !== userId);
  setStored(STORAGE_KEYS.AD_VIEWS, views);

  return { success: true };
}

export function adminSetPassword(userId: string, newPass: string): { success: boolean; error?: string } {
  if (!newPass || newPass.length < 6) {
    return { success: false, error: 'Password must be 6+ characters.' };
  }
  const user = getUserById(userId);
  if (!user) return { success: false, error: 'User not found.' };
  user.password = newPass;
  updateUser(user);
  return { success: true };
}

// Ad views & 24h per-ad cooldown
export function getAllAdViews(): AdViewRecord[] {
  initializeStorage();
  return getStored<AdViewRecord[]>(STORAGE_KEYS.AD_VIEWS, []);
}

export function saveAdViews(views: AdViewRecord[]): void {
  setStored(STORAGE_KEYS.AD_VIEWS, views);
}

export function getAdCooldownMs(userId: string, slotId: string): number {
  const views = getAllAdViews();
  const lastView = views
    .filter((v) => v.user_id === userId && v.slot_id === slotId && v.claimed)
    .sort((a, b) => new Date(b.claimed_at).getTime() - new Date(a.claimed_at).getTime())[0];

  if (!lastView) return 0;
  const claimedTime = new Date(lastView.claimed_at).getTime();
  const elapsed = Date.now() - claimedTime;
  const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours
  if (elapsed >= cooldownPeriod) return 0;
  return cooldownPeriod - elapsed;
}

export function formatCooldown(ms: number): string {
  if (ms <= 0) return 'Available';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

// Transactions
export function getAllTransactions(): Transaction[] {
  initializeStorage();
  return getStored<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
}

export function getUserTransactions(userId: string): Transaction[] {
  const all = getAllTransactions();
  return all
    .filter((t) => t.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function addTransaction(
  userId: string,
  type: 'credit' | 'debit',
  amount: number,
  description: string,
  kind?: 'ad' | 'bonus' | 'commission' | 'withdraw' | 'refund'
): Transaction {
  const all = getAllTransactions();
  const tx: Transaction = {
    id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    user_id: userId,
    type,
    kind,
    amount: Math.round(amount * 100) / 100,
    description,
    created_at: new Date().toISOString(),
  };
  all.unshift(tx);
  setStored(STORAGE_KEYS.TRANSACTIONS, all);
  return tx;
}

// Ad Slots
export function getAllAdSlots(): AdSlot[] {
  initializeStorage();
  return getStored<AdSlot[]>(STORAGE_KEYS.AD_SLOTS, INITIAL_AD_SLOTS);
}

export function saveAdSlots(slots: AdSlot[]): void {
  setStored(STORAGE_KEYS.AD_SLOTS, slots);
}

export function addAdSlot(title: string, kind: 'html' | 'url', content: string): AdSlot {
  const slots = getAllAdSlots();
  const newSlot: AdSlot = {
    id: 'slot_' + Date.now(),
    title: title.trim(),
    kind,
    content: content.trim(),
    active: true,
    clicks: 0,
    created_at: new Date().toISOString(),
  };
  slots.unshift(newSlot);
  saveAdSlots(slots);
  return newSlot;
}

export function toggleAdSlot(id: string, active: boolean): void {
  const slots = getAllAdSlots();
  const slot = slots.find((s) => s.id === id);
  if (slot) {
    slot.active = active;
    saveAdSlots(slots);
  }
}

export function deleteAdSlot(id: string): void {
  const slots = getAllAdSlots().filter((s) => s.id !== id);
  saveAdSlots(slots);
}

// Claim Welcome Bonus
export function claimWelcomeBonus(userId: string): { success: boolean; error?: string } {
  const settings = getSettings();
  if (settings.maintenance === 'on') {
    return { success: false, error: 'Site is under maintenance.' };
  }

  const user = getUserById(userId);
  if (!user) return { success: false, error: 'User not found.' };
  if (user.blocked) return { success: false, error: 'Account is blocked.' };
  if (user.bonus_claimed) {
    return { success: false, error: 'Welcome bonus has already been claimed.' };
  }

  const bonusAmount = settings.welcome_bonus;
  user.balance = Math.round((user.balance + bonusAmount) * 100) / 100;
  user.bonus_claimed = true;
  updateUser(user);

  addTransaction(user.id, 'credit', bonusAmount, 'Welcome bonus', 'bonus');
  return { success: true };
}

// Watching Ads with 24h per-ad cooldown
export function claimAdReward(userId: string, slotId: string): { success: boolean; error?: string; reward?: number } {
  const settings = getSettings();
  if (settings.maintenance === 'on') {
    return { success: false, error: 'Site is under maintenance. Please try again later.' };
  }

  const user = getUserById(userId);
  if (!user) return { success: false, error: 'User not found.' };
  if (user.blocked) return { success: false, error: 'Your account has been blocked.' };

  // Check 24-hour cooldown
  const cooldownLeft = getAdCooldownMs(userId, slotId);
  if (cooldownLeft > 0) {
    return { success: false, error: `This ad is available again in ${formatCooldown(cooldownLeft)}.` };
  }

  const today = getTodayDateString();
  if (user.last_active_date !== today) {
    user.ads_today = 0;
    user.last_active_date = today;
  }

  if (user.ads_today >= settings.daily_limit) {
    return { success: false, error: `You have reached your daily limit of ${settings.daily_limit} ads for today.` };
  }

  const slots = getAllAdSlots();
  const slot = slots.find((s) => s.id === slotId);
  const reward = settings.reward;

  user.balance = Math.round((user.balance + reward) * 100) / 100;
  user.ads_today += 1;
  user.ads_total += 1;
  user.last_active_date = today;
  updateUser(user);

  if (slot) {
    slot.clicks = (slot.clicks || 0) + 1;
    saveAdSlots(slots);
  }

  // Record ad view session with timestamp for 24h cooldown
  const allViews = getAllAdViews();
  allViews.unshift({
    id: 'view_' + Date.now(),
    user_id: user.id,
    slot_id: slotId,
    claimed: true,
    claimed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });
  saveAdViews(allViews);

  addTransaction(user.id, 'credit', reward, 'Ad view reward', 'ad');

  // Distribute commissions once referral hits threshold (default 20 ads)
  if (user.ads_total >= settings.ref_threshold && user.referrer_id) {
    distributeCommission(user.referrer_id, user.user_code, reward, settings);
  }

  return { success: true, reward };
}

function distributeCommission(level1Id: string, fromUserCode: string, baseReward: number, settings: PlatformSettings): void {
  const users = getAllUsers();
  
  // Level 1
  const l1 = users.find((u) => u.id === level1Id);
  if (l1 && !l1.blocked) {
    const comm1 = Math.round(baseReward * (settings.c1 / 100) * 1000) / 1000;
    l1.balance = Math.round((l1.balance + comm1) * 100) / 100;
    updateUser(l1);
    addTransaction(l1.id, 'credit', comm1, `Level 1 team commission (${fromUserCode})`, 'commission');

    // Level 2
    if (l1.referrer_id) {
      const l2 = users.find((u) => u.id === l1.referrer_id);
      if (l2 && !l2.blocked) {
        const comm2 = Math.round(baseReward * (settings.c2 / 100) * 1000) / 1000;
        l2.balance = Math.round((l2.balance + comm2) * 100) / 100;
        updateUser(l2);
        addTransaction(l2.id, 'credit', comm2, `Level 2 team commission (${fromUserCode})`, 'commission');

        // Level 3
        if (l2.referrer_id) {
          const l3 = users.find((u) => u.id === l2.referrer_id);
          if (l3 && !l3.blocked) {
            const comm3 = Math.round(baseReward * (settings.c3 / 100) * 1000) / 1000;
            l3.balance = Math.round((l3.balance + comm3) * 100) / 100;
            updateUser(l3);
            addTransaction(l3.id, 'credit', comm3, `Level 3 team commission (${fromUserCode})`, 'commission');
          }
        }
      }
    }
  }
}

// Team tree
export function getTeamTree(userId: string): {
  upline: TeamMember | null;
  level1: TeamMember[];
  level2: TeamMember[];
  level3: TeamMember[];
} {
  const users = getAllUsers();
  const current = users.find((u) => u.id === userId);
  if (!current) {
    return { upline: null, level1: [], level2: [], level3: [] };
  }

  let upline: TeamMember | null = null;
  if (current.referrer_id) {
    const upUser = users.find((u) => u.id === current.referrer_id);
    if (upUser) {
      upline = {
        id: upUser.id,
        name: upUser.name,
        user_code: upUser.user_code,
        ads_total: upUser.ads_total,
        balance: upUser.balance,
        lvl: 0,
        created_at: upUser.created_at,
      };
    }
  }

  const level1Users = users.filter((u) => u.referrer_id === current.id);
  const level1: TeamMember[] = level1Users.map((u) => ({
    id: u.id,
    name: u.name,
    user_code: u.user_code,
    ads_total: u.ads_total,
    balance: u.balance,
    lvl: 1,
    created_at: u.created_at,
  }));

  const l1Ids = new Set(level1Users.map((u) => u.id));
  const level2Users = users.filter((u) => u.referrer_id && l1Ids.has(u.referrer_id));
  const level2: TeamMember[] = level2Users.map((u) => ({
    id: u.id,
    name: u.name,
    user_code: u.user_code,
    ads_total: u.ads_total,
    balance: u.balance,
    lvl: 2,
    created_at: u.created_at,
  }));

  const l2Ids = new Set(level2Users.map((u) => u.id));
  const level3Users = users.filter((u) => u.referrer_id && l2Ids.has(u.referrer_id));
  const level3: TeamMember[] = level3Users.map((u) => ({
    id: u.id,
    name: u.name,
    user_code: u.user_code,
    ads_total: u.ads_total,
    balance: u.balance,
    lvl: 3,
    created_at: u.created_at,
  }));

  return { upline, level1, level2, level3 };
}

// Withdrawals
export function getAllWithdrawals(): Withdrawal[] {
  initializeStorage();
  const all = getStored<Withdrawal[]>(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
  const users = getAllUsers();
  return all.map((w) => {
    const u = users.find((usr) => usr.id === w.user_id);
    return {
      ...w,
      user_name: u?.name || w.user_name || 'User',
      user_code: u?.user_code || w.user_code || 'PK-0000',
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getUserWithdrawals(userId: string): Withdrawal[] {
  return getAllWithdrawals().filter((w) => w.user_id === userId);
}

export function requestWithdrawal(
  userId: string,
  method: 'JazzCash' | 'Easypaisa',
  accountTitle: string,
  accountNumber: string,
  amount: number
): { success: boolean; error?: string } {
  const settings = getSettings();
  if (settings.maintenance === 'on') {
    return { success: false, error: 'Site is currently under maintenance. Please try again later.' };
  }

  const user = getUserById(userId);
  if (!user) return { success: false, error: 'User not found.' };
  if (user.blocked) return { success: false, error: 'Account is blocked.' };

  const parsedAmount = Math.round(Number(amount) * 100) / 100;
  if (!parsedAmount || parsedAmount <= 0) {
    return { success: false, error: 'Please enter a valid withdrawal amount.' };
  }

  if (!accountTitle.trim() || accountTitle.trim().length < 3) {
    return { success: false, error: 'Please enter a valid account title (3+ characters).' };
  }

  if (!accountNumber.trim() || accountNumber.trim().length < 10) {
    return { success: false, error: 'Please enter a valid 11-digit mobile account number.' };
  }

  const pastWd = getUserWithdrawals(userId);
  // Check if pending request exists
  if (pastWd.some((w) => w.status === 'pending')) {
    return { success: false, error: 'You already have a pending withdrawal request. Please wait for it to be processed.' };
  }

  const hasPrior = pastWd.some((w) => w.status !== 'rejected');
  const minRequired = hasPrior ? settings.min_next : settings.min_first;

  if (parsedAmount < minRequired) {
    return {
      success: false,
      error: `Minimum withdrawal is Rs. ${minRequired}.00 (${hasPrior ? 'subsequent' : 'first-time'} limit).`,
    };
  }

  if (user.balance < parsedAmount) {
    return {
      success: false,
      error: `Insufficient balance. Available: ${formatPKR(user.balance)}, Requested: ${formatPKR(parsedAmount)}`,
    };
  }

  user.balance = Math.round((user.balance - parsedAmount) * 100) / 100;
  updateUser(user);

  const allWd = getStored<Withdrawal[]>(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
  const newWd: Withdrawal = {
    id: 'wd_' + Date.now(),
    user_id: user.id,
    user_name: user.name,
    user_code: user.user_code,
    method,
    account_title: accountTitle.trim(),
    account_number: accountNumber.trim(),
    amount: parsedAmount,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  allWd.unshift(newWd);
  setStored(STORAGE_KEYS.WITHDRAWALS, allWd);

  addTransaction(
    user.id,
    'debit',
    parsedAmount,
    `Withdrawal request (${method})`,
    'withdraw'
  );

  return { success: true };
}

// Admin withdrawal management
export function reviewWithdrawal(
  withdrawalId: string,
  approve: boolean
): { success: boolean; error?: string } {
  const allWd = getStored<Withdrawal[]>(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
  const wd = allWd.find((w) => w.id === withdrawalId);
  if (!wd) return { success: false, error: 'Withdrawal not found.' };

  if (wd.status !== 'pending') {
    return { success: false, error: `This withdrawal has already been ${wd.status}.` };
  }

  if (approve) {
    wd.status = 'approved';
    wd.reviewed_at = new Date().toISOString();
    setStored(STORAGE_KEYS.WITHDRAWALS, allWd);
    return { success: true };
  } else {
    wd.status = 'rejected';
    wd.reviewed_at = new Date().toISOString();
    setStored(STORAGE_KEYS.WITHDRAWALS, allWd);

    const user = getUserById(wd.user_id);
    if (user) {
      user.balance = Math.round((user.balance + wd.amount) * 100) / 100;
      updateUser(user);
      addTransaction(
        user.id,
        'credit',
        wd.amount,
        'Withdrawal refunded',
        'refund'
      );
    }
    return { success: true };
  }
}

export function adminEditWithdrawal(
  id: string,
  method: 'JazzCash' | 'Easypaisa',
  accountTitle: string,
  accountNumber: string
): { success: boolean; error?: string } {
  const allWd = getStored<Withdrawal[]>(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
  const wd = allWd.find((w) => w.id === id);
  if (!wd) return { success: false, error: 'Withdrawal not found.' };

  wd.method = method;
  wd.account_title = accountTitle.trim();
  wd.account_number = accountNumber.trim();
  setStored(STORAGE_KEYS.WITHDRAWALS, allWd);
  return { success: true };
}

export function adminDeleteWithdrawal(id: string): { success: boolean; error?: string } {
  const allWd = getStored<Withdrawal[]>(STORAGE_KEYS.WITHDRAWALS, INITIAL_WITHDRAWALS);
  const idx = allWd.findIndex((w) => w.id === id);
  if (idx === -1) return { success: false, error: 'Withdrawal not found.' };

  const wd = allWd[idx];
  // If pending, refund amount to user
  if (wd.status === 'pending') {
    const user = getUserById(wd.user_id);
    if (user) {
      user.balance = Math.round((user.balance + wd.amount) * 100) / 100;
      updateUser(user);
      addTransaction(user.id, 'credit', wd.amount, 'Withdrawal refunded', 'refund');
    }
  }

  allWd.splice(idx, 1);
  setStored(STORAGE_KEYS.WITHDRAWALS, allWd);
  return { success: true };
}

// Reset functions
export function adminResetAds(): void {
  setStored(STORAGE_KEYS.AD_VIEWS, []);
  const users = getAllUsers();
  users.forEach((u) => {
    u.ads_today = 0;
  });
  saveUsers(users);
}

export function adminResetAll(confirmText: string): { success: boolean; error?: string } {
  if (confirmText.trim() !== 'RESET') {
    return { success: false, error: 'Type RESET to confirm deletion.' };
  }
  const users = getAllUsers();
  const admins = users.filter((u) => u.is_admin);
  admins.forEach((a) => {
    a.balance = 0;
    a.ads_total = 0;
    a.ads_today = 0;
  });
  saveUsers(admins);
  setStored(STORAGE_KEYS.WITHDRAWALS, []);
  setStored(STORAGE_KEYS.TRANSACTIONS, []);
  setStored(STORAGE_KEYS.AD_VIEWS, []);
  clearAllDeviceLocks();
  return { success: true };
}

// Detailed Admin Stats
export function getAdminDetailedStats(): AdminDetailedStats {
  const users = getAllUsers();
  const nonAdmins = users.filter((u) => !u.is_admin);
  const withdrawals = getAllWithdrawals();
  const transactions = getAllTransactions();
  const views = getAllAdViews();

  const todayStr = getTodayDateString();

  const activeTodayIds = new Set(
    views
      .filter((v) => v.claimed && v.claimed_at.startsWith(todayStr))
      .map((v) => v.user_id)
  );

  const joinedToday = nonAdmins.filter((u) => u.created_at.startsWith(todayStr)).length;

  const earnToday = transactions
    .filter((t) => t.type === 'credit' && t.created_at.startsWith(todayStr) && t.kind !== 'refund')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const earnTotal = transactions
    .filter((t) => t.type === 'credit' && t.kind !== 'refund')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalBalances = nonAdmins.reduce((sum, u) => sum + (u.balance || 0), 0);

  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending');
  const pendingCount = pendingWithdrawals.length;
  const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);

  const paidTotal = withdrawals
    .filter((w) => w.status === 'approved')
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  return {
    users: nonAdmins.length,
    active_today: activeTodayIds.size,
    joined_today: joinedToday,
    earn_today: Math.round(earnToday * 100) / 100,
    earn_total: Math.round(earnTotal * 100) / 100,
    balances: Math.round(totalBalances * 100) / 100,
    pending_count: pendingCount,
    pending_amount: Math.round(pendingAmount * 100) / 100,
    paid_total: Math.round(paidTotal * 100) / 100,
  };
}

export function getAdminStats() {
  const detailed = getAdminDetailedStats();
  return {
    totalUsers: detailed.users,
    totalBalance: detailed.balances,
    pendingCount: detailed.pending_count,
    pendingAmount: detailed.pending_amount,
  };
}
