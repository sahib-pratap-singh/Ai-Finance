
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface ExpensesProps {
  transactions: Transaction[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food': '#10B981', // Emerald
  'Housing': '#3B82F6', // Blue
  'Transportation': '#F59E0B', // Amber
  'Entertainment': '#8B5CF6', // Violet
  'Shopping': '#EC4899', // Pink
  'Health': '#EF4444', // Red
  'Utilities': '#6366F1', // Indigo
  'Other': '#9CA3AF', // Gray
};

export const Expenses: React.FC<ExpensesProps> = ({ transactions }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // --- Helpers ---
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  // --- Data Processing ---
  const currentMonthTxs = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() === month && t.type === TransactionType.EXPENSE;
    });
  }, [transactions, year, month]);

  // Map: Day -> { total, dominantCategory, transactions }
  const dailyStats = useMemo(() => {
    const stats: Record<number, { total: number; dominantCategory: string; txs: Transaction[] }> = {};
    
    currentMonthTxs.forEach(t => {
      const day = new Date(t.date).getDate() + 1; // Fix timezone offset issues roughly or just use UTC day. 
      // Safe parsing:
      const dayNum = parseInt(t.date.split('-')[2]); 

      if (!stats[dayNum]) stats[dayNum] = { total: 0, dominantCategory: '', txs: [] };
      
      stats[dayNum].total += t.amount;
      stats[dayNum].txs.push(t);
    });

    // Determine dominant category per day
    Object.keys(stats).forEach(dayKey => {
      const d = parseInt(dayKey);
      const catTotals: Record<string, number> = {};
      stats[d].txs.forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
      });
      // Find max
      stats[d].dominantCategory = Object.keys(catTotals).reduce((a, b) => catTotals[a] > catTotals[b] ? a : b);
    });

    return stats;
  }, [currentMonthTxs]);

  // Analytics Data (Filtered by Selected Day or Whole Month)
  const activeTxs = selectedDay 
    ? (dailyStats[selectedDay]?.txs || []) 
    : currentMonthTxs;

  const totalSpend = activeTxs.reduce((sum, t) => sum + t.amount, 0);

  // Group for Bar Chart
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    activeTxs.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + t.amount;
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [activeTxs]);

  // Mock Average for Reference Line (e.g., 80% of max or a fixed visual baseline)
  const maxVal = categoryStats[0]?.value || 0;
  const mockAverage = maxVal * 0.7; 

  // --- Render ---
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: startDay }, (_, i) => i);

  return (
    <div className="p-4 md:p-6 h-full flex flex-col animate-fade-in">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <CalendarIcon className="mr-3 w-6 h-6 text-blue-600" /> Expenses Calendar
        </h2>
        <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <span className="font-semibold text-gray-900 dark:text-white w-32 text-center">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-full">
        
        {/* LEFT PANEL: CALENDAR (2/3) */}
        <div className="lg:w-2/3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide py-2">
                {d}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2 auto-rows-[1fr]">
             {/* Empty Slots */}
             {emptySlots.map(i => <div key={`empty-${i}`} className="aspect-square"></div>)}
             
             {/* Days */}
             {daysArray.map(day => {
               const stat = dailyStats[day];
               const hasSpend = stat && stat.total > 0;
               const isSelected = selectedDay === day;
               
               // Heatmap Logic
               let bgClass = "bg-gray-50 dark:bg-gray-750";
               if (hasSpend) {
                 if (stat.total > 200) bgClass = "bg-blue-200 dark:bg-blue-900/80";
                 else if (stat.total > 50) bgClass = "bg-blue-100 dark:bg-blue-900/50";
                 else bgClass = "bg-blue-50 dark:bg-blue-900/30";
               }
               if (isSelected) bgClass = "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800 z-10";

               return (
                 <button
                   key={day}
                   onClick={() => setSelectedDay(isSelected ? null : day)}
                   className={`aspect-square rounded-xl p-2 relative flex flex-col justify-between items-start transition-all hover:scale-[1.02] ${bgClass}`}
                 >
                   <span className={`text-sm font-medium ${hasSpend ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                     {day}
                   </span>
                   
                   {hasSpend && (
                     <>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-100">
                          ${Math.round(stat.total)}
                        </span>
                        {/* Dominant Category Dot */}
                        <div 
                          className="absolute top-2 right-2 w-2 h-2 rounded-full" 
                          style={{ backgroundColor: CATEGORY_COLORS[stat.dominantCategory] || '#9CA3AF' }}
                          title={`Top: ${stat.dominantCategory}`}
                        />
                     </>
                   )}
                 </button>
               );
             })}
          </div>
        </div>

        {/* RIGHT PANEL: ANALYTICS (1/3) */}
        <div className="lg:w-1/3 flex flex-col gap-6">
           
           {/* Context Header */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div>
                   <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium uppercase">
                     {selectedDay ? `Spending on ${currentDate.toLocaleString('default', { month: 'short' })} ${selectedDay}` : `Total for ${currentDate.toLocaleString('default', { month: 'long' })}`}
                   </h3>
                   <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                     ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </div>
                </div>
                {selectedDay && (
                  <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X size={20} />
                  </button>
                )}
              </div>
              
              {/* Horizontal Bar Chart */}
              <div className="h-48 mt-4 w-full">
                 {categoryStats.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart layout="vertical" data={categoryStats.slice(0, 5)} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11, fill: '#6B7280' }} interval={0} />
                        <Tooltip 
                          cursor={{ fill: 'transparent' }} 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                          {categoryStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#3B82F6'} />
                          ))}
                        </Bar>
                        {/* "Vs Average" Line */}
                        <ReferenceLine x={mockAverage} stroke="#9CA3AF" strokeDasharray="3 3" />
                     </BarChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data for this period</div>
                 )}
              </div>
           </div>

           {/* Category List */}
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex-1 overflow-hidden flex flex-col transition-colors">
             <div className="p-4 border-b border-gray-100 dark:border-gray-700 font-semibold text-gray-800 dark:text-white flex items-center">
               <PieChart className="w-4 h-4 mr-2" /> Breakdown
             </div>
             <div className="overflow-y-auto p-2 space-y-1 flex-1 custom-scrollbar">
                {categoryStats.map((cat) => {
                  const percent = totalSpend > 0 ? (cat.value / totalSpend) * 100 : 0;
                  return (
                    <div key={cat.name} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group">
                       <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || '#9CA3AF' }}></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</div>
                            <div className="text-xs text-gray-400 group-hover:text-gray-500 transition-colors">
                               {percent.toFixed(1)}% of total
                            </div>
                          </div>
                       </div>
                       <div className="font-semibold text-gray-900 dark:text-gray-200">
                         ${cat.value.toLocaleString()}
                       </div>
                    </div>
                  );
                })}
                {categoryStats.length === 0 && (
                   <div className="p-4 text-center text-gray-400 text-sm">No expenses recorded.</div>
                )}
             </div>
           </div>

        </div>
      </div>
    </div>
  );
};
