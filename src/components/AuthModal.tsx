import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { Toast } from './Toast';
import { Zap } from 'lucide-react';
import AuthLoadingOverlay from './AuthLoadingOverlay';

import { useAuth } from '../hooks/useAuth';

export const AuthModal: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithOffice365 } = useAuth();
  const { instance, accounts } = useMsal();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isClosing, setIsClosing] = React.useState(false);
  const [toast, setToast] = React.useState({ isVisible: false, message: '', type: 'error' as 'success' | 'error' | 'warning' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (!res || !res.ok) {
        const msg = res?.message ?? 'Invalid email or password';
        setErrorMsg(msg);
        setPassword('');
        setToast({ isVisible: true, message: msg, type: 'error' });
      } else {
        setToast({ isVisible: true, message: 'Signed in', type: 'success' });
        setIsClosing(true);
        // After successful sign-in navigate to select-product (clear the /login path)
        try { navigate('/select-product', { replace: true }); } catch (e) {}
      }
    } catch (err) {
      setErrorMsg('An error occurred');
      setPassword('');
      setToast({ isVisible: true, message: 'Login error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOffice365Login = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      // Check if user is already logged in
      if (accounts.length > 0) {
        // User is already logged in, extract email and log in to our app
        const account = accounts[0];
        try { instance.setActiveAccount(account); } catch (e) { console.debug('[AuthModal] setActiveAccount failed', e); }
        console.debug('[AuthModal] accounts present', account);
        const res = await loginWithOffice365({
          mail: account.idTokenClaims?.email || '',
          userPrincipalName: account.username || '',
        });

        if (res.ok) {
          setToast({ isVisible: true, message: 'Office 365 sign in successful', type: 'success' });
          setIsClosing(true);
          try { navigate('/select-product', { replace: true }); } catch (e) {}
        } else {
          setErrorMsg(res.message || 'Office 365 login failed');
          setToast({ isVisible: true, message: res.message || 'Office 365 login failed', type: 'error' });
        }
      } else {
        // Initiate Office 365 login - use redirect instead of popup
        const loginRequest = {
          scopes: ['User.Read', 'email', 'profile', 'openid'],
        };

        console.log('[AuthModal] Starting loginRedirect');
        setToast({ isVisible: true, message: 'Redirecting to Office 365 login...', type: 'warning' });
        await instance.loginRedirect(loginRequest);
      }
    } catch (err: any) {
      console.error('[AuthModal] Error during Office 365 login:', err);
      const errorMsg = err?.errorCode === 'user_cancelled' ? 'Login cancelled' : 'Office 365 login failed';
      setErrorMsg(errorMsg);
      setToast({ isVisible: true, message: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Ensure the URL shows /login when this modal/page is mounted
  // Note: no forced navigation here. AuthModal can be used both as a dedicated
  // /login route and as an in-page modal on other routes (HomePage). Forcing
  // navigation here caused redirect loops where successful login immediately
  // navigated back to /login due to route guards seeing stale state.

  // Show loading overlay when closing after successful login
  if (isClosing) {
    return <AuthLoadingOverlay isVisible={true} message="Signing in with Office 365..." />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-gray-900 backdrop-blur-sm">
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast((s) => ({ ...s, isVisible: false }))}
      />

      <div className="w-full max-w-lg mx-4">
        <div className="bg-white dark:bg-gray-800 text-white rounded-2xl shadow-2xl ring-1 ring-white/5 overflow-hidden">
          <div className="p-6 flex flex-col items-center">
            <div className="flex justify-center mb-4">
              <img
                src="https://cdn-icons-png.flaticon.com/512/11569/11569487.png"
                alt="Qollect Logo"
                className="w-12 h-12 sm:w-16 sm:h-16 lg:w-16 lg:h-16"
              />
            </div>
            <h2 className="text-2xl font-bold">Qollect</h2>
            <p className="text-sm text-gray-300 mt-1 mb-4">One place to collect all your test data</p>

            <div className="w-full max-w-sm rounded-lg p-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errorMsg) setErrorMsg(null); }}
                    type="email"
                    placeholder="Enter your email"
                    className={`input-enhanced w-full px-3 py-2 sm:py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${errorMsg ? 'border-red-500' : ''}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                  <input
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(null); }}
                    type="password"
                    placeholder="Enter your password"
                    className={`input-enhanced w-full px-3 py-2 sm:py-3 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${errorMsg ? 'border-red-500' : ''}`}
                    required
                  />
                </div>

                {errorMsg && <p className="text-red-500 text-sm mt-1">{errorMsg}</p>}

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-gray-400">Contact admin if you need access.</div>
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-60">
                    {loading ? 'Signing...' : 'Sign in'}
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or</span>
                </div>
              </div>

              {/* Office 365 Login Button */}
              <button
                onClick={() => {
                  console.log('[AuthModal] Office 365 button clicked');
                  handleOffice365Login();
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                </svg>
                Sign in with Office 365
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
