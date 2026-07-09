'use client';

import React, { useState } from 'react';
import { CalendarClock, Plus, Trash2, CheckSquare, BellRing } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const RecurringManager = ({ accounts, recurringRules, onSaveRule, onDeleteRule, onApplyRecurringTransaction }) => {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('utilities');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const handleAddRule = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;
    if (!accountId) return;

    onSaveRule({
      type,
      amount: parseFloat(amount),
      category,
      account_id: accountId,
      frequency,
      next_due_date: nextDueDate,
      description: description || `${frequency} recurring ${category}`,
      is_active: true
    });

    setAmount('');
    setDescription('');
    setNextDueDate(new Date().toISOString().split('T')[0]);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const dueRules = recurringRules.filter(rule => rule.is_active && rule.next_due_date <= todayStr);

  const handleApplyDue = (rule) => {
    const currentDueDate = new Date(rule.next_due_date);
    let nextDate = new Date(rule.next_due_date);

    if (rule.frequency === 'daily') {
      nextDate.setDate(currentDueDate.getDate() + 1);
    } else if (rule.frequency === 'weekly') {
      nextDate.setDate(currentDueDate.getDate() + 7);
    } else if (rule.frequency === 'monthly') {
      nextDate.setMonth(currentDueDate.getMonth() + 1);
    } else if (rule.frequency === 'yearly') {
      nextDate.setFullYear(currentDueDate.getFullYear() + 1);
    }

    const nextDueDateStr = nextDate.toISOString().split('T')[0];
    onApplyRecurringTransaction(rule, nextDueDateStr);
  };

  return (
    <div className="stark-card-static bg-white border border-black p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black pb-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4.5 w-4.5" />
          <h3 className="font-black text-xs uppercase tracking-wider">Subscriptions & Bills</h3>
        </div>
        {dueRules.length > 0 && (
          <span className="bg-black text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border border-black animate-pulse flex items-center gap-1">
            <BellRing className="h-3 w-3 text-white" /> Action Required
          </span>
        )}
      </div>

      {/* Due Alerts Banners */}
      {dueRules.length > 0 && (
        <div className="space-y-2">
          {dueRules.map(rule => (
            <div key={rule.id} className="p-3 border border-black bg-black text-white flex justify-between items-center gap-3 animate-slide-down">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wide">
                  Schedule Due
                </p>
                <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                  {rule.description} • <span className="text-white num-mono font-black">₹{parseFloat(rule.amount).toFixed(0)}</span>
                </p>
              </div>
              <button
                onClick={() => handleApplyDue(rule)}
                className="border border-white bg-white text-black hover:bg-black hover:text-white px-2 py-1 text-[9px] font-black uppercase tracking-wider transition-colors"
              >
                Log Payment
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Create rule Form */}
      <form onSubmit={handleAddRule} className="space-y-3.5 p-3.5 border border-black bg-neutral-50">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="rec-type" className="text-[9px] font-bold uppercase text-neutral-500">Type</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger id="rec-type" className="stark-input text-xs h-8 bg-white text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-black text-black text-xs">
                <SelectItem value="expense">Expense (Bill)</SelectItem>
                <SelectItem value="income">Income (Salary)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="rec-amount" className="text-[9px] font-bold uppercase text-neutral-500">Amount (₹)</Label>
            <Input
              id="rec-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="stark-input text-xs h-8"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="rec-account" className="text-[9px] font-bold uppercase text-neutral-500">Wallet</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger id="rec-account" className="stark-input text-xs h-8 bg-white text-black">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-white border-black text-black text-xs">
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="rec-frequency" className="text-[9px] font-bold uppercase text-neutral-500">Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency} required>
              <SelectTrigger id="rec-frequency" className="stark-input text-xs h-8 bg-white text-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-black text-black text-xs">
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="rec-date" className="text-[9px] font-bold uppercase text-neutral-500">Next Due Date</Label>
            <Input
              id="rec-date"
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="stark-input text-xs h-8"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="rec-desc" className="text-[9px] font-bold uppercase text-neutral-500">Label Note</Label>
            <Input
              id="rec-desc"
              placeholder="e.g. Netflix, Gym, Room Rent"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="stark-input text-xs h-8"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full stark-btn py-1.5 text-xs font-black shadow-sm"
        >
          Add Schedule
        </button>
      </form>

      {/* Rules list */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {recurringRules.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-4 uppercase font-bold tracking-widest">No schedules registered</p>
        ) : (
          recurringRules.map(rule => (
            <div key={rule.id} className="p-3 border border-black flex items-center justify-between group bg-white">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide leading-none mb-1">{rule.description}</p>
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider num-mono">
                  ₹{parseFloat(rule.amount).toFixed(0)} • {rule.frequency} • Due: {rule.next_due_date}
                </p>
              </div>
              <button
                onClick={() => onDeleteRule(rule.id)}
                className="text-neutral-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove Schedule"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecurringManager;
