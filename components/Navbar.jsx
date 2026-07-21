'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Wallet, LogOut, Sun, Moon, Laptop, User as UserIcon, ChevronDown,
  LayoutDashboard, ReceiptText, Target, CalendarClock, Sparkles
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useWallet } from '@/lib/WalletContext';

const Navbar = ({ user, onLoginClick, onLogout, syncStatus }) => {
  const pathname = usePathname();
  const { theme, setTheme } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [menuOpen]);

  const links = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/transactions', label: 'Ledger', icon: ReceiptText },
    { href: '/budgets', label: 'Budgets', icon: Target },
    { href: '/subscriptions', label: 'Bills', icon: CalendarClock },
    { href: '/chat', label: 'AI Chat', icon: Sparkles }
  ];

  const getSyncBadge = () => {
    if (!isSupabaseConfigured) {
      return (
        <span className="border border-black dark:border-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-900 text-black dark:text-white">
          Local Demo
        </span>
      );
    }
    if (!user) {
      return (
        <span className="border border-black dark:border-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
          Unsynced
        </span>
      );
    }
    if (syncStatus === 'syncing') {
      return (
        <span className="border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider animate-pulse">
          Syncing...
        </span>
      );
    }
    if (syncStatus === 'error') {
      return (
        <span className="border border-red-600 text-red-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white dark:bg-black">
          Sync Error
        </span>
      );
    }
    return (
      <span className="border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
        Synced
      </span>
    );
  };

  return (
    <nav className="w-full bg-white dark:bg-black border-b border-black dark:border-white text-black dark:text-white px-4 md:px-6 py-3 md:py-4 flex justify-between items-center sticky top-0 z-30 transition-colors duration-200">
      
      {/* Branding */}
      <Link href="/" className="flex items-center gap-2">
        <div className="h-7 w-7 sm:h-8 sm:w-8 bg-black dark:bg-white flex items-center justify-center shrink-0">
          <Wallet className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white dark:text-black" />
        </div>
        <div>
          <span className="font-black text-xs sm:text-sm uppercase tracking-wider block">
            My Wallet
          </span>
          <span className="text-[9px] hidden sm:block text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest -mt-1">
            Minimalist Ledger
          </span>
        </div>
      </Link>

      {/* Pages Navigation links (Desktop only) */}
      <div className="hidden md:flex flex-wrap items-center justify-center gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs uppercase font-bold tracking-wider px-3.5 py-1.5 transition-all ${
                active 
                  ? 'bg-black dark:bg-white text-white dark:text-black' 
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Profile/Menu Dropdown Trigger */}
      <div className="relative shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-1.5 focus:outline-none py-1 border border-transparent hover:border-black dark:hover:border-white px-2 transition-all select-none"
          title="User menu"
        >
          {user && user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={user.image} 
              alt="Profile" 
              className="h-8 w-8 rounded-full border border-black dark:border-white shadow-sm"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-8 w-8 rounded-full border border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-black dark:text-white">
              <UserIcon className="h-4.5 w-4.5" />
            </div>
          )}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-black border border-black dark:border-white p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] flex flex-col gap-3.5 z-40 text-xs text-black dark:text-white animate-slide-down">
            
            {/* User Identity / Info */}
            <div className="flex flex-col gap-1">
              {user ? (
                <>
                  <span className="font-black uppercase truncate block leading-none">{user.name || 'User Profile'}</span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold truncate block mt-1">{user.email}</span>
                </>
              ) : (
                <>
                  <span className="font-black uppercase block leading-none">Guest Mode</span>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold block mt-1">Local Storage Ledger</span>
                </>
              )}
            </div>

            {/* Sync Status Badge */}
            <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-800 pt-3">
              <span className="text-[9px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider">Sync State:</span>
              {getSyncBadge()}
            </div>

            {/* Theme Switcher */}
            <div className="flex flex-col gap-2 border-t border-neutral-200 dark:border-neutral-800 pt-3">
              <span className="text-[9px] font-black uppercase text-neutral-400 dark:text-neutral-500 tracking-wider">Theme:</span>
              <div className="flex border border-black dark:border-white bg-neutral-100 dark:bg-neutral-900 p-0.5 select-none w-full justify-between">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-grow py-1 text-[9px] font-bold uppercase flex items-center justify-center gap-1 transition-all ${
                    theme === 'light'
                      ? 'bg-black text-white'
                      : 'text-neutral-400 dark:text-neutral-500 hover:text-black'
                  }`}
                >
                  <Sun className="h-3 w-3" /> Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-grow py-1 text-[9px] font-bold uppercase flex items-center justify-center gap-1 transition-all ${
                    theme === 'dark'
                      ? 'bg-white text-black'
                      : 'text-neutral-400 dark:text-neutral-500 hover:text-white'
                  }`}
                >
                  <Moon className="h-3 w-3" /> Dark
                </button>
                <button
                  onClick={() => setTheme('system')}
                  className={`flex-grow py-1 text-[9px] font-bold uppercase flex items-center justify-center gap-1 transition-all ${
                    theme === 'system'
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Laptop className="h-3 w-3" /> Auto
                </button>
              </div>
            </div>

            {/* Action Button */}
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3.5">
              {user ? (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full border border-black dark:border-white text-black dark:text-white text-xs font-black uppercase py-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLoginClick();
                  }}
                  className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 text-xs font-black uppercase py-2 transition-all border border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0 active:translate-y-0"
                >
                  Sign In
                </button>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-black dark:border-white px-1 py-1 flex justify-between items-center z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] select-none">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-0.5 text-[8.5px] sm:text-[9px] font-black uppercase tracking-tight transition-all gap-1 rounded-sm text-center whitespace-nowrap overflow-hidden ${
                active 
                  ? 'text-black dark:text-white bg-neutral-100 dark:bg-neutral-900 border border-black dark:border-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]' 
                  : 'text-neutral-500 dark:text-neutral-400 border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate w-full">{link.label}</span>
            </Link>
          );
        })}
      </div>

    </nav>
  );
};

export default Navbar;