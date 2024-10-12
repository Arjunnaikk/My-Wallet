'use client'

import React, { useState, useEffect } from "react";
import { Plus, Minus, IndianRupee, CreditCard, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";

export default function Component() {
  const [income, setIncome] = useState(() => {
    const savedIncome = localStorage.getItem('income');
    return savedIncome ? parseFloat(savedIncome) : 0;
  });
  const [transactions, setTransactions] = useState(() => {
    const savedTransactions = localStorage.getItem('transactions');
    return savedTransactions ? JSON.parse(savedTransactions) : [];
  });
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [budgetLimit, setBudgetLimit] = useState(() => {
    const savedBudgetLimit = localStorage.getItem('budgetLimit');
    return savedBudgetLimit ? parseFloat(savedBudgetLimit) : 0;
  });

  useEffect(() => {
    localStorage.setItem('income', income.toString());
  }, [income]);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('budgetLimit', budgetLimit.toString());
  }, [budgetLimit]);

  // Helper to generate a unique ID for each transaction
  const generateId = () => Math.floor(Math.random() * 100000);

  const addTransaction = (type) => {
    if (category && amount) {
      const newTransaction = {
        id: generateId(),
        category,
        amount: parseFloat(amount),
        type,
      };
      setTransactions([...transactions, newTransaction]);
      setCategory("");
      setAmount("");

      if (type === "income") {
        setIncome(prevIncome => prevIncome + parseFloat(amount));
      }
    }
  };

  const deleteTransaction = (id) => {
    const transactionToDelete = transactions.find((t) => t.id === id);
    if (!transactionToDelete) return;

    setTransactions(transactions.filter((t) => t.id !== id));

    if (transactionToDelete.type === "income") {
      setIncome(prevIncome => prevIncome - transactionToDelete.amount);
    }
  };

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const savings = income - totalExpenses;

  return (
    <>
      <Navbar />
      <IndianRupee />
      <div className="container mx-auto p-4">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {/* Add Transaction Card */}
          <Card className="invert rounded-[15px]">
            <CardHeader>
              <CardTitle>Add Transaction</CardTitle>
              <CardDescription>Record your income or expenses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  placeholder="Enter amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={() => addTransaction("income")}>
                <Plus className="mr-2 h-4 w-4" /> Add Income
              </Button>
              <Button onClick={() => addTransaction("expense")} variant="outline">
                <Minus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </CardFooter>
          </Card>

          {/* Financial Overview Card */}
          <Card className="invert rounded-[15px]">
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Your income, expenses, and savings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Income</p>
                  <p className="text-2xl font-bold text-green-600">₹{income.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                  <p className="text-2xl font-bold text-red-600">₹{totalExpenses.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">Savings</p>
                  <p className="text-2xl font-bold text-blue-600">₹{savings.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Planner Card */}
          <Card className="invert rounded-[15px]">
            <CardHeader>
              <CardTitle>Budget Planner</CardTitle>
              <CardDescription>Set and track your monthly budget</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Monthly Budget Limit</Label>
                <Input
                  id="budget"
                  placeholder="Enter budget limit"
                  type="number"
                  value={budgetLimit || ""}
                  onChange={(e) => setBudgetLimit(parseFloat(e.target.value))}
                />
              </div>
              {budgetLimit > 0 && (
                <div>
                  <p className="text-sm font-medium">Budget Status</p>
                  <progress className="w-full h-2 mt-2" value={totalExpenses} max={budgetLimit} />
                  <p className="text-sm mt-2">
                    {totalExpenses > budgetLimit
                      ? `Over budget by ₹₹{(totalExpenses - budgetLimit).toFixed(2)}`
                      : `Under budget by ₹₹{(budgetLimit - totalExpenses).toFixed(2)}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions Card */}
          <Card className="invert rounded-[15px]">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activities</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {transactions.slice(-5).reverse().map((transaction) => (
                  <li key={transaction.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center">
                      {transaction.type === "income" ? (
                        <IndianRupee className="mr-2 h-5 w-4 text-green-500" />
                      ) : (
                        <CreditCard className="mr-2 h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">{transaction.category}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-bold ₹{transaction.type === "income" ? "text-green-500" : "text-red-500"}`}>
                        ₹{transaction.amount.toFixed(2)}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => deleteTransaction(transaction.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}