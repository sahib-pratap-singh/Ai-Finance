
import { Account, Transaction, Goal, Budget } from '../types';

const STORAGE_KEYS = {
  USER: 'finance_user',
  ACCOUNTS: 'finance_accounts',
  TRANSACTIONS: 'finance_transactions',
  GOALS: 'finance_goals',
  BUDGETS: 'finance_budgets'
};

// Safe ID generator
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Helper to trigger UI updates
const notifyUpdate = () => {
  window.dispatchEvent(new Event('storage-update'));
};

// --- Auth Mock ---
export const loginUser = (email: string) => {
  const user = { uid: 'local-user', email, createdAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  notifyUpdate();
  return user;
};

export const logoutUser = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
  notifyUpdate();
};

export const getCurrentUser = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.USER);
  return stored ? JSON.parse(stored) : null;
};

// --- Accounts ---
export const addAccount = async (userId: string, data: Omit<Account, 'id' | 'userId'>) => {
  const accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
  const newAccount = {
    ...data,
    id: generateId(),
    userId,
    currentBalance: data.initialBalance // init
  };
  accounts.push(newAccount);
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  notifyUpdate();
  return newAccount;
};

export const deleteAccount = async (accountId: string) => {
  let accounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
  accounts = accounts.filter((a: Account) => a.id !== accountId);
  localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  notifyUpdate();
};

export const subscribeToAccounts = (userId: string, callback: (accounts: Account[]) => void) => {
  const load = () => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
    callback(all);
  };

  load(); // Initial load
  
  const handler = () => load();
  window.addEventListener('storage-update', handler);
  return () => window.removeEventListener('storage-update', handler);
};

// --- Transactions ---
export const addTransaction = async (userId: string, data: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
  const txs = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
  const newTx = {
    ...data,
    id: generateId(),
    userId,
    createdAt: new Date().toISOString()
  };
  txs.push(newTx);
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  notifyUpdate();
  return newTx;
};

export const deleteTransaction = async (txId: string) => {
  let txs = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
  txs = txs.filter((t: Transaction) => t.id !== txId);
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  notifyUpdate();
};

export const subscribeToTransactions = (userId: string, callback: (txs: Transaction[]) => void) => {
  const load = () => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
    // Sort descending by date
    all.sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(all);
  };

  load();
  const handler = () => load();
  window.addEventListener('storage-update', handler);
  return () => window.removeEventListener('storage-update', handler);
};

// --- Budgets ---
export const setBudget = async (userId: string, category: string, amount: number, month: string) => {
  const budgets = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS) || '[]');
  // Remove existing for this category/month
  const filtered = budgets.filter((b: Budget) => !(b.category === category && b.month === month));
  
  const newBudget = {
    id: generateId(),
    userId,
    category,
    amount,
    month
  };
  
  filtered.push(newBudget);
  localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(filtered));
  notifyUpdate();
};

export const subscribeToBudgets = (userId: string, callback: (budgets: Budget[]) => void) => {
  const load = () => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS) || '[]');
    callback(all);
  };
  load();
  const handler = () => load();
  window.addEventListener('storage-update', handler);
  return () => window.removeEventListener('storage-update', handler);
};
