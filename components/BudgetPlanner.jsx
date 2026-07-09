'use client';

import React, { useState } from 'react';
import { Target, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const CATEGORIES = [
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transport / Commute' },
  { value: 'utilities', label: 'Utilities & Bills' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health & Medical' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other / Misc' }
];

const CATEGORY_LABELS = CATEGORIES.reduce((acc, curr) => {
  acc[curr.value] = curr.label;
  return acc;
}, {});

const BudgetPlanner = ({ budgets, transactions, onSaveBudget, onDeleteBudget }) => {
  const [category, setCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editLimit, setEditLimit] = useState('');

  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const categoryExpenses = expenseTransactions.reduce((acc, t) => {
    const cat = t.category || 'other';
    acc[cat] = (acc[cat] || 0) + parseFloat(t.amount);
    return acc;
  }, {});

  const handleAddBudget = (e) => {
    e.preventDefault();
    if (!category || !limitAmount || isNaN(limitAmount) || parseFloat(limitAmount) <= 0) return;

    onSaveBudget({
      category,
      limit_amount: parseFloat(limitAmount),
      period: 'monthly'
    });

    setCategory('');
    setLimitAmount('');
  };

  const handleStartEdit = (bgt) => {
    setEditingId(bgt.id);
    setEditLimit(bgt.limit_amount.toString());
  };

  const handleSaveEdit = (bgt) => {
    if (!editLimit || isNaN(editLimit) || parseFloat(editLimit) <= 0) return;
    onSaveBudget({
      ...bgt,
      limit_amount: parseFloat(editLimit)
    });
    setEditingId(null);
  };

  return (
    <div className="stark-card-static bg-white border border-black p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-4">
      
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-black pb-3">
        <Target className="h-4.5 w-4.5" />
        <h3 className="font-black text-xs uppercase tracking-wider">Category Budgets</h3>
      </div>

      {/* Input controls */}
      <form onSubmit={handleAddBudget} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-3 bg-neutral-50 border border-black">
        <div className="space-y-1">
          <Label htmlFor="bgt-category" className="text-[9px] uppercase font-bold text-neutral-500">Category</Label>
          <Select value={category} onValueChange={setCategory} required>
            <SelectTrigger id="bgt-category" className="stark-input h-8 text-xs bg-white text-black">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-white border-black text-black text-xs">
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="bgt-limit" className="text-[9px] uppercase font-bold text-neutral-500">Limit (₹)</Label>
          <Input
            id="bgt-limit"
            type="number"
            placeholder="0"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            className="stark-input h-8 text-xs"
            required
          />
        </div>

        <button
          type="submit"
          className="stark-btn text-xs h-8 flex items-center justify-center gap-1 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" /> Set Budget
        </button>
      </form>

      {/* Budgets list */}
      <div className="space-y-3 pt-2">
        {budgets.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-4 uppercase font-bold tracking-widest">No budgets defined</p>
        ) : (
          budgets.map(bgt => {
            const actual = categoryExpenses[bgt.category] || 0;
            const limit = parseFloat(bgt.limit_amount);
            const percent = limit > 0 ? (actual / limit) * 100 : 0;
            const isOver = actual > limit;

            return (
              <div key={bgt.id} className="space-y-1 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-xs uppercase tracking-wide">
                    {CATEGORY_LABELS[bgt.category] || bgt.category}
                  </span>
                  
                  {editingId === bgt.id ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        value={editLimit}
                        onChange={(e) => setEditLimit(e.target.value)}
                        className="w-16 h-6 stark-input text-[10px] text-center"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSaveEdit(bgt)}
                        className="text-black hover:text-neutral-500"
                        title="Save"
                      >
                        <Check className="h-4.5 w-4.5" />
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="text-neutral-400 hover:text-black"
                        title="Cancel"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className="font-black text-xs num-mono">₹{actual.toFixed(0)}</span>
                        <span className="text-[10px] text-neutral-400 font-bold num-mono"> / ₹{limit.toFixed(0)}</span>
                      </div>
                      <div className="flex gap-1.5 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleStartEdit(bgt)}
                          className="text-neutral-400 hover:text-black"
                          title="Edit Limit"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={() => onDeleteBudget(bgt.id)}
                          className="text-neutral-400 hover:text-black"
                          title="Remove"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar container */}
                <div className="w-full h-2.5 border border-black dark:border-white bg-neutral-100 dark:bg-neutral-800">
                  <div 
                    className="h-full bg-black dark:bg-white transition-all duration-300"
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider">
                  <span className={isOver ? 'text-black font-black' : 'text-neutral-500'}>
                    {percent.toFixed(0)}% Used {isOver && '[OVER BUDGET]'}
                  </span>
                  <span className="text-neutral-400 num-mono">
                    {isOver 
                      ? `Over by ₹${(actual - limit).toFixed(0)}` 
                      : `₹${(limit - actual).toFixed(0)} left`
                    }
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BudgetPlanner;
