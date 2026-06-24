/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { hashPassword } from '../utils/crypto';
import { KeyRound, User as UserIcon, AlertTriangle, Car } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginViewProps {
  users: User[];
  onLogin: (user: User) => void;
}

export default function LoginView({ users, onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('გთხოვთ შეავსოთ ყველა ველი');
      return;
    }

    const foundUser = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!foundUser) {
      setError('მომხმარებელი ვერ მოიძებნა');
      return;
    }

    const hashedInput = hashPassword(password);
    if (foundUser.passwordHash !== hashedInput) {
      setError('პაროლი არასწორია');
      return;
    }

    setError('');
    onLogin(foundUser);
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-slate-950 text-slate-100">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-7">
          <div className="bg-amber-500/10 p-4 rounded-full border border-amber-500/20 text-amber-500 mb-3">
            <Car className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black font-sans tracking-tight text-slate-50 text-center">
            ავტოსერვისი
          </h2>
          <p className="text-slate-500 text-xs mt-1 text-center font-sans">
            სისტემაში შესვლა
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl text-sm flex items-center gap-2 font-sans"
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-sans">
              იუზერნეიმი
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ჩაწერეთ იუზერნეიმი..."
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 font-sans focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-sans">
              პაროლი
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 font-sans focus:ring-1 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="w-full py-3.5 mt-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/10 active:scale-[0.98] transition-transform duration-100 font-sans tracking-wide"
          >
            შესვლა
          </button>
        </form>
      </motion.div>
    </div>
  );
}
