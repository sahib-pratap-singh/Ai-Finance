
import React from 'react';
import { Account, Transaction, AccountType, TransactionType } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';
import { TrendingUp, Activity, AlertTriangle, CheckCircle } from 'lucide-react';

interface CashFlowProps {
  accounts: Account[];
  transactions: Transaction[];
  isDarkMode?: boolean;
}

export const CashFlow: React.FC<CashFlowProps> = ({ accounts, transactions, isDarkMode }) => {
  // --- Metric 1: Runway ---
  const liquidCash = accounts
    .filter(a => [AccountType.CHECKING, AccountType.SAVINGS, AccountType.CASH].includes(a.type))
    .reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  // Calculate Avg Monthly Expense (last 3 months)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const recentExpenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date) > threeMonthsAgo)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const avgMonthlyExpense = recentExpenses / 3 || 1; // Prevent div by 0
  const runwayMonths = liquidCash / avgMonthlyExpense;
  const runwayColor = runwayMonths < 1 ? 'text-red-500' : (runwayMonths < 3 ? 'text-amber-500' : 'text-emerald-500');

  // --- Metric 2: Waterfall Data (Yearly) ---
  const currentYear = new Date().getFullYear();
  const startOfYearBalance = 0; // In a real app, compute snapshot. Assuming 0 baseline for flow visualization.
  
  const incomeYTD = transactions
    .filter(t => t.type === TransactionType.INCOME && new Date(t.date).getFullYear() === currentYear)
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseYTD = transactions
    .filter(t => t.type === TransactionType.EXPENSE && new Date(t.date).getFullYear() === currentYear)
    .reduce((sum, t) => sum + t.amount, 0);

  const waterfallData = [
    { name: 'Start', value: startOfYearBalance, fill: '#94a3b8' },
    { name: 'Income', value: incomeYTD, fill: '#10b981' },
    { name: 'Expense', value: -expenseYTD, fill: '#ef4444' },
    { name: 'End', value: startOfYearBalance + incomeYTD - expenseYTD, fill: '#3b82f6' },
  ];

  // Helper for Waterfall Bar positioning
  // We need to stack them. This is a simplified "Net Change" view for robustness.
  
  // --- Metric 3: Sankey Flow (Custom SVG Implementation) ---
  // Nodes: Income -> [Needs, Wants, Savings/Debt]
  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Group Expenses
  const expenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => {
       acc[t.category] = (acc[t.category] || 0) + t.amount;
       return acc;
    }, {} as Record<string, number>);

  const sortedExpenses = Object.entries(expenses)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5 categories
  
  const otherExpenses = Object.entries(expenses)
    .sort(([, a], [, b]) => b - a)
    .slice(5)
    .reduce((sum, [, val]) => sum + val, 0);
  
  if (otherExpenses > 0) sortedExpenses.push(['Other', otherExpenses]);

  // SVG Config
  const svgHeight = 400;
  const svgWidth = 800;
  const nodeWidth = 20;
  const startX = 50;
  const midX = 400;
  const endX = 750;

  // Render
  return (
    <div className="p-4 md:p-6 space-y-8 animate-fade-in pb-10">
      
      {/* 1. Runway Metric */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
         <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
           <Activity className="w-5 h-5 mr-2 text-blue-500" /> Financial Runway
         </h3>
         <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-48 h-24 overflow-hidden">
               {/* Gauge Arc */}
               <div className="absolute w-full h-full bg-gray-200 dark:bg-gray-700 rounded-t-full"></div>
               <div 
                  className={`absolute w-full h-full rounded-t-full origin-bottom transition-transform duration-1000 ${runwayMonths < 3 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                  style={{ transform: `rotate(${(Math.min(runwayMonths / 12, 1) * 180) - 180}deg)` }}
               ></div>
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 bg-white dark:bg-gray-900 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="text-center md:text-left">
               <div className={`text-4xl font-extrabold ${runwayColor}`}>
                 {runwayMonths.toFixed(1)} Months
               </div>
               <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                 You can survive for {runwayMonths.toFixed(1)} months on your current liquid cash (${liquidCash.toLocaleString()}) without any income.
               </p>
            </div>
         </div>
      </div>

      {/* 2. Simplified Sankey (Flow Chart) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors overflow-hidden">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-6">
           <TrendingUp className="w-5 h-5 mr-2 text-purple-500" /> Cash Flow Visualization
        </h3>
        {totalIncome > 0 ? (
          <div className="w-full overflow-x-auto">
            <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="min-w-[600px]">
              <defs>
                <linearGradient id="flowGradient" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              
              {/* Income Node (Left) */}
              <rect x={startX} y={svgHeight/2 - 50} width={nodeWidth} height={100} fill="#10b981" rx={4} />
              <text x={startX} y={svgHeight/2 - 60} className="fill-gray-600 dark:fill-gray-300 text-sm font-bold">Income</text>
              <text x={startX} y={svgHeight/2 + 120} className="fill-gray-500 dark:fill-gray-400 text-xs">${totalIncome.toLocaleString()}</text>

              {/* Expense Nodes (Right) - Distributed */}
              {sortedExpenses.map((entry, index) => {
                 const totalExp = sortedExpenses.reduce((sum, e) => sum + e[1], 0);
                 const count = sortedExpenses.length;
                 const spacing = svgHeight / count;
                 const barHeight = Math.max((entry[1] / totalExp) * (svgHeight * 0.8), 20); // Scale height by amount
                 const yPos = (index * spacing) + (spacing/2) - (barHeight/2);
                 
                 // Draw Path
                 const pathD = `
                    M ${startX + nodeWidth} ${svgHeight/2} 
                    C ${midX} ${svgHeight/2}, ${midX} ${yPos + barHeight/2}, ${endX} ${yPos + barHeight/2}
                 `;

                 return (
                   <g key={entry[0]}>
                     <path d={pathD} fill="none" stroke="url(#flowGradient)" strokeWidth={Math.max(entry[1] / totalIncome * 50, 2)} className="hover:opacity-80 transition-opacity" />
                     <rect x={endX} y={yPos} width={nodeWidth} height={barHeight} fill="#3b82f6" rx={4} />
                     <text x={endX - 10} y={yPos + barHeight/2} textAnchor="end" className="fill-gray-600 dark:fill-gray-300 text-xs font-medium mr-2">{entry[0]}</text>
                     <text x={endX + nodeWidth + 5} y={yPos + barHeight/2} className="fill-gray-500 dark:fill-gray-400 text-xs">${entry[1].toLocaleString()}</text>
                   </g>
                 );
              })}
            </svg>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">Not enough data to generate flow.</div>
        )}
      </div>

      {/* 3. Waterfall (Net Worth Change) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
         <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-6">
           <Activity className="w-5 h-5 mr-2 text-emerald-500" /> Year-to-Date Net Change
         </h3>
         <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={waterfallData}>
                  <XAxis dataKey="name" stroke={isDarkMode ? '#9ca3af' : '#4b5563'} />
                  <YAxis stroke={isDarkMode ? '#9ca3af' : '#4b5563'} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#1f2937' : '#fff',
                      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                      color: isDarkMode ? '#fff' : '#000'
                    }}
                  />
                  <ReferenceLine y={0} stroke="#666" />
                  <Bar dataKey="value" barSize={60}>
                    {waterfallData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>
      </div>

    </div>
  );
};
