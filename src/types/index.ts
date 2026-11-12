export type AdKind = 'html' | 'url';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  user_code: string;
  balance: number;
  ads_today: number;
  ads_total: number;
  last_active_date: string; // YYYY-MM-DD
  referrer_id: string | null;
  is_admin: boolean;
  blocked?: boolean;
  bonus_claimed: boolean;
  created_at: string;
  device_id: string;
}

export interface AdSlot {
  id: string;
  title: string;
  kind: AdKind;
  content: string;
  active: boolean;
  reward?: number;
  clicks: number;
  created_at: string;
}

export interface AdViewRecord {
  id: string;
  user_id: string;
  slot_id: string;
  claimed: boolean;
  claimed_at: string;
  created_at: string;
}

export interface PlatformSettings {
  reward: number; // default 2.50
  timer_seconds: number; // default 20
  daily_limit: number; // default 10
  min_first: number; // default 200
  min_next: number; // default 800
  welcome_bonus: number; // default 50
  c1: number; // default 8%
  c2: number; // default 5%
  c3: number; // default 2%
  ref_threshold: number; // default 20 ads
  maintenance: 'on' | 'off'; // default 'off'
}

export type WithdrawalMethod = 'JazzCash' | 'Easypaisa';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected';

export interface Withdrawal {
  id: string;
  user_id: string;
  user_name?: string;
  user_code?: string;
  method: WithdrawalMethod;
  account_title: string;
  account_number: string;
  amount: number;
  status: WithdrawalStatus;
  created_at: string;
  reviewed_at?: string;
}

export type TransactionType = 'credit' | 'debit';
export type TransactionKind = 'ad' | 'bonus' | 'commission' | 'withdraw' | 'refund';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  kind?: TransactionKind;
  amount: number;
  description: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  user_code: string;
  ads_total: number;
  balance: number;
  lvl: number; // 0 = upline, 1 = direct, 2 = 2nd level, 3 = 3rd level
  created_at: string;
}

export interface AdminDetailedStats {
  users: number;
  active_today: number;
  joined_today: number;
  earn_today: number;
  earn_total: number;
  balances: number;
  pending_count: number;
  pending_amount: number;
  paid_total: number;
}
