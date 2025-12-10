import React from 'react';
import { Goal } from '../types';
import { Target, Calendar, TrendingUp } from 'lucide-react';

interface GoalsProps {
  goals: Goal[];
}

export const Goals: React.FC<GoalsProps> = ({ goals }) => {
  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Goals</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map(goal => {
           const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
           const remaining = goal.targetAmount - goal.currentAmount;
           const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
           
           return (
             <div key={goal.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col transition-colors">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">{goal.name}</h3>
                   <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
                     <Calendar className="w-4 h-4 mr-1" />
                     Target: {new Date(goal.targetDate).toLocaleDateString()}
                   </div>
                 </div>
                 <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                   <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                 </div>
               </div>

               <div className="mt-2">
                 <div className="flex justify-between text-sm mb-1">
                   <span className="font-semibold text-gray-700 dark:text-gray-200">${goal.currentAmount.toLocaleString()}</span>
                   <span className="text-gray-500 dark:text-gray-400">of ${goal.targetAmount.toLocaleString()}</span>
                 </div>
                 <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                   <div className="h-full bg-purple-600 rounded-full transition-all duration-700" style={{ width: `${percentage}%` }}></div>
                 </div>
               </div>

               <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-700">
                 <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center text-gray-600 dark:text-gray-300">
                     <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                     {percentage.toFixed(0)}% Complete
                   </div>
                   <div className="text-gray-500 dark:text-gray-400">
                     {daysLeft > 0 ? `${daysLeft} days left` : 'Due'}
                   </div>
                 </div>
                 {remaining > 0 && daysLeft > 0 && (
                   <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                     Save <span className="font-semibold text-gray-600 dark:text-gray-300">${Math.ceil(remaining / (daysLeft / 30))}</span> / month to reach your goal.
                   </p>
                 )}
               </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};