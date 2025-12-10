
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Receipt, Wallet, Settings as SettingsIcon, Menu, X, Moon, Sun, PieChart, ChevronDown, ChevronRight } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { Transactions } from './components/Transactions';
import { Accounts } from './components/Accounts';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { TransactionForm } from './components/TransactionForm';
import { BudgetPlanner } from './components/Budget';
import { CashFlow } from './components/CashFlow';
import { Expenses } from './components/Expenses';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { subscribeToAccounts, subscribeToTransactions, subscribeToBudgets, logoutUser } from './services/storage';
import { Account, Transaction, AccountType, TransactionType, Budget } from './types';

// Simple Hash Router Hook
const useHashLocation = () => {
  const getHashPath = () => window.location.hash.replace(/^#/, '') || '/';
  const [path, setPath] = useState(getHashPath());

  useEffect(() => {
    const handler = () => setPath(getHashPath());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = (to: string) => {
    window.location.hash = to;
  };

  return { path, navigate };
};

// Sidebar Component
const Sidebar = ({ isOpen, onClose, onLogout, currentPath, onNavigate, isDarkMode, toggleTheme }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onLogout: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}) => {
  const [planningOpen, setPlanningOpen] = useState(true);

  const isPlanningActive = currentPath.startsWith('/planning');

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 z-30 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-6 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">FinanceAI</span>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-500 dark:text-gray-400"><X size={24} /></button>
        </div>
        
        <nav className="px-4 mt-2 space-y-1 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          {/* Dashboard */}
          <a
            href="#/"
            onClick={(e) => { e.preventDefault(); onNavigate('/'); if(window.innerWidth < 768) onClose(); }}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer ${
              currentPath === '/' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} className="mr-3" />
            Dashboard
          </a>

          {/* Planning Group */}
          <div>
            <button 
              onClick={() => setPlanningOpen(!planningOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors cursor-pointer text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white ${isPlanningActive ? 'text-gray-900 dark:text-white font-medium' : ''}`}
            >
              <div className="flex items-center">
                <PieChart size={20} className="mr-3" />
                Planning
              </div>
              {planningOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {planningOpen && (
              <div className="pl-12 space-y-1 mt-1">
                 <a
                    href="#/planning/budget"
                    onClick={(e) => { e.preventDefault(); onNavigate('/planning/budget'); if(window.innerWidth < 768) onClose(); }}
                    className={`block py-2 text-sm transition-colors ${
                      currentPath === '/planning/budget' 
                        ? 'text-blue-600 dark:text-blue-400 font-medium' 
                        : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Budget
                  </a>
                  <a
                    href="#/planning/expenses"
                    onClick={(e) => { e.preventDefault(); onNavigate('/planning/expenses'); if(window.innerWidth < 768) onClose(); }}
                    className={`block py-2 text-sm transition-colors ${
                      currentPath === '/planning/expenses' 
                        ? 'text-blue-600 dark:text-blue-400 font-medium' 
                        : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Expenses
                  </a>
                  <a
                    href="#/planning/cashflow"
                    onClick={(e) => { e.preventDefault(); onNavigate('/planning/cashflow'); if(window.innerWidth < 768) onClose(); }}
                    className={`block py-2 text-sm transition-colors ${
                      currentPath === '/planning/cashflow' 
                        ? 'text-blue-600 dark:text-blue-400 font-medium' 
                        : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Cash Flow
                  </a>
              </div>
            )}
          </div>

          {/* Accounts */}
          <a
            href="#/accounts"
            onClick={(e) => { e.preventDefault(); onNavigate('/accounts'); if(window.innerWidth < 768) onClose(); }}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer ${
              currentPath === '/accounts' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Wallet size={20} className="mr-3" />
            Accounts
          </a>

          {/* Transactions */}
          <a
            href="#/transactions"
            onClick={(e) => { e.preventDefault(); onNavigate('/transactions'); if(window.innerWidth < 768) onClose(); }}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer ${
              currentPath === '/transactions' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Receipt size={20} className="mr-3" />
            Transactions
          </a>

          {/* Settings */}
          <a
            href="#/settings"
            onClick={(e) => { e.preventDefault(); onNavigate('/settings'); if(window.innerWidth < 768) onClose(); }}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors cursor-pointer ${
              currentPath === '/settings' 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <SettingsIcon size={20} className="mr-3" />
            Settings
          </a>
        </nav>
        
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2 shrink-0 bg-white dark:bg-gray-800">
           <button 
             onClick={toggleTheme}
             className="w-full flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
           >
             {isDarkMode ? <Sun size={18} className="mr-3" /> : <Moon size={18} className="mr-3" />}
             {isDarkMode ? 'Light Mode' : 'Dark Mode'}
           </button>
           <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">Sign Out</button>
        </div>
      </aside>
    </>
  );
};

const AuthenticatedApp: React.FC = () => {
  const { currentUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTxForm, setShowTxForm] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const { path, navigate } = useHashLocation();

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // Subscriptions
  useEffect(() => {
    if (!currentUser) return;
    const unsubAccounts = subscribeToAccounts(currentUser.uid, setAccounts);
    const unsubTx = subscribeToTransactions(currentUser.uid, setTransactions);
    const unsubBudgets = subscribeToBudgets(currentUser.uid, setBudgets);
    return () => {
      unsubAccounts();
      unsubTx();
      unsubBudgets();
    };
  }, [currentUser]);

  // Compute Current Balances
  const accountsWithBalance = useMemo(() => {
    return accounts.map(acc => {
      let balance = acc.initialBalance;
      // Filter transactions for this account
      const accTxs = transactions.filter(t => t.accountId === acc.id || t.toAccountId === acc.id);
      
      accTxs.forEach(tx => {
        const isLiability = [AccountType.CREDIT_CARD, AccountType.LOAN].includes(acc.type);
        
        if (tx.accountId === acc.id) {
            // Transaction originating from this account
            if (tx.type === TransactionType.INCOME) {
                 if (isLiability) balance -= tx.amount; // Income to CC reduces debt
                 else balance += tx.amount;
            } else if (tx.type === TransactionType.EXPENSE) {
                 if (isLiability) balance += tx.amount; // Expense on CC increases debt
                 else balance -= tx.amount;
            } else if (tx.type === TransactionType.TRANSFER) {
                 if (isLiability) balance -= tx.amount; 
                 else balance -= tx.amount;
            }
        }
        
        if (tx.toAccountId === acc.id && tx.type === TransactionType.TRANSFER) {
            // Money arriving in this account
            if (isLiability) balance -= tx.amount; 
            else balance += tx.amount;
        }
      });
      
      return { ...acc, currentBalance: balance };
    });
  }, [accounts, transactions]);

  const renderContent = () => {
    switch(path) {
      case '/': return <Dashboard accounts={accountsWithBalance} transactions={transactions} isDarkMode={isDarkMode} />;
      case '/accounts': return <Accounts accounts={accountsWithBalance} />;
      case '/transactions': return <Transactions transactions={transactions} onAddTransaction={() => setShowTxForm(true)} />;
      case '/planning/budget': return <BudgetPlanner transactions={transactions} budgets={budgets} />;
      case '/planning/expenses': return <Expenses transactions={transactions} />;
      case '/planning/cashflow': return <CashFlow accounts={accountsWithBalance} transactions={transactions} isDarkMode={isDarkMode} />;
      case '/settings': return <Settings accounts={accountsWithBalance} transactions={transactions} />;
      default: return <Dashboard accounts={accountsWithBalance} transactions={transactions} isDarkMode={isDarkMode} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-200">
        <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
            onLogout={logoutUser} 
            currentPath={path}
            onNavigate={navigate}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between md:hidden">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                 <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="font-bold text-gray-800 dark:text-white">FinanceAI</span>
            </div>
            <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-400"><Menu size={24} /></button>
          </header>
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {renderContent()}
          </main>
          {showTxForm && (
            <TransactionForm accounts={accounts} onClose={() => setShowTxForm(false)} />
          )}
        </div>
      </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center bg-white dark:bg-gray-900"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  return currentUser ? <AuthenticatedApp /> : <Auth />;
};

export default App;
