import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Account, Transaction, AccountType, TransactionType } from '../types';
import { DollarSign, Wallet, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface DashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  isDarkMode?: boolean;
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const Dashboard: React.FC<DashboardProps> = ({ accounts, transactions, isDarkMode = false }) => {
  // 1. Calculate Aggregates
  const totalAssets = accounts
    .filter(a => [AccountType.CHECKING, AccountType.SAVINGS, AccountType.INVESTMENT, AccountType.CASH].includes(a.type))
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const totalDebt = accounts
    .filter(a => [AccountType.CREDIT_CARD, AccountType.LOAN].includes(a.type))
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const netWorth = totalAssets - totalDebt;

  // 2. Spending by Category (Expenses only)
  const spendingByCategory = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => {
      const existing = acc.find(i => i.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, [] as { name: string; value: number }[])
    .sort((a, b) => b.value - a.value);

  // 3. Recent Activity
  const recentTransactions = transactions.slice(0, 5);

  const chartTooltipStyle = {
    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
    borderColor: isDarkMode ? '#374151' : '#E5E7EB',
    color: isDarkMode ? '#FFFFFF' : '#000000',
    borderRadius: '8px',
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Net Worth</p>
              <h3 className={`text-3xl font-bold mt-2 ${netWorth >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Assets - Liabilities</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Assets</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Debt</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                ${totalDebt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <CreditCard className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Top Spending Categories</h4>
          {spendingByCategory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingByCategory.slice(0, 6)} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: isDarkMode ? '#9CA3AF' : '#4B5563'}} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={chartTooltipStyle} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
               No expense data available yet.
             </div>
          )}
        </div>

        {/* Pie Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Distribution</h4>
          {spendingByCategory.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke={isDarkMode ? '#1F2937' : '#fff'}
                  >
                    {spendingByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
               No data
             </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Transactions</h4>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === 'income' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 
                  tx.type === 'expense' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                }`}>
                  {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{tx.description}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{tx.category} • {tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold ${
                  tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {tx.type === 'income' ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 uppercase">{tx.type}</p>
              </div>
            </div>
          ))}
          {recentTransactions.length === 0 && (
             <div className="p-6 text-center text-gray-500 dark:text-gray-400">No transactions recorded.</div>
          )}
        </div>
      </div>
    </div>
  );
};