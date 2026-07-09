'use client';

import React, { useRef, useState } from 'react';
import { Download, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Label } from './ui/label';

const CSVExportImport = ({ transactions, accounts, onImportTransactions }) => {
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const handleExport = () => {
    try {
      if (transactions.length === 0) {
        setStatus({ type: 'error', msg: 'No transactions to export.' });
        return;
      }

      const headers = ['Date', 'Type', 'Amount', 'Category', 'Description', 'Account'];
      const rows = transactions.map(t => {
        const accName = accounts.find(a => a.id === t.account_id)?.name || 'Default';
        return [
          t.date,
          t.type,
          t.amount,
          t.category,
          t.description || '',
          accName
        ];
      });

      const csvRows = [
        headers.join(','),
        ...rows.map(row => 
          row.map(val => {
            const escaped = val.toString().replace(/"/g, '""');
            return `"${escaped}"`;
          }).join(',')
        )
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `My-Wallet-Export-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setStatus({ type: 'success', msg: 'CSV exported successfully.' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Failed to export CSV.' });
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setStatus({ type: '', msg: '' });

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        if (lines.length <= 1) {
          throw new Error('CSV file is empty or missing headers.');
        }

        const parseCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/['"]+/g, ''));
        
        const dateIdx = headers.indexOf('date');
        const typeIdx = headers.indexOf('type');
        const amountIdx = headers.indexOf('amount');
        const categoryIdx = headers.indexOf('category');
        const descIdx = headers.indexOf('description');
        const accountIdx = headers.indexOf('account');

        if (dateIdx === -1 || typeIdx === -1 || amountIdx === -1 || categoryIdx === -1) {
          throw new Error('CSV missing required headers. Need: Date, Type, Amount, Category');
        }

        const importedTransactions = [];

        for (let i = 1; i < lines.length; i++) {
          const columns = parseCSVLine(lines[i]).map(c => c.replace(/^["']|["']$/g, ''));
          if (columns.length < 4) continue;

          const amountVal = parseFloat(columns[amountIdx]);
          if (isNaN(amountVal)) continue;

          const txType = columns[typeIdx].toLowerCase();
          if (!['income', 'expense', 'transfer'].includes(txType)) continue;

          const accName = accountIdx !== -1 ? columns[accountIdx] : '';
          let matchedAccId = accounts[0]?.id;

          if (accName) {
            const foundAcc = accounts.find(a => a.name.toLowerCase() === accName.toLowerCase());
            if (foundAcc) matchedAccId = foundAcc.id;
          }

          importedTransactions.push({
            date: columns[dateIdx] || new Date().toISOString().split('T')[0],
            type: txType,
            amount: amountVal,
            category: columns[categoryIdx] || 'other',
            description: descIdx !== -1 ? columns[descIdx] : '',
            account_id: matchedAccId,
            to_account_id: null
          });
        }

        if (importedTransactions.length === 0) {
          throw new Error('No valid transactions parsed from CSV.');
        }

        await onImportTransactions(importedTransactions);
        setStatus({ type: 'success', msg: `Successfully imported ${importedTransactions.length} transactions!` });
      } catch (err) {
        setStatus({ type: 'error', msg: err.message || 'Error parsing CSV.' });
      } finally {
        setImporting(false);
        e.target.value = null;
      }
    };

    reader.onerror = () => {
      setStatus({ type: 'error', msg: 'Failed to read file.' });
      setImporting(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="stark-card-static bg-white border border-black p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] space-y-4">
      <div className="flex items-center justify-between border-b border-black pb-2">
        <h4 className="font-black text-xs uppercase tracking-wider">CSV Data Backup</h4>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleExport}
          className="flex-1 stark-btn-secondary py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
        >
          <Download className="h-3.5 w-3.5" /> Export Ledger
        </button>

        <div className="flex-1 relative">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
            id="csv-file-import"
            disabled={importing}
          />
          <Label
            htmlFor="csv-file-import"
            className="w-full stark-btn-secondary py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer h-full text-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          >
            {importing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Importing...
              </>
            ) : (
              <>
                <Upload className="h-3.5 w-3.5" /> Import Ledger
              </>
            )}
          </Label>
        </div>
      </div>

      {status.msg && (
        <div className={`p-2 border border-black text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${
          status.type === 'success' ? 'bg-neutral-50 text-black' : 'bg-neutral-50 text-neutral-500'
        }`}>
          {status.type === 'success' ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>{status.msg}</span>
        </div>
      )}
    </div>
  );
};

export default CSVExportImport;
