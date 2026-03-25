import React, { createContext, useContext, useEffect, useState } from 'react';
import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../config/msalConfig';
import { upsertUserLog } from '../services/authService';

// ─── Hardcoded admin credentials (fallback login) ────────────────────────────
const ADMIN_USERNAME = 'AdminQollect';
const ADMIN_PASSWORD = 'Qollect@2026';
const ADMIN_SESSION_KEY = 'qollect_admin_session';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: () => Promise<void>;
  adminLogin: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const msalInstance = new PublicClientApplication(msalConfig);

const mapAccountToUser = (account: AccountInfo): AuthUser => ({
  id: account.localAccountId,
  email: account.username,
  displayName: account.name || account.username,
});

const ADMIN_USER: AuthUser = {
  id: 'admin-qollect',
  email: 'admin@qollect',
  displayName: 'Admin',
  isAdmin: true,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Check admin session first
        const adminSession = sessionStorage.getItem(ADMIN_SESSION_KEY);
        if (adminSession === 'true') {
          setUser(ADMIN_USER);
          setIsLoading(false);
          return;
        }

        // 2. Try MSAL session
        await msalInstance.initialize();
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          const authUser = mapAccountToUser(accounts[0]);
          setUser(authUser);
          await upsertUserLog(authUser);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async () => {
    const response = await msalInstance.loginPopup(loginRequest);
    const authUser = mapAccountToUser(response.account);
    setUser(authUser);
    await upsertUserLog(authUser);
  };

  const adminLogin = async (username: string, password: string) => {
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      throw new Error('Invalid admin credentials');
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    setUser(ADMIN_USER);
    // Log admin usage
    try {
      await upsertUserLog(ADMIN_USER);
    } catch {
      // non-critical
    }
  };

  const logout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
