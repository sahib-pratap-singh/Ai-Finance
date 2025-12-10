
import React, { useState, useMemo } from 'react';
import { Transaction, Budget, CATEGORIES, TransactionType } from '../types';
import { setBudget } from '../services/storage';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface BudgetProps {
  transactions: Transaction[];
  budgets: Budget[];
}

export const BudgetPlanner: React.FC<BudgetProps> = ({ transactions, budgets }) => {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const currentMonthStr = selectedDate.toISOString().slice(0, 7); // YYYY-MM
  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const isCurrentMonth = new Date().getMonth() === selectedDate.getMonth() && new Date().getFullYear() === selectedDate.getFullYear();
  
  // Calculate pacing percentage (Today Marker)
  const pacingPercentage = isCurrentMonth ? (currentDay / daysInMonth) * 100 : 100;

  // 1. Calculate Income for "To Be Budgeted"
  const incomeForMonth = useMemo(() => {
    return transactions
      .filter(t => t.type === TransactionType.INCOME && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, currentMonthStr]);

  // 2. Prepare Category Data
  const categoryRows = useMemo(() => {
    return CATEGORIES.filter(c => c !== 'Income' && c !== 'Transfer').map(cat => {
      // Get assigned budget for this month
      const budgetEntry = budgets.find(b => b.category === cat && b.month === currentMonthStr);
      const budgetedAmount = budgetEntry ? budgetEntry.amount : 0;

      // Calculate actual spending
      const spent = transactions
        .filter(t => t.type === TransactionType.EXPENSE && t.category === cat && t.date.startsWith(currentMonthStr))
        .reduce((sum, t) => sum + t.amount, 0);

      // Simulate Rollover (Simplified: In a real app, this would recursively check previous months)
      // For this MVP, we'll randomize a small "leftover" or 0 if it's the first usage to demonstrate UI
      const rollover = 0; // Keeping it safe for MVP. 

      const available = rollover + budgetedAmount - spent;
      const spentPercentage = budgetedAmount > 0 ? (spent / budgetedAmount) * 100 : (spent > 0 ? 100 : 0);

      return {
        category: cat,
        rollover,
        budgeted: budgetedAmount,
        spent,
        available,
        spentPercentage
      };
    });
  }, [budgets, transactions, currentMonthStr]);

  const totalBudgeted = categoryRows.reduce((sum, row) => sum + row.budgeted, 0);
  const totalSpent = categoryRows.reduce((sum, row) => sum + row.spent, 0);
  const toBeBudgeted = incomeForMonth - totalBudgeted;

  const handleBudgetChange = async (category: string, amount: string) => {
    if (!currentUser) return;
    const val = parseFloat(amount) || 0;
    await setBudget(currentUser.uid, category, val, currentMonthStr);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setSelectedDate(newDate);
  };

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 animate-fade-in pb-10">
      
      {/* Top Navigation / Month Selector */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-colors">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Sticky Header: To Be Budgeted */}
      <div className={`p-6 transition-colors ${toBeBudgeted < 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">To Be Budgeted</p>
          <div className={`text-4xl font-extrabold mt-1 ${toBeBudgeted < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            ${toBeBudgeted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
             <span>Income: <strong>${incomeForMonth.toLocaleString()}</strong></span>
             <span>Budgeted: <strong>${totalBudgeted.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        {/* Aggregates */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
           <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Budget</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">${totalBudgeted.toLocaleString()}</p>
           </div>
           <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">${totalSpent.toLocaleString()}</p>
           </div>
           <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Remaining</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">${(totalBudgeted - totalSpent).toLocaleString()}</p>
           </div>
        </div>

        {/* Categories List */}
        <div className="space-y-4">
          {categoryRows.map((row) => {
             // Pacing Logic: 
             // If today is 50% through month, marker is at 50%.
             // If spent % is > pacing %, color yellow (warning). Else green.
             const isOverPacing = row.spentPercentage > pacingPercentage;
             const barColor = row.spent > row.budgeted ? 'bg-red-500' : (isOverPacing && isCurrentMonth ? 'bg-amber-400' : 'bg-emerald-500');

             return (
               <div key={row.category} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                 <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   
                   {/* Left: Icon & Name & Rollover */}
                   <div className="flex-1">
                      <div className="flex items-center space-x-3">
                         <div className="font-bold text-gray-800 dark:text-white text-lg">{row.category}</div>
                         {/* Rollover Pill */}
                         <div className={`text-xs px-2 py-0.5 rounded-full ${row.rollover >= 0 ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'}`}>
                            {row.rollover >= 0 ? '+' : ''}${Math.abs(row.rollover)} Roll
                         </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 flex items-center">
                         <TrendingUp className="w-3 h-3 mr-1" /> Spent: ${row.spent.toLocaleString()}
                      </div>
                   </div>

                   {/* Middle: Budget Input */}
                   <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Budgeted:</span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">$</span>
                        <input 
                           type="number"
                           className="w-24 pl-6 pr-2 py-1.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-right"
                           value={row.budgeted || ''}
                           placeholder="0"
                           onChange={(e) => handleBudgetChange(row.category, e.target.value)}
                        />
                      </div>
                   </div>

                   {/* Right: Available */}
                   <div className="text-right min-w-[100px]">
                      <div className="text-xs text-gray-400 dark:text-gray-500 uppercase font-medium">Available</div>
                      <div className={`text-xl font-bold ${row.available < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                         ${row.available.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </div>
                   </div>
                 </div>

                 {/* Progress Bar with Pacing */}
                 <div className="relative h-2 bg-gray-100 dark:bg-gray-700 w-full">
                    <div 
                      className={`h-full transition-all duration-500 ${barColor}`} 
                      style={{ width: `${Math.min(row.spentPercentage, 100)}%` }}
                    />
                    {/* Today Marker */}
                    {isCurrentMonth && (
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-gray-800 dark:bg-white z-10"
                        style={{ left: `${pacingPercentage}%` }}
                        title="Today"
                      >
                         <div className="absolute -top-1 -translate-x-1/2 w-2 h-2 bg-gray-800 dark:bg-white rounded-full"></div>
                      </div>
                    )}
                 </div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};
