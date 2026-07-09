'use client';

import React from 'react';
import { useWallet } from '@/lib/WalletContext';
import TransactionForm from '@/components/TransactionForm';
import RecentTransactions from '@/components/RecentTransactions';
import CSVExportImport from '@/components/CSVExportImport';
import { FileText } from 'lucide-react';

export default function TransactionsPage() {
  const {
    transactions,
    accounts,
    selectedMonth,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions
  } = useWallet();

  // Filter transactions by selected month
  const monthlyTransactions = transactions.filter(t => t.date && t.date.startsWith(selectedMonth));

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl space-y-6">
      
      {/* Title */}
      <div className="border border-black bg-white p-4 flex items-center gap-2 text-xs font-black uppercase tracking-wider">
        <FileText className="h-4 w-4" />
        <span>Financial Ledger & Transaction Manager</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Transaction Input Form (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <TransactionForm 
            accounts={accounts} 
            onAddTransaction={addTransaction} 
            selectedMonth={selectedMonth} 
          />
        </div>

        {/* Right Column: Ledger List and CSV controls (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-6">
          <RecentTransactions 
            transactions={monthlyTransactions} 
            accounts={accounts} 
            onUpdateTransaction={updateTransaction} 
            onDeleteTransaction={deleteTransaction} 
          />
          <CSVExportImport 
            transactions={transactions} 
            accounts={accounts} 
            onImportTransactions={importTransactions} 
          />
        </div>

      </div>

    </div>
  );
}
