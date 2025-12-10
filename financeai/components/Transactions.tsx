import React from 'react';
import { Transaction, TransactionType } from '../types';
import { Search, Filter, Trash2 } from 'lucide-react';
import { deleteTransaction } from '../services/storage';

interface TransactionsProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
}

export const Transactions: React.FC<TransactionsProps> = ({ transactions, onAddTransaction }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filtered = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if(window.confirm("Delete this transaction?")) {
      await deleteTransaction(id);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h2>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
             onClick={onAddTransaction}
             className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
             + Add New
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700 uppercase text-xs font-semibold text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-gray-200">{tx.date}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{tx.description}</div>
                    <div className="text-xs text-gray-400 uppercase">{tx.type}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                      {tx.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-medium ${tx.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {tx.type === TransactionType.INCOME ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(tx.id)}
                      className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                   <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};