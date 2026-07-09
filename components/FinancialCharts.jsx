'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { PieChart as PieIcon, TrendingUp, BarChart3 } from 'lucide-react';
import { useWallet } from '@/lib/WalletContext';

const CATEGORY_LABELS = {
  salary: 'Salary',
  food: 'Food & Dining',
  transport: 'Transport',
  utilities: 'Utilities',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  health: 'Health & Medical',
  travel: 'Travel',
  other: 'Other'
};

const FinancialCharts = ({ transactions }) => {
  const [activeChart, setActiveChart] = useState('category');
  const { theme } = useWallet();

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const monoColors = isDark 
    ? [
        '#ffffff', // Pure White
        '#e5e5e5', // Soft Gray
        '#d4d4d4', // Light Gray
        '#a3a3a3', // Medium Gray
        '#737373', // Gray
        '#525252', // Dark Gray
        '#404040', // Charcoal
        '#262626'  // Stark Charcoal
      ]
    : [
        '#000000', // Pure Black
        '#262626', // Stark Charcoal
        '#404040', // Charcoal
        '#525252', // Dark Gray
        '#737373', // Gray
        '#a3a3a3', // Medium Gray
        '#d4d4d4', // Light Gray
        '#e5e5e5'  // Soft Gray
      ];

  // --- DATA PREPARATION ---
  
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const categorySums = expenseTransactions.reduce((acc, t) => {
    const cat = t.category || 'other';
    acc[cat] = (acc[cat] || 0) + parseFloat(t.amount);
    return acc;
  }, {});

  const categoryData = Object.keys(categorySums).map((cat, idx) => ({
    name: CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1),
    value: categorySums[cat],
    color: monoColors[idx % monoColors.length]
  })).sort((a, b) => b.value - a.value);

  const dailySpend = expenseTransactions.reduce((acc, t) => {
    const dateStr = t.date;
    acc[dateStr] = (acc[dateStr] || 0) + parseFloat(t.amount);
    return acc;
  }, {});

  const sortedDates = Object.keys(dailySpend).sort();
  
  let runningTotal = 0;
  const trendData = sortedDates.map(date => {
    runningTotal += dailySpend[date];
    const day = date.split('-')[2];
    return {
      dateLabel: `${day}`,
      fullDate: date,
      amount: dailySpend[date],
      cumulative: runningTotal
    };
  });

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const totalExpense = expenseTransactions
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const cashFlowData = [
    {
      name: 'Monthly Cash Flow',
      Income: totalIncome,
      Expense: totalExpense
    }
  ];

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-black border border-black dark:border-white p-3 text-[10px] font-bold uppercase tracking-wider text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
          <p className="border-b border-black dark:border-white pb-1 mb-1">{payload[0].name || label}</p>
          <p className="num-mono">₹{parseFloat(payload[0].value).toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  const CustomTrendTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-black border border-black dark:border-white p-3 text-[10px] font-bold uppercase tracking-wider text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
          <p className="border-b border-black dark:border-white pb-1 mb-1">{data.fullDate}</p>
          <p className="num-mono text-neutral-500 dark:text-neutral-400">Daily: ₹{parseFloat(data.amount).toFixed(2)}</p>
          <p className="num-mono font-black">Total: ₹{parseFloat(data.cumulative).toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="stark-card-static p-5 flex flex-col h-full min-h-[380px]">
      
      {/* Header tabs */}
      <div className="flex items-center justify-between border-b border-black dark:border-white pb-3 mb-4">
        <h3 className="font-black text-xs uppercase tracking-wider">Analytics Reports</h3>
        <div className="flex border border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 p-0.5">
          <button
            onClick={() => setActiveChart('category')}
            className={`p-1.5 transition-all ${
              activeChart === 'category'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
            title="Spend by Category"
          >
            <PieIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveChart('trend')}
            className={`p-1.5 transition-all ${
              activeChart === 'trend'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
            title="Spending Trend"
          >
            <TrendingUp className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveChart('flow')}
            className={`p-1.5 transition-all ${
              activeChart === 'flow'
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white'
            }`}
            title="Income vs Expenses"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 flex items-center justify-center min-h-[260px]">
        {activeChart === 'category' && (
          categoryData.length > 0 ? (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? '#0a0a0a' : '#ffffff'} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-2">
                {categoryData.slice(0, 5).map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-900 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 border border-black dark:border-white" style={{ backgroundColor: entry.color }}></span>
                      <span className="text-neutral-500 dark:text-neutral-400">{entry.name}</span>
                    </div>
                    <span className="font-extrabold text-black dark:text-white num-mono">₹{entry.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300 dark:text-neutral-700">No expense records</p>
            </div>
          )
        )}

        {activeChart === 'trend' && (
          trendData.length > 0 ? (
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#262626' : '#e5e5e5'} />
                  <XAxis 
                    dataKey="dateLabel" 
                    stroke={isDark ? '#ffffff' : '#000000'} 
                    fontSize={9} 
                    fontWeight="bold"
                    tickLine={true}
                  />
                  <YAxis 
                    stroke={isDark ? '#ffffff' : '#000000'} 
                    fontSize={9} 
                    fontWeight="bold"
                    tickLine={true}
                  />
                  <Tooltip content={<CustomTrendTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke={isDark ? '#ffffff' : '#000000'} 
                    strokeWidth={2}
                    fill={isDark ? '#262626' : '#e5e5e5'}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 text-center mt-2">Cumulative daily expense (Day of month)</p>
            </div>
          ) : (
            <div className="text-center py-12 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300 dark:text-neutral-700">No spending data</p>
            </div>
          )
        )}

        {activeChart === 'flow' && (
          (totalIncome > 0 || totalExpense > 0) ? (
            <div className="w-full h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#262626' : '#e5e5e5'} />
                  <XAxis dataKey="name" stroke={isDark ? '#ffffff' : '#000000'} fontSize={9} fontWeight="bold" tickLine={true} />
                  <YAxis stroke={isDark ? '#ffffff' : '#000000'} fontSize={9} fontWeight="bold" tickLine={true} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconSize={10} 
                    wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px' }} 
                  />
                  <Bar dataKey="Income" fill={isDark ? '#ffffff' : '#000000'} radius={[0, 0, 0, 0]} maxBarSize={45} stroke={isDark ? '#ffffff' : '#000000'} strokeWidth={1} />
                  <Bar dataKey="Expense" fill={isDark ? '#525252' : '#a3a3a3'} radius={[0, 0, 0, 0]} maxBarSize={45} stroke={isDark ? '#ffffff' : '#000000'} strokeWidth={1} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300 dark:text-neutral-700">No cash flow logs</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FinancialCharts;
