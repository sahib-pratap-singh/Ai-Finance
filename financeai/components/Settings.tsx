import React from 'react';
import { Account, Transaction } from '../types';
import { Download, FileSpreadsheet } from 'lucide-react';

interface SettingsProps {
  accounts: Account[];
  transactions: Transaction[];
}

export const Settings: React.FC<SettingsProps> = ({ accounts, transactions }) => {
  
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportTransactions = () => {
    const headers = ['Date', 'Description', 'Category', 'Amount', 'Type', 'Account Name', 'Merchant', 'Source Account ID', 'Destination Account ID'];
    
    const rows = transactions.map(t => {
        const accountName = accounts.find(a => a.id === t.accountId)?.name || 'Unknown Account';
        
        // Escape quotes for CSV format
        const safeDesc = `"${t.description.replace(/"/g, '""')}"`;
        const safeCat = `"${t.category.replace(/"/g, '""')}"`;
        const safeAcc = `"${accountName.replace(/"/g, '""')}"`;
        const safeMerch = t.merchantName ? `"${t.merchantName.replace(/"/g, '""')}"` : '';

        return [
            t.date,
            safeDesc,
            safeCat,
            t.amount,
            t.type,
            safeAcc,
            safeMerch,
            t.accountId,
            t.toAccountId || ''
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `finance_transactions_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportAccounts = () => {
    const headers = ['Account Name', 'Type', 'Initial Balance', 'Current Balance', 'Account ID'];
    
    const rows = accounts.map(a => {
        const safeName = `"${a.name.replace(/"/g, '""')}"`;
        return [
            safeName,
            a.type,
            a.initialBalance,
            a.currentBalance || 0,
            a.id
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `finance_accounts_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <FileSpreadsheet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Data Export</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                        Download your financial data in CSV format. This file is compatible with Excel, Google Sheets, and other spreadsheet software.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={exportTransactions} 
                            className="flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Transactions (CSV)
                        </button>
                        <button 
                            onClick={exportAccounts} 
                            className="flex items-center justify-center px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Accounts (CSV)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};