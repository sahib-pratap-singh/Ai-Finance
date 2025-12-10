
export enum AccountType {
  CHECKING = 'Checking',
  SAVINGS = 'Savings',
  CREDIT_CARD = 'Credit Card',
  INVESTMENT = 'Investment',
  LOAN = 'Loan',
  CASH = 'Cash'
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export interface UserProfile {
  uid: string;
  email: string | null;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  // Computed on client
  currentBalance?: number; 
}

export interface Transaction {
  id: string;
  userId: string;
  accountId: string; // Source account
  toAccountId?: string; // For transfers
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // ISO String
  description: string;
  merchantName?: string; // Optional for AI enrichment
  isRecurring?: boolean; // Added for AI enrichment
  createdAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  amount: number;
  month: string; // Format: "YYYY-MM"
}

export const CATEGORIES = [
  'Housing', 'Food', 'Transportation', 'Utilities', 
  'Entertainment', 'Shopping', 'Health', 'Income', 
  'Debt Payment', 'Transfer', 'Other'
];

export const ACCOUNT_TYPES = [
  AccountType.CHECKING,
  AccountType.SAVINGS,
  AccountType.INVESTMENT,
  AccountType.CASH,
  AccountType.CREDIT_CARD,
  AccountType.LOAN
];
