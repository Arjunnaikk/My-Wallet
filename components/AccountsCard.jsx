'use client';

import React, { useState } from 'react';
import { Landmark, Coins, CreditCard, Wallet, Plus, Trash2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const ACCOUNT_ICONS = {
  cash: Coins,
  bank: Landmark,
  credit_card: CreditCard,
  other: Wallet
};

const AccountsCard = ({ accounts, onSaveAccount, onDeleteAccount }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('bank');
  const [balance, setBalance] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveAccount({
      name: name.trim(),
      type,
      balance: balance ? parseFloat(balance) : 0,
      color: '#000000' // Hardcode black for color variables in DB
    });

    setName('');
    setBalance('');
    setShowAddForm(false);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this account? All associated transactions will lose their connection.")) {
      onDeleteAccount(id);
    }
  };

  return (
    <div className="stark-card-static bg-white border border-black p-5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4.5 w-4.5" />
          <h3 className="font-black text-xs uppercase tracking-wider">My Wallets & Accounts</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="border border-black p-1 hover:bg-black hover:text-white transition-colors"
          title="Add custom account"
        >
          {showAddForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        </button>
      </div>

      {/* Add Custom Account Inline Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-3 border border-black bg-neutral-50 space-y-3 animate-slide-down">
          <div className="space-y-1">
            <Label htmlFor="acc-name" className="text-[10px] uppercase font-bold text-neutral-500">Account Name</Label>
            <Input
              id="acc-name"
              placeholder="e.g. Bank of Baroda, Cash Box"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="stark-input text-xs h-8"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="acc-type" className="text-[10px] uppercase font-bold text-neutral-500">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="acc-type" className="stark-input h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-black text-black text-xs">
                  <SelectItem value="bank">Bank Account</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="other">Digital Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="acc-balance" className="text-[10px] uppercase font-bold text-neutral-500">Starting Balance (₹)</Label>
              <Input
                id="acc-balance"
                type="number"
                placeholder="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="stark-input h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-grow stark-btn text-xs py-1 h-8"
            >
              Add Wallet
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-grow stark-btn-secondary text-xs py-1 h-8"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Accounts list */}
      <div className="space-y-2.5">
        {accounts.map(acc => {
          const Icon = ACCOUNT_ICONS[acc.type] || Wallet;
          const balanceNum = parseFloat(acc.balance);
          
          return (
            <div 
              key={acc.id} 
              className="p-3 border border-black flex items-center justify-between hover:bg-neutral-50 transition-all relative group"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 border border-black bg-neutral-100 flex items-center justify-center text-black">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <span className="font-extrabold text-xs uppercase tracking-wide block leading-none mb-1">
                    {acc.name}
                  </span>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block leading-none">
                    {acc.type} account
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-black text-xs num-mono text-black">
                  ₹{balanceNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                
                {/* Only show delete button for non-default accounts */}
                {!['acc-cash', 'acc-bank', 'acc-card'].includes(acc.id) && (
                  <button
                    onClick={(e) => handleDelete(acc.id, e)}
                    className="text-neutral-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Account"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AccountsCard;
