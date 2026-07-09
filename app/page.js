'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight, AlertTriangle, ArrowRight, ArrowDown, ArrowUp, BarChart } from 'lucide-react';
import { useWallet } from '@/lib/WalletContext';
import AccountsCard from '@/components/AccountsCard';
import FinancialCharts from '@/components/FinancialCharts';

export default function DashboardHome() {
  const {
    loading,
    accounts,
    transactions,
    selectedMonth,
    setSelectedMonth,
    recurringRules,
    saveAccount,
    deleteAccount
  } = useWallet();

  const formatCurrency = (val, showPlus = false) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val);
    const formatted = absVal.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    if (isNegative) return `-₹${formatted}`;
    if (showPlus) return `+₹${formatted}`;
    return `₹${formatted}`;
  };

  // 1. Calculate active statistics
  const netWorth = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

  // Transactions filtered by selected month
  const monthlyTransactions = transactions.filter(t => t.date && t.date.startsWith(selectedMonth));

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const monthlyExpense = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const monthlySavings = monthlyIncome - monthlyExpense;

  // 2. Identify due bills
  const todayStr = new Date().toISOString().split('T')[0];
  const dueBillsCount = recurringRules.filter(r => r.is_active && r.next_due_date <= todayStr).length;

  // Date controls
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const y = prevDate.getFullYear();
    const m = String(prevDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  const getMonthLabel = (monthStr) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading && accounts.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-6xl flex justify-center items-center h-[300px]">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <span>Loading overview...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-6xl space-y-6">
      
      {/* Due Bills Alert banner */}
      {dueBillsCount > 0 && (
        <div className="border border-black bg-black text-white p-3 flex justify-between items-center text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Notice: You have {dueBillsCount} recurring bill(s) due today or overdue.</span>
          </div>
          <Link href="/subscriptions" className="flex items-center gap-1 hover:underline">
            Resolve Bills <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Date Switcher toolbar */}
      <div className="border border-black bg-white p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
          <Calendar className="h-4 w-4" />
          <span>Dashboard Overview / {getMonthLabel(selectedMonth)}</span>
        </div>

        <div className="flex items-center border border-black bg-white">
          <button
            onClick={handlePrevMonth}
            className="p-1 border-r border-black hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest px-4 min-w-[120px] text-center">
            {getMonthLabel(selectedMonth)}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 border-l border-black hover:bg-neutral-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* STATS HIGHLIGHTS PANEL (Stark high contrast) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="stark-card-static p-5 flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
            Net Worth (All-time)
          </span>
          <span className="text-2xl font-black tracking-tight num-mono leading-none">
            {formatCurrency(netWorth)}
          </span>
          <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mt-1">
            Total ledger balance
          </span>
        </div>

        {/* Income */}
        <div className="stark-card-static p-5 flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
            <ArrowUp className="h-3 w-3 text-black" /> Monthly Income
          </span>
          <span className="text-2xl font-black tracking-tight num-mono leading-none">
            {formatCurrency(monthlyIncome, true)}
          </span>
          <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mt-1">
            {monthlyTransactions.filter(t => t.type === 'income').length} entries logged
          </span>
        </div>

        {/* Expenses */}
        <div className="stark-card-static p-5 flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
            <ArrowDown className="h-3 w-3 text-black" /> Monthly Expenses
          </span>
          <span className="text-2xl font-black tracking-tight num-mono leading-none">
            {formatCurrency(-monthlyExpense)}
          </span>
          <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mt-1">
            {monthlyTransactions.filter(t => t.type === 'expense').length} entries logged
          </span>
        </div>

        {/* Savings */}
        <div className="stark-card-static p-5 flex flex-col justify-between h-24">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
            Monthly Savings
          </span>
          <span className={`text-2xl font-black tracking-tight num-mono leading-none ${monthlySavings < 0 ? 'underline decoration-dotted decoration-neutral-500' : ''}`}>
            {formatCurrency(monthlySavings, monthlySavings > 0)}
          </span>
          <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mt-1">
            Net cash balance
          </span>
        </div>
      </div>

      {/* CORE DISPLAY COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Account cards (lg:col-span-5) */}
        <div className="lg:col-span-5">
          <AccountsCard 
            accounts={accounts} 
            onSaveAccount={saveAccount} 
            onDeleteAccount={deleteAccount} 
          />
        </div>

        {/* Right Column: Graphs reports (lg:col-span-7) */}
        <div className="lg:col-span-7">
          <FinancialCharts transactions={monthlyTransactions} />
        </div>

      </div>

    </div>
  );
}