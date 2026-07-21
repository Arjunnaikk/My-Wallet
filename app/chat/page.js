'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/lib/WalletContext';
import { Sparkles, Send, Loader2, Bot, User, HelpCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MarkdownMessage from '@/components/MarkdownMessage';

const SUGGESTIONS = [
  "How much did I spend on food this month?",
  "Am I under my transport budget?",
  "Show me my income vs expenses summary",
  "Give me 3 saving tips based on my history"
];

export default function ChatPage() {
  const { transactions, budgets, accounts } = useWallet();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your My Wallet AI Assistant. I have analyzed your current accounts, category budgets, and transaction history. Ask me questions like: 'How much did I spend this week?' or 'What is my budget compliance?'"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const userText = textToSend || input;
    if (!userText.trim()) return;

    if (!textToSend) setInput('');

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/wallet-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          transactions,
          budgets,
          accounts
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get AI response');

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, I encountered an error: ${err.message || 'Unknown error'}. Please verify that GEMINI_API_KEY is configured in your .env.local file.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-3 pt-4 pb-36 sm:p-6 max-w-3xl space-y-5 sm:space-y-6 flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
      
      {/* Title Header */}
      <div className="border border-black bg-white p-4 flex items-center gap-2 text-xs font-black uppercase tracking-wider shrink-0">
        <Sparkles className="h-4 w-4" />
        <span>AI Financial Assistant Workspace</span>
      </div>

      {/* Main Conversation Container */}
      <div className="flex-1 border border-black dark:border-white bg-white dark:bg-black flex flex-col overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
        
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${
                msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div className={`h-8 w-8 shrink-0 flex items-center justify-center border border-black dark:border-white font-bold text-xs ${
                msg.role === 'user' 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'bg-neutral-100 text-black dark:bg-neutral-900 dark:text-white'
              }`}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              
              <div className={`p-3.5 sm:p-4 border border-black dark:border-white text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-black dark:bg-white text-white dark:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] font-medium'
                  : 'bg-neutral-50 dark:bg-neutral-900/90 text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] flex-1 overflow-hidden'
              }`}>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-line text-xs font-semibold">{msg.content}</p>
                ) : (
                  <MarkdownMessage content={msg.content} />
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[85%] animate-pulse">
              <div className="h-8 w-8 border border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-black dark:text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-4 border border-black dark:border-white bg-neutral-50 dark:bg-neutral-900 text-black dark:text-white text-xs flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-black dark:text-white" />
                <span className="font-bold">Analyzing ledger patterns with Groq AI...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {messages.length === 1 && (
          <div className="px-4 py-3 bg-neutral-50 border-t border-black space-y-2 shrink-0">
            <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> Suggested queries
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s)}
                  className="text-[10px] font-bold text-neutral-700 bg-white border border-black hover:bg-black hover:text-white px-2.5 py-1.5 transition-all text-left flex items-center gap-1"
                >
                  {s} <ArrowRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <div className="p-4 bg-white border-t border-black flex gap-3 shrink-0">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
            placeholder="Type your question about transactions, balances, or budgets..."
            className="stark-input text-xs py-2"
            disabled={loading}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={loading || !input.trim()}
            className="stark-btn px-5"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

      </div>

    </div>
  );
}
