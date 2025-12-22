import React from 'react';

type Role = 'admin' | 'reporter' | null;

interface AuthContextValue {
  role: Role;
  email: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const ADMIN = { email: 'qa.learn.go5@gmail.com', password: 'WeL0veG05!' };
const REPORTER = { email: 'reporter@gofive.co.th', password: 'G0FiveSelfDriven2024' };

export const AuthProvider: React.FC<React.PropsWithChildren<Record<string, unknown>>> = ({ children }) => {
  const [role, setRole] = React.useState<Role>(() => {
    try {
      const v = localStorage.getItem('qollect_role');
      return (v === 'admin' || v === 'reporter') ? (v as Role) : null;
    } catch (e) {
      return null;
    }
  });
  const [email, setEmail] = React.useState<string | null>(() => {
    try {
      return localStorage.getItem('qollect_email');
    } catch (e) {
      return null;
    }
  });

  const login = async (email: string, password: string) => {
    // Simple static credential check
    if (email === ADMIN.email && password === ADMIN.password) {
      setRole('admin');
      setEmail(email);
      try { localStorage.setItem('qollect_role', 'admin'); localStorage.setItem('qollect_email', email); } catch (e) {}
      return { ok: true };
    }
    if (email === REPORTER.email && password === REPORTER.password) {
      setRole('reporter');
      setEmail(email);
      try { localStorage.setItem('qollect_role', 'reporter'); localStorage.setItem('qollect_email', email); } catch (e) {}
      return { ok: true };
    }
    return { ok: false, message: 'Please check your credentials' };
  };

  const logout = () => {
    setRole(null);
    setEmail(null);
    try { localStorage.removeItem('qollect_role'); localStorage.removeItem('qollect_email'); } catch (e) {}
  };

  const value: AuthContextValue = {
    role,
    email,
    isAuthenticated: role !== null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export type { Role };
