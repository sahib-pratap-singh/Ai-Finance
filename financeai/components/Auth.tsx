import React, { useState } from 'react';
import { loginUser } from '../services/storage';
import { UserCircle, ArrowRight, Loader2 } from 'lucide-react';

export const Auth: React.FC = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate a brief network delay for UX
    setTimeout(() => {
      loginUser(name);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-100 dark:border-gray-700 transition-colors">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">F</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to FinanceAI
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Local-first personal finance tracking
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Start Tracking <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-xs text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
          <strong>Note:</strong> Data is stored in your browser's Local Storage. No external database or account is required.
        </div>
      </div>
    </div>
  );
};