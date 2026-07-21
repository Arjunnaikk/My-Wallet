'use client';

import React, { useState } from 'react';
import { Search, IndianRupee, CreditCard, ArrowRightLeft, Trash2, Edit3, Check, X, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const CATEGORY_LABELS = {
  salary: 'Salary',
  food: 'Food & Dining',
  transport: 'Transport',
  utilities: 'Utilities & Bills',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  health: 'Health & Medical',
  travel: 'Travel',
  other: 'Other / Misc',
  transfer: 'Transfer'
};

const RecentTransactions = ({ transactions, accounts, onUpdateTransaction, onDeleteTransaction }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAccount, setFilterAccount] = useState('all');
  
  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editAccountId, setEditAccountId] = useState('');

  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category).filter(Boolean)));

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase());
      
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    const matchesAccount = filterAccount === 'all' || t.account_id === filterAccount || t.to_account_id === filterAccount;

    return matchesSearch && matchesType && matchesCategory && matchesAccount;
  });

  const handleStartEdit = (tx) => {
    setEditingId(tx.id);
    setEditAmount(tx.amount.toString());
    setEditCategory(tx.category);
    setEditDesc(tx.description || '');
    setEditDate(tx.date);
    setEditAccountId(tx.account_id);
  };

  const handleSaveEdit = (tx) => {
    if (!editAmount || isNaN(editAmount) || parseFloat(editAmount) <= 0) return;
    
    onUpdateTransaction({
      ...tx,
      amount: parseFloat(editAmount),
      category: editCategory,
      description: editDesc,
      date: editDate,
      account_id: editAccountId
    });

    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      onDeleteTransaction(id);
    }
  };

  return (
    <div className="stark-card-static bg-white border border-black p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-4 flex flex-col h-full min-h-[480px]">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h3 className="font-black text-xs uppercase tracking-wider">Transaction Ledger</h3>
        </div>
        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
          {filteredTransactions.length} records
        </span>
      </div>

      {/* Filter panel */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search details..."
            className="pl-8 stark-input text-xs py-1 h-8"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="stark-input text-[10px] h-8 bg-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-white border-black text-black text-[10px]">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="transfer">Transfers</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="stark-input text-[10px] h-8 bg-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-white border-black text-black text-[10px]">
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {CATEGORY_LABELS[cat] || cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger className="stark-input text-[10px] h-8 bg-white">
              <SelectValue placeholder="Wallet" />
            </SelectTrigger>
            <SelectContent className="bg-white border-black text-black text-[10px]">
              <SelectItem value="all">All Wallets</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ledger list */}
      <div className="flex-grow overflow-y-auto max-h-[350px] pr-1 space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 text-neutral-300 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest">No entries found</p>
          </div>
        ) : (
          filteredTransactions.map(tx => {
            const isEditing = editingId === tx.id;
            const srcAccName = accounts.find(a => a.id === tx.account_id)?.name || 'Account';
            const toAccName = tx.to_account_id ? (accounts.find(a => a.id === tx.to_account_id)?.name || 'Account') : '';

            if (isEditing) {
              return (
                <div key={tx.id} className="p-3 border border-black bg-neutral-50 space-y-3 animate-slide-down text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-neutral-500">Amount</Label>
                      <Input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="stark-input text-xs h-7"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-neutral-500">Date</Label>
                      <Input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="stark-input text-xs h-7"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[9px] uppercase font-bold text-neutral-500">Description</Label>
                      <Input
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="stark-input text-xs h-7"
                      />
                    </div>
                    {tx.type !== 'transfer' && (
                      <div className="space-y-1">
                        <Label className="text-[9px] uppercase font-bold text-neutral-500">Category</Label>
                        <Select value={editCategory} onValueChange={setEditCategory}>
                          <SelectTrigger className="stark-input text-xs h-7 py-0 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-black text-black text-xs">
                            {Object.keys(CATEGORY_LABELS).map(catKey => (
                              <SelectItem key={catKey} value={catKey}>
                                {CATEGORY_LABELS[catKey]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => handleSaveEdit(tx)}
                      className="border border-black bg-black text-white hover:bg-white hover:text-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="border border-black bg-white text-black hover:bg-neutral-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={tx.id} 
                className="p-3 border border-black flex items-center justify-between hover:bg-neutral-50 transition-all group bg-white"
              >
                <div className="flex items-center gap-3">
                  {/* Icon Block */}
                  <div className="h-8.5 w-8.5 border border-black bg-neutral-100 flex items-center justify-center shrink-0">
                    {tx.type === 'income' ? (
                      <IndianRupee className="h-4 w-4" />
                    ) : tx.type === 'expense' ? (
                      <CreditCard className="h-4.5 w-4.5" />
                    ) : (
                      <ArrowRightLeft className="h-4.5 w-4.5" />
                    )}
                  </div>
                  
                  {/* Meta items */}
                  <div>
                    <div className="flex items-center gap-1.5 leading-none mb-1">
                      <span className="font-extrabold text-xs uppercase tracking-wide">
                        {tx.type === 'transfer' ? 'Transfer' : (CATEGORY_LABELS[tx.category] || tx.category)}
                      </span>
                      <span className="text-[9px] font-bold text-neutral-400 num-mono">{tx.date}</span>
                      {tx.is_recurring && (
                        <span className="text-[8px] border border-black bg-black text-white px-1 font-black uppercase scale-90">
                          Auto
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-500 font-bold block leading-none mb-1 truncate max-w-[180px] sm:max-w-none" title={tx.description}>
                      {tx.description || 'No description'}
                    </p>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400 block leading-none">
                      {tx.type === 'transfer' ? `${srcAccName} ➔ ${toAccName}` : srcAccName}
                    </span>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-black text-xs num-mono text-black">
                    {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}₹{parseFloat(tx.amount).toFixed(2)}
                  </span>
                  
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStartEdit(tx)}
                      className="border border-black bg-white text-black p-1 shadow-sm transition-transform active:scale-95"
                      title="Edit Entry"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="border border-black bg-white text-black p-1 shadow-sm transition-transform active:scale-95"
                      title="Delete Entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
