import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ChevronDown, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, adminLogin, user } = useAuth();
  const navigate = useNavigate();

  // Microsoft login state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin login state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  // ── Microsoft login ──────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await login();
      navigate('/', { replace: true });
    } catch (err: any) {
      const code = err?.errorCode ?? '';
      if (!code.includes('user_cancelled') && !code.includes('interaction_in_progress')) {
        setError('Login failed. Please try again.');
      }
      setIsLoading(false);
    }
  };

  // ── Admin login ──────────────────────────────────────────────────────────────
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError(null);
    try {
      await adminLogin(adminUsername, adminPassword);
      navigate('/', { replace: true });
    } catch {
      setAdminError('Invalid username or password.');
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4 py-8">

      {/* Logo + Brand */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-4">
          <img
            src="https://cdn-icons-png.flaticon.com/512/11569/11569487.png"
            alt="Qollect Logo"
            className="w-16 h-16 sm:w-20 sm:h-20"
          />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 dark:text-white mb-2">
          Qollect
        </h1>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
          One place to collect all your test data
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Welcome</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sign in with your company account to continue
          </p>
        </div>

        {/* ── Microsoft Button ────────────────────────────────────────────────── */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-md
            ${isLoading
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600 hover:shadow-lg'
            }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-5 h-5 text-yellow-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Signing in, please wait...</span>
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#F35325" />
                <rect x="11" y="1" width="9" height="9" fill="#81BC06" />
                <rect x="1" y="11" width="9" height="9" fill="#05A6F0" />
                <rect x="11" y="11" width="9" height="9" fill="#FFBA08" />
              </svg>
              <span>Sign in with Microsoft</span>
            </>
          )}
        </button>

        {isLoading && (
          <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500 animate-pulse">
            A Microsoft sign-in window has opened — please complete sign-in there.
          </p>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* ── Divider ─────────────────────────────────────────────────────────── */}
        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400 dark:text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* ── Admin Login Toggle ───────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => {
            setShowAdminPanel(v => !v);
            setAdminError(null);
            setAdminUsername('');
            setAdminPassword('');
          }}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 border border-dashed border-gray-200 dark:border-gray-700"
        >
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin access
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdminPanel ? 'rotate-180' : ''}`}
          />
        </button>

        {/* ── Admin Login Form (expandable) ────────────────────────────────────── */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            showAdminPanel ? 'max-h-64 opacity-100 mt-3' : 'max-h-0 opacity-0'
          }`}
        >
          <form onSubmit={handleAdminLogin} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
              Admin Login
            </p>

            {/* Username */}
            <div>
              <input
                type="text"
                placeholder="Username"
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                autoComplete="username"
                className="w-full px-3 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500 transition"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full px-3 py-2.5 pr-10 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 dark:focus:ring-orange-500 transition [&::-ms-reveal]:hidden [&::-ms-clear]:hidden [&::-webkit-credentials-auto-fill-button]:hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Error */}
            {adminError && (
              <p className="text-xs text-red-500 dark:text-red-400 text-center">{adminError}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={adminLoading || !adminUsername || !adminPassword}
              className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 dark:disabled:bg-orange-800/50 text-white transition-all duration-200 flex items-center justify-center gap-2"
            >
              {adminLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in as Admin'
              )}
            </button>
          </form>
        </div>

        {/* Info */}
        <p className="mt-5 text-center text-xs text-gray-400 dark:text-gray-500">
          Access is restricted to company accounts only.
          <br />
          Use your <span className="text-gray-500 dark:text-gray-400 font-medium">@company.com</span> Microsoft account.
        </p>
      </div>

      {/* Footer */}
      <footer className="mt-10 flex items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
        <Zap className="w-4 h-4 text-yellow-500" />
        <p className="text-sm">Powered by <span className="font-bold">Qollect</span></p>
      </footer>
    </div>
  );
};
