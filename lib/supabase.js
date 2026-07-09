import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  // Auto-strip trailing '/rest/v1' or '/rest/v1/' if pasted into env variables
  supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');
}
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helpers to generate local UUIDs
const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const isUUID = (str) => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

const sanitizeAccount = (account, userId) => {
  const clean = {
    name: account.name,
    type: account.type || 'bank',
    balance: parseFloat(account.balance) || 0,
    user_id: userId
  };
  if (account.id && isUUID(account.id)) {
    clean.id = account.id;
  }
  return clean;
};

const sanitizeTransaction = (tx, userId) => {
  const clean = {
    type: tx.type,
    category: tx.category,
    amount: parseFloat(tx.amount) || 0,
    date: tx.date || new Date().toISOString().split('T')[0],
    description: tx.description || '',
    user_id: userId
  };
  if (tx.id && isUUID(tx.id)) {
    clean.id = tx.id;
  }
  if (tx.account_id && isUUID(tx.account_id)) {
    clean.account_id = tx.account_id;
  }
  if (tx.to_account_id && isUUID(tx.to_account_id)) {
    clean.to_account_id = tx.to_account_id;
  }
  if (tx.recurring_rule_id && isUUID(tx.recurring_rule_id)) {
    clean.recurring_rule_id = tx.recurring_rule_id;
  }
  return clean;
};

const sanitizeBudget = (budget, userId) => {
  const clean = {
    category: budget.category,
    limit_amount: parseFloat(budget.limit_amount) || 0,
    period: budget.period || 'monthly',
    user_id: userId
  };
  if (budget.id && isUUID(budget.id)) {
    clean.id = budget.id;
  }
  return clean;
};

const sanitizeRecurringRule = (rule, userId) => {
  const clean = {
    type: rule.type,
    category: rule.category,
    amount: parseFloat(rule.amount) || 0,
    description: rule.description || '',
    frequency: rule.frequency,
    next_due_date: rule.next_due_date,
    is_active: rule.is_active !== undefined ? rule.is_active : true,
    user_id: userId
  };
  if (rule.id && isUUID(rule.id)) {
    clean.id = rule.id;
  }
  if (rule.account_id && isUUID(rule.account_id)) {
    clean.account_id = rule.account_id;
  }
  return clean;
};

// --- DATA ACCESS LAYER ADAPTER ---

const getLocalData = (key, defaultVal = []) => {
  if (typeof window === 'undefined') return defaultVal;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultVal;
};

const setLocalData = (key, data) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

export const api = {
  // Check auth status
  async getCurrentUser() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // --- ACCOUNTS ---
  async getAccounts(userId) {
    if (supabase && userId) {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('name');
      
      if (!error) {
        // Auto-provision 3 default wallets for new cloud database users
        if (data.length === 0) {
          const defaults = [
            { name: 'Cash', type: 'cash', balance: 0, user_id: userId },
            { name: 'Bank Account', type: 'bank', balance: 0, user_id: userId },
            { name: 'Credit Card', type: 'credit_card', balance: 0, user_id: userId }
          ];
          const { data: inserted, error: insertError } = await supabase
            .from('accounts')
            .insert(defaults)
            .select()
            .order('name');
          if (!insertError && inserted) {
            return inserted;
          }
        }
        return data;
      }
    }
    
    // Fallback to local
    const local = getLocalData('wallet_accounts');
    if (local.length === 0) {
      // Create default accounts if none exist
      const defaults = [
        { id: 'acc-cash', name: 'Cash', type: 'cash', balance: 0, color: '#10b981' },
        { id: 'acc-bank', name: 'Bank Account', type: 'bank', balance: 0, color: '#3b82f6' },
        { id: 'acc-card', name: 'Credit Card', type: 'credit_card', balance: 0, color: '#ef4444' }
      ];
      setLocalData('wallet_accounts', defaults);
      return defaults;
    }
    return local;
  },

  async saveAccount(account, userId) {
    if (supabase && userId) {
      const accountData = sanitizeAccount(account, userId);
      
      const { data, error } = await supabase
        .from('accounts')
        .upsert(accountData)
        .select();
      if (!error && data) return data[0];
    }

    // Local
    const local = getLocalData('wallet_accounts');
    if (account.id) {
      const updated = local.map(a => a.id === account.id ? { ...a, ...account } : a);
      setLocalData('wallet_accounts', updated);
      return account;
    } else {
      const newAcc = { ...account, id: 'acc-' + generateUUID() };
      local.push(newAcc);
      setLocalData('wallet_accounts', local);
      return newAcc;
    }
  },

  async deleteAccount(id, userId) {
    if (supabase && userId) {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);
      if (!error) return true;
    }

    // Local
    const local = getLocalData('wallet_accounts');
    const filtered = local.filter(a => a.id !== id);
    setLocalData('wallet_accounts', filtered);
    return true;
  },

  // --- TRANSACTIONS ---
  async getTransactions(userId) {
    if (supabase && userId) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (!error) return data;
    }

    // Local
    return getLocalData('wallet_transactions');
  },

  async saveTransaction(transaction, userId) {
    if (supabase && userId) {
      const txData = sanitizeTransaction(transaction, userId);
      
      // Perform adjustment on Supabase database
      const { data, error } = await supabase
        .from('transactions')
        .upsert(txData)
        .select();

      if (error) throw error;
      
      // Update accounts balances in database
      await this.recalculateAccountBalances(userId);

      return data[0];
    }

    // Local Storage Flow
    const local = getLocalData('wallet_transactions');
    let savedTx = { ...transaction };

    if (transaction.id) {
      const updated = local.map(t => t.id === transaction.id ? { ...t, ...transaction } : t);
      setLocalData('wallet_transactions', updated);
    } else {
      savedTx.id = 'tx-' + generateUUID();
      local.push(savedTx);
      setLocalData('wallet_transactions', local);
    }

    // Recalculate local balances
    this.recalculateLocalAccountBalances();
    return savedTx;
  },

  async deleteTransaction(id, userId) {
    if (supabase && userId) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      
      await this.recalculateAccountBalances(userId);
      return true;
    }

    // Local
    const local = getLocalData('wallet_transactions');
    const filtered = local.filter(t => t.id !== id);
    setLocalData('wallet_transactions', filtered);
    
    this.recalculateLocalAccountBalances();
    return true;
  },

  // --- BUDGETS ---
  async getBudgets(userId) {
    if (supabase && userId) {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);
      if (!error) return data;
    }

    return getLocalData('wallet_budgets');
  },

  async saveBudget(budget, userId) {
    if (supabase && userId) {
      const budgetData = sanitizeBudget(budget, userId);
      const { data, error } = await supabase
        .from('budgets')
        .upsert(budgetData)
        .select();
      if (!error && data) return data[0];
    }

    const local = getLocalData('wallet_budgets');
    if (budget.id) {
      const updated = local.map(b => b.id === budget.id ? { ...b, ...budget } : b);
      setLocalData('wallet_budgets', updated);
      return budget;
    } else {
      const newBudget = { ...budget, id: 'bgt-' + generateUUID() };
      local.push(newBudget);
      setLocalData('wallet_budgets', local);
      return newBudget;
    }
  },

  async deleteBudget(id, userId) {
    if (supabase && userId) {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
      if (!error) return true;
    }

    const local = getLocalData('wallet_budgets');
    const filtered = local.filter(b => b.id !== id);
    setLocalData('wallet_budgets', filtered);
    return true;
  },

  // --- RECURRING RULES ---
  async getRecurringRules(userId) {
    if (supabase && userId) {
      const { data, error } = await supabase
        .from('recurring_rules')
        .select('*')
        .eq('user_id', userId);
      if (!error) return data;
    }

    return getLocalData('wallet_recurring_rules');
  },

  async saveRecurringRule(rule, userId) {
    if (supabase && userId) {
      const ruleData = sanitizeRecurringRule(rule, userId);
      const { data, error } = await supabase
        .from('recurring_rules')
        .upsert(ruleData)
        .select();
      if (!error && data) return data[0];
    }

    const local = getLocalData('wallet_recurring_rules');
    if (rule.id) {
      const updated = local.map(r => r.id === rule.id ? { ...r, ...rule } : r);
      setLocalData('wallet_recurring_rules', updated);
      return rule;
    } else {
      const newRule = { ...rule, id: 'rec-' + generateUUID() };
      local.push(newRule);
      setLocalData('wallet_recurring_rules', local);
      return newRule;
    }
  },

  async deleteRecurringRule(id, userId) {
    if (supabase && userId) {
      const { error } = await supabase
        .from('recurring_rules')
        .delete()
        .eq('id', id);
      if (!error) return true;
    }

    const local = getLocalData('wallet_recurring_rules');
    const filtered = local.filter(r => r.id !== id);
    setLocalData('wallet_recurring_rules', filtered);
    return true;
  },

  // --- RECALCULATORS ---
  async recalculateAccountBalances(userId) {
    if (!supabase || !userId) return;
    
    // Fetch all transactions
    const { data: txs } = await supabase.from('transactions').select('*').eq('user_id', userId);
    const { data: accs } = await supabase.from('accounts').select('*').eq('user_id', userId);
    
    if (!accs) return;
    
    for (const acc of accs) {
      let balance = 0;
      txs.forEach(tx => {
        const amt = parseFloat(tx.amount);
        if (tx.type === 'income' && tx.account_id === acc.id) {
          balance += amt;
        } else if (tx.type === 'expense' && tx.account_id === acc.id) {
          balance -= amt;
        } else if (tx.type === 'transfer') {
          if (tx.account_id === acc.id) balance -= amt; // Source
          if (tx.to_account_id === acc.id) balance += amt; // Destination
        }
      });
      
      await supabase.from('accounts').update({ balance }).eq('id', acc.id);
    }
  },

  recalculateLocalAccountBalances() {
    const txs = getLocalData('wallet_transactions');
    const accs = getLocalData('wallet_accounts');
    
    const updatedAccs = accs.map(acc => {
      let balance = 0;
      txs.forEach(tx => {
        const amt = parseFloat(tx.amount);
        if (tx.type === 'income' && tx.account_id === acc.id) {
          balance += amt;
        } else if (tx.type === 'expense' && tx.account_id === acc.id) {
          balance -= amt;
        } else if (tx.type === 'transfer') {
          if (tx.account_id === acc.id) balance -= amt;
          if (tx.to_account_id === acc.id) balance += amt;
        }
      });
      return { ...acc, balance };
    });
    
    setLocalData('wallet_accounts', updatedAccs);
  },

  // --- SYNC DATA SERVICE ---
  async syncLocalDataToCloud(userId) {
    if (!supabase || !userId) return false;

    try {
      const localAccs = getLocalData('wallet_accounts');
      const localRules = getLocalData('wallet_recurring_rules');
      const localTxs = getLocalData('wallet_transactions');
      const localBudgets = getLocalData('wallet_budgets');

      // 1. Sync accounts first (mapping old client-side IDs to new DB IDs)
      const idMapping = {}; // key: local_id, value: cloud_id
      
      for (const acc of localAccs) {
        const cleanAcc = sanitizeAccount(acc, userId);
        // Upload account
        const { data, error } = await supabase
          .from('accounts')
          .insert(cleanAcc)
          .select();
        
        if (!error && data && data[0]) {
          idMapping[acc.id] = data[0].id;
        }
      }

      // Fill in defaults for IDs that might not have mapped
      localAccs.forEach(acc => {
        if (!idMapping[acc.id]) {
          idMapping[acc.id] = acc.id; // fallback
        }
      });

      // 2. Sync recurring rules
      const ruleMapping = {};
      for (const rule of localRules) {
        const cleanRule = sanitizeRecurringRule(rule, userId);
        if (rule.account_id) {
          cleanRule.account_id = idMapping[rule.account_id] || rule.account_id;
        }

        const { data, error } = await supabase
          .from('recurring_rules')
          .insert(cleanRule)
          .select();

        if (!error && data && data[0]) {
          ruleMapping[rule.id] = data[0].id;
        }
      }

      // 3. Sync budgets
      for (const bgt of localBudgets) {
        const cleanBgt = sanitizeBudget(bgt, userId);
        await supabase
          .from('budgets')
          .upsert(cleanBgt);
      }

      // 4. Sync transactions
      for (const tx of localTxs) {
        const cleanTx = sanitizeTransaction(tx, userId);
        if (tx.account_id) {
          cleanTx.account_id = idMapping[tx.account_id] || tx.account_id;
        }
        if (tx.to_account_id) {
          cleanTx.to_account_id = idMapping[tx.to_account_id] || tx.to_account_id;
        }
        if (tx.recurring_rule_id) {
          cleanTx.recurring_rule_id = ruleMapping[tx.recurring_rule_id] || tx.recurring_rule_id;
        }

        await supabase
          .from('transactions')
          .insert(cleanTx);
      }

      // Recalculate everything in cloud
      await this.recalculateAccountBalances(userId);

      // Clear local database to prevent double syncs
      localStorage.removeItem('wallet_accounts');
      localStorage.removeItem('wallet_transactions');
      localStorage.removeItem('wallet_budgets');
      localStorage.removeItem('wallet_recurring_rules');

      return true;
    } catch (e) {
      console.error("Sync error:", e);
      return false;
    }
  }
};
