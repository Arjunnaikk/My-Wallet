'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { api, supabase, isSupabaseConfigured } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';
import Navbar from '@/components/Navbar';
import { Loader2 } from 'lucide-react';

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('local');
  const [loading, setLoading] = useState(true);
  
  // Theme States: 'light' | 'dark' | 'system'
  const [theme, setThemeState] = useState('system');

  const applyTheme = (targetTheme) => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let resolvedTheme = targetTheme;
    if (targetTheme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.classList.add(resolvedTheme);
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wallet_theme', newTheme);
    }
    applyTheme(newTheme);
  };

  // Financial States
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recurringRules, setRecurringRules] = useState([]);
  
  // Date State: YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  // 1. Initial Load & Theme
  useEffect(() => {
    setIsClient(true);
    
    // Load Saved Theme
    const savedTheme = localStorage.getItem('wallet_theme') || 'system';
    setThemeState(savedTheme);
    applyTheme(savedTheme);
  }, []);

  // 2. React to NextAuth Session Changes
  useEffect(() => {
    if (status === 'loading') return;

    const handleSessionChange = async () => {
      if (status === 'authenticated' && session?.user) {
        const wasLocal = syncStatus === 'local' || user === null;
        setUser(session.user);
        
        if (wasLocal) {
          setSyncStatus('syncing');
          await api.syncLocalDataToCloud(session.user.id);
        } else {
          setSyncStatus('idle');
        }
        await loadData(session.user.id);
      } else {
        setUser(null);
        setSyncStatus('local');
        await loadData(null);
      }
    };

    handleSessionChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  const loadData = async (userId) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured && userId) {
        setSyncStatus('syncing');
      }
      
      const accList = await api.getAccounts(userId);
      const txList = await api.getTransactions(userId);
      const bgtList = await api.getBudgets(userId);
      const ruleList = await api.getRecurringRules(userId);

      setAccounts(accList);
      setTransactions(txList);
      setBudgets(bgtList);
      setRecurringRules(ruleList);

      if (isSupabaseConfigured && userId) {
        setSyncStatus('synced');
      }
    } catch (e) {
      console.error("Data load error:", e);
      if (userId) setSyncStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setUser(null);
    setSyncStatus('local');
    await loadData(null);
  };

  const handleAddTransaction = async (tx) => {
    await api.saveTransaction(tx, user?.id);
    await loadData(user?.id);
  };

  const handleUpdateTransaction = async (tx) => {
    await api.saveTransaction(tx, user?.id);
    await loadData(user?.id);
  };

  const handleDeleteTransaction = async (id) => {
    await api.deleteTransaction(id, user?.id);
    await loadData(user?.id);
  };

  const handleSaveAccount = async (acc) => {
    await api.saveAccount(acc, user?.id);
    await loadData(user?.id);
  };

  const handleDeleteAccount = async (id) => {
    await api.deleteAccount(id, user?.id);
    await loadData(user?.id);
  };

  const handleSaveBudget = async (bgt) => {
    await api.saveBudget(bgt, user?.id);
    await loadData(user?.id);
  };

  const handleDeleteBudget = async (id) => {
    await api.deleteBudget(id, user?.id);
    await loadData(user?.id);
  };

  const handleSaveRule = async (rule) => {
    await api.saveRecurringRule(rule, user?.id);
    await loadData(user?.id);
  };

  const handleDeleteRule = async (id) => {
    await api.deleteRecurringRule(id, user?.id);
    await loadData(user?.id);
  };

  const handleApplyRecurringTransaction = async (rule, nextDueDateStr) => {
    const tx = {
      type: rule.type,
      amount: parseFloat(rule.amount),
      category: rule.category,
      account_id: rule.account_id,
      date: new Date().toISOString().split('T')[0],
      description: `${rule.description} (Auto)`,
      recurring_rule_id: rule.id
    };
    await api.saveTransaction(tx, user?.id);

    const updatedRule = { ...rule, next_due_date: nextDueDateStr };
    await api.saveRecurringRule(updatedRule, user?.id);
    await loadData(user?.id);
  };

  const handleImportTransactions = async (txList) => {
    for (const tx of txList) {
      await api.saveTransaction(tx, user?.id);
    }
    await loadData(user?.id);
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center text-black">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-black" />
          <p className="text-xs font-bold tracking-wider">LOADING LEDGER...</p>
        </div>
      </div>
    );
  }

  return (
    <WalletContext.Provider value={{
      user,
      syncStatus,
      loading,
      accounts,
      transactions,
      budgets,
      recurringRules,
      selectedMonth,
      setSelectedMonth,
      theme,
      setTheme,
      openAuthModal: () => setIsAuthOpen(true),
      logout: handleLogout,
      addTransaction: handleAddTransaction,
      updateTransaction: handleUpdateTransaction,
      deleteTransaction: handleDeleteTransaction,
      saveAccount: handleSaveAccount,
      deleteAccount: handleDeleteAccount,
      saveBudget: handleSaveBudget,
      deleteBudget: handleDeleteBudget,
      saveRule: handleSaveRule,
      deleteRule: handleDeleteRule,
      applyRecurringTransaction: handleApplyRecurringTransaction,
      importTransactions: handleImportTransactions,
      reloadData: () => loadData(user?.id)
    }}>
      <div className="min-h-screen bg-[#fafafa] dark:bg-black text-black dark:text-white flex flex-col pb-20 md:pb-12 transition-colors duration-200">
        <Navbar 
          user={user} 
          onLoginClick={() => setIsAuthOpen(true)} 
          onLogout={handleLogout} 
          syncStatus={syncStatus} 
        />
        <main className="flex-grow">
          {children}
        </main>
      </div>

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within WalletProvider');
  return context;
};
