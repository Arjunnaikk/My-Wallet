'use client';

import React from 'react';
import { useWallet } from '@/lib/WalletContext';
import RecurringManager from '@/components/RecurringManager';
import { CalendarClock } from 'lucide-react';

export default function SubscriptionsPage() {
  const {
    accounts,
    recurringRules,
    saveRule,
    deleteRule,
    applyRecurringTransaction
  } = useWallet();

  return (
    <div className="container mx-auto px-3 pt-4 pb-36 sm:p-6 max-w-2xl space-y-5 sm:space-y-6">
      
      {/* Title Header */}
      <div className="border border-black bg-white p-4 flex items-center gap-2 text-xs font-black uppercase tracking-wider">
        <CalendarClock className="h-4 w-4" />
        <span>Recurring Ledger Rules & Bills</span>
      </div>

      <RecurringManager 
        accounts={accounts} 
        recurringRules={recurringRules} 
        onSaveRule={saveRule} 
        onDeleteRule={deleteRule} 
        onApplyRecurringTransaction={applyRecurringTransaction} 
      />

    </div>
  );
}
