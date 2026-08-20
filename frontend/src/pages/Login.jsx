import React, { useState } from 'react';
import { api } from '../api/client';

export const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Authenticate against backend persistent storage
      const res = await api.login(username.trim(), password);
      onLoginSuccess(res.user);
    } catch (err) {
      // Fallback check for demo usernames
      if ((username === 'admin' || username === 'admin@AEERO.in') && password === 'admin123') {
        onLoginSuccess({ id: 1, name: 'Admin User 1', username: 'admin', role: 'ADMIN', email: 'admin@AEERO.edu' });
      } else if ((username === 'sourav' || username === 'rahul') && password === 'password123') {
        onLoginSuccess({ id: 2, name: 'Sourav Sharma', username: 'sourav', role: 'LEAD_FINDER', email: 'sourav@AEERO.edu' });
      } else {
        setError(err.message || 'Invalid login credentials. Please check username and password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F8FC] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 w-full max-w-[440px] shadow-xl transition-all">

        {/* Top AEERO Emblem Logo */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-[#7D610F] text-white rounded-full flex flex-col items-center justify-center mx-auto mb-3 shadow-md border-2 border-[#CDB46A]">
            <span className="material-symbols-outlined text-[36px]">school</span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#CDB46A] -mt-1">AEERO</span>
          </div>
          <h1 className="font-bold text-2xl text-slate-900 tracking-tight">AEERO CRM</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Lead Management Core System</p>
        </div>

        {/* Credentials Box */}
        <div className="mb-6 p-3.5 bg-amber-50/80 border border-[#CDB46A]/50 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#7D610F]">
            <span className="material-symbols-outlined text-[16px]">key</span>
            <span>Default System Accounts:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700 text-[11px]">
            <div>
              <span className="text-slate-400 block font-sans text-[10px] font-semibold">ADMIN Role</span>
              <strong className="font-mono">admin / admin123</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-sans text-[10px] font-semibold">LEAD_FINDER Role</span>
              <strong className="font-mono">sourav / password123</strong>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Username Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="username">
              Username / Account ID
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                person
              </span>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="admin"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl h-[42px] pl-10 pr-3 text-sm text-slate-900 focus:ring-2 focus:ring-[#7D610F] focus:border-[#7D610F] outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700" htmlFor="password">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                lock
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl h-[42px] pl-10 pr-10 text-sm text-slate-900 focus:ring-2 focus:ring-[#7D610F] focus:border-[#7D610F] outline-none transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-[#7D610F] hover:bg-[#68500C] text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
            ) : (
              <span className="material-symbols-outlined text-[18px]">login</span>
            )}
            <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN TO AEERO CRM'}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-400">© 2026 AEERO Aviation CRM System</p>
        </div>

      </div>
    </div>
  );
};

