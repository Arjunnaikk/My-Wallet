'use client';

import React, { useState } from 'react';
import { Plus, Minus, ArrowRightLeft, Sparkles, Upload, Loader2, Calendar } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const CATEGORIES = [
  { value: 'salary', label: 'Salary' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'transport', label: 'Transport / Commute' },
  { value: 'utilities', label: 'Utilities & Bills' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health', label: 'Health & Medical' },
  { value: 'travel', label: 'Travel' },
  { value: 'other', label: 'Other / Misc' }
];

const TransactionForm = ({ accounts, onAddTransaction, selectedMonth }) => {
  const [activeTab, setActiveTab] = useState('expense'); // 'expense' | 'income' | 'transfer'
  
  // Form fields
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  
  // Recurring state
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('monthly');

  // AI assistants state
  const [nlpText, setNlpText] = useState('');
  const [nlpLoading, setNlpLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setAccountId(accounts[0]?.id || '');
    setToAccountId('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setIsRecurring(false);
    setFrequency('monthly');
    setAiError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;
    if (!accountId) return;
    if (activeTab !== 'transfer' && !category) return;
    if (activeTab === 'transfer' && !toAccountId) return;
    if (activeTab === 'transfer' && accountId === toAccountId) return;

    const tx = {
      type: activeTab,
      amount: parseFloat(amount),
      category: activeTab === 'transfer' ? 'transfer' : category,
      account_id: accountId,
      to_account_id: activeTab === 'transfer' ? toAccountId : null,
      date,
      description: description || (activeTab === 'transfer' ? 'Funds Transfer' : category),
      is_recurring: isRecurring,
      frequency: isRecurring ? frequency : null
    };

    onAddTransaction(tx);
    resetForm();
  };

  const handleNlpParse = async () => {
    if (!nlpText.trim()) return;
    setNlpLoading(true);
    setAiError('');

    try {
      const res = await fetch('/api/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nlpText })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse text');

      setActiveTab(data.type || 'expense');
      setAmount(data.amount?.toString() || '');
      setCategory(data.category || '');
      setDescription(data.description || '');
      if (data.date) setDate(data.date);

      if (data.source_account) {
        const found = accounts.find(a => 
          a.name.toLowerCase().includes(data.source_account.toLowerCase()) ||
          a.type.toLowerCase().includes(data.source_account.toLowerCase())
        );
        if (found) setAccountId(found.id);
      }
      
      if (data.destination_account && data.type === 'transfer') {
        const found = accounts.find(a => 
          a.name.toLowerCase().includes(data.destination_account.toLowerCase()) ||
          a.type.toLowerCase().includes(data.destination_account.toLowerCase())
        );
        if (found) setToAccountId(found.id);
      }

      if (data.is_fallback) {
        setAiError('Quota exceeded: parsed using offline local fallback.');
      } else {
        setAiError('');
      }
      setNlpText('');
    } catch (err) {
      setAiError(err.message || 'AI parsing error');
    } finally {
      setNlpLoading(false);
    }
  };

  const handleReceiptUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setOcrLoading(true);
    setAiError('');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = reader.result;
        const res = await fetch('/api/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to scan receipt');

        setActiveTab('expense');
        setAmount(data.amount?.toString() || '');
        setCategory(data.category || 'other');
        setDescription(data.description || 'Receipt Purchase');
        if (data.date) setDate(data.date);
        
        if (data.items && data.items.length > 0) {
          setDescription(`${data.description || 'Purchase'} (${data.items.slice(0,3).join(', ')})`);
        }
      } catch (err) {
        setAiError(err.message || 'Error processing receipt');
      } finally {
        setOcrLoading(false);
        e.target.value = null;
      }
    };
    reader.onerror = () => {
      setAiError('FileReader failed to read the file.');
      setOcrLoading(false);
    };
  };

  return (
    <div className="stark-card-static bg-white border border-black p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black pb-3">
        <div>
          <h3 className="font-black text-xs uppercase tracking-wider">Add Transaction</h3>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">Ledger Entry</span>
        </div>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            id="receipt-file"
            className="hidden"
            onChange={handleReceiptUpload}
            disabled={ocrLoading}
          />
          <Label 
            htmlFor="receipt-file"
            className="border border-black px-2.5 py-1.5 bg-white text-black hover:bg-black hover:text-white transition-all text-[10px] font-extrabold uppercase tracking-wider cursor-pointer flex items-center gap-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            {ocrLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Scanning...
              </>
            ) : (
              <>
                <Upload className="h-3 w-3" /> OCR Scan
              </>
            )}
          </Label>
        </div>
      </div>

      {/* AI Parsing Quick-Input */}
      <div className="p-3 border border-black bg-neutral-50 space-y-2 relative">
        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-black">
          <Sparkles className="h-3.5 w-3.5" /> Quick AI Add
        </div>
        <div className="flex gap-2">
          <Input
            value={nlpText}
            onChange={(e) => setNlpText(e.target.value)}
            placeholder="spent 250 on pizza from cash yesterday"
            className="stark-input text-xs py-1.5 h-8"
            onKeyDown={(e) => e.key === 'Enter' && handleNlpParse()}
          />
          <button
            onClick={handleNlpParse}
            disabled={nlpLoading || !nlpText.trim()}
            className="stark-btn text-xs px-3 h-8 shrink-0 flex items-center justify-center"
          >
            {nlpLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Parse'}
          </button>
        </div>
        {aiError && (
          <div className="text-[9px] font-semibold text-neutral-500">
            * {aiError}
          </div>
        )}
      </div>

      <div className="relative my-3 flex items-center justify-center">
        <hr className="w-full border-neutral-200" />
        <span className="absolute bg-white px-3 text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
          Manual Form
        </span>
      </div>

      {/* Switcher Tab Buttons */}
      <div className="grid grid-cols-3 gap-1 border border-black p-1 bg-neutral-100">
        <button
          type="button"
          onClick={() => { setActiveTab('expense'); setCategory('food'); }}
          className={`py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'expense' 
              ? 'bg-black text-white' 
              : 'text-neutral-500 hover:text-black hover:bg-neutral-50'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('income'); setCategory('salary'); }}
          className={`py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'income' 
              ? 'bg-black text-white' 
              : 'text-neutral-500 hover:text-black hover:bg-neutral-50'
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('transfer'); setCategory('transfer'); }}
          className={`py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'transfer' 
              ? 'bg-black text-white' 
              : 'text-neutral-500 hover:text-black hover:bg-neutral-50'
          }`}
        >
          Transfer
        </button>
      </div>

      {/* Manual Input Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          {/* AMOUNT */}
          <div className="space-y-1">
            <Label htmlFor="amount" className="text-[10px] font-bold uppercase text-neutral-500">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="stark-input font-bold text-sm h-8"
              required
            />
          </div>

          {/* DATE */}
          <div className="space-y-1">
            <Label htmlFor="date" className="text-[10px] font-bold uppercase text-neutral-500">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="stark-input text-xs h-8"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* ACCOUNT SELECT */}
          <div className="space-y-1">
            <Label htmlFor="src-account" className="text-[10px] font-bold uppercase text-neutral-500 font-sans">
              {activeTab === 'transfer' ? 'From Wallet' : 'Wallet'}
            </Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger id="src-account" className="stark-input h-8 text-xs bg-white text-black">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="bg-white border-black text-black text-xs">
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name} (₹{parseFloat(acc.balance).toFixed(0)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* TARGET OR CATEGORY */}
          {activeTab === 'transfer' ? (
            <div className="space-y-1">
              <Label htmlFor="to-account" className="text-[10px] font-bold uppercase text-neutral-500">To Wallet</Label>
              <Select value={toAccountId} onValueChange={setToAccountId} required>
                <SelectTrigger id="to-account" className="stark-input h-8 text-xs bg-white text-black">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent className="bg-white border-black text-black text-xs">
                  {accounts
                    .filter(acc => acc.id !== accountId)
                    .map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name} (₹{parseFloat(acc.balance).toFixed(0)})
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="category-select" className="text-[10px] font-bold uppercase text-neutral-500">Category</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category-select" className="stark-input h-8 text-xs bg-white text-black">
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
          )}
        </div>

        {/* DESCRIPTION */}
        <div className="space-y-1">
          <Label htmlFor="description" className="text-[10px] font-bold uppercase text-neutral-500">Description / Merchant</Label>
          <Input
            id="description"
            placeholder={activeTab === 'transfer' ? 'Funds Transfer' : 'Grocery store, taxi ride, Netflix'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="stark-input text-xs h-8"
          />
        </div>

        {/* RECURRING TOGGLE */}
        {activeTab !== 'transfer' && (
          <div className="pt-1 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-3.5 w-3.5 rounded-none border-black text-black focus:ring-black"
              />
              <Label htmlFor="is-recurring" className="text-[10px] uppercase font-bold cursor-pointer text-neutral-600">
                Setup as recurring bill schedule
              </Label>
            </div>

            {isRecurring && (
              <div className="p-3 border border-black bg-neutral-50 flex items-center justify-between gap-4 animate-slide-down">
                <span className="text-[10px] font-bold uppercase text-neutral-500">Interval frequency:</span>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="w-[120px] stark-input text-xs h-7">
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
            )}
          </div>
        )}

        <button 
          type="submit" 
          className="w-full stark-btn py-2 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-1"
        >
          Save Transaction
        </button>
      </form>
    </div>
  );
};

export default TransactionForm;
