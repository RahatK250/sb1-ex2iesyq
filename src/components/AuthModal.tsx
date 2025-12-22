import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toast } from './Toast';
import { Zap } from 'lucide-react';

import { useAuth } from '../hooks/useAuth';

export const AuthModal: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
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
        // After successful sign-in navigate to home (clear the /login path)
        try { navigate('/', { replace: true }); } catch (e) {}
      }
    } catch (err) {
      setErrorMsg('An error occurred');
      setPassword('');
      setToast({ isVisible: true, message: 'Login error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Ensure the URL shows /login when this modal/page is mounted
  const navigate = useNavigate();
  const location = useLocation();
  React.useEffect(() => {
    try {
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    } catch (e) {}
  }, []);

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
