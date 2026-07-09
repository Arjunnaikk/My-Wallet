'use client';

import React from 'react';
import { useWallet } from '@/lib/WalletContext';
import BudgetPlanner from '@/components/BudgetPlanner';
import { Target } from 'lucide-react';

export default function BudgetsPage() {
  const {
    budgets,
    transactions,
    selectedMonth,
    saveBudget,
    deleteBudget
  } = useWallet();

  const monthlyTransactions = transactions.filter(t => t.date && t.date.startsWith(selectedMonth));

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-2xl space-y-6">
      
      {/* Title Header */}
      <div className="border border-black bg-white p-4 flex items-center gap-2 text-xs font-black uppercase tracking-wider">
        <Target className="h-4 w-4" />
        <span>Monthly Budgets & Category Thresholds</span>
      </div>

      <BudgetPlanner 
        budgets={budgets} 
        transactions={monthlyTransactions} 
        onSaveBudget={saveBudget} 
        onDeleteBudget={deleteBudget} 
      />

    </div>
  );
}
