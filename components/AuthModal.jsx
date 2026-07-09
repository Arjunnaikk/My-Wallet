'use client';

import React, { useState } from 'react';
import { Mail, Lock, X, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { isSupabaseConfigured } from '@/lib/supabase';

const AuthModal = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isSupabaseConfigured) {
      setErrorMsg('Database is not configured. Please set environment variables in your .env.local file.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // 1. Call registration endpoint
        const regRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const regData = await regRes.json();
        
        if (!regRes.ok) {
          throw new Error(regData.error || 'Registration failed');
        }

        setSuccessMsg('Account created successfully! Logging you in...');
        
        // 2. Automatically log in after registration
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        setSuccessMsg('Logged in successfully.');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        // Verify credentials with NextAuth CredentialsProvider
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password
        });

        if (result?.error) {
          throw new Error(result.error);
        }

        setSuccessMsg('Logged in successfully.');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    try {
      await signIn('google');
    } catch (err) {
      setErrorMsg(err.message || 'Google Auth failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[1px]">
      <div className="relative w-full max-w-sm overflow-hidden bg-white border border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-fade-in text-black">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-black transition-colors border border-transparent hover:border-black p-0.5"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 border-b border-black pb-4">
          <h2 className="text-sm font-black uppercase tracking-widest">
            {isSignUp ? 'Create Ledger Profile' : 'Access Account'}
          </h2>
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1">
            {isSignUp ? 'Sync your transactions to cloud' : 'Access your secure wallet profiles'}
          </p>
        </div>

        {/* Warning if Supabase is offline */}
        {!isSupabaseConfigured && (
          <div className="mb-4 p-3 border border-black bg-neutral-50 text-[10px] font-bold uppercase tracking-wider flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-black" />
            <div>
              <span>Demo Mode:</span> Supabase connection keys missing. AI and CSV features work locally.
            </div>
          </div>
        )}

        {/* Status updates */}
        {errorMsg && (
          <div className="mb-4 p-2.5 border border-black bg-neutral-50 text-[9px] font-bold uppercase tracking-wider text-neutral-500">
            * {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-2.5 border border-black bg-neutral-50 text-[9px] font-bold uppercase tracking-wider text-black">
            * {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-3.5">
          <div className="space-y-1">
            <Label htmlFor="auth-email" className="text-[9px] uppercase font-bold text-neutral-500">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <Input
                id="auth-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 stark-input text-xs h-8"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="auth-password" className="text-[9px] uppercase font-bold text-neutral-500">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <Input
                id="auth-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 stark-input text-xs h-8"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full stark-btn py-2 text-xs font-black shadow-sm mt-3 flex items-center justify-center gap-1.5"
            disabled={loading}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : isSignUp ? (
              'Create Profile'
            ) : (
              'Verify & Login'
            )}
          </button>
        </form>

        {/* Google Authentication */}
        {isSupabaseConfigured && (
          <>
            <div className="relative my-4 text-center">
              <hr className="border-neutral-200" />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2.5 text-[8px] font-bold uppercase tracking-wider text-neutral-400">
                Or Continue With
              </span>
            </div>

            <button 
              type="button" 
              onClick={handleGoogleSignIn}
              className="w-full stark-btn-secondary py-1.5 text-xs font-black flex items-center justify-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            >
              Sign In with Google
            </button>
          </>
        )}

        {/* Switch Link */}
        <div className="text-center mt-5">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[10px] text-black font-extrabold uppercase tracking-wide underline decoration-dotted hover:decoration-solid"
          >
            {isSignUp ? 'Already have account? Login' : "Need an account? Sign Up"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
