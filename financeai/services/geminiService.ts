import { Transaction } from "../types";

// AI features are disabled for the simplified version to ensure stability.
export const enrichTransactionWithAI = async (transaction: Transaction): Promise<Partial<Transaction>> => {
  return {};
};

export const detectRecurringBills = async (transactions: Transaction[]) => {
   return [];
}