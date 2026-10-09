import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { api, clearToken, getToken, setToken } from '@/lib/api';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: Record<string, unknown>) => Promise<{ user: User; blockchain?: any }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(!!getToken());

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const d = await api<{ user: User }>('/auth/me');
      setUser(d.user);
    } catch {
      clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const d = await api<{ user: User; token: string }>('/auth/login', { method: 'POST', body: { email, password } });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  };

  const register = async (payload: Record<string, unknown>) => {
    const d = await api<{ user: User; token: string; blockchain?: any }>('/auth/register', { method: 'POST', body: payload });
    setToken(d.token);
    setUser(d.user);
    return { user: d.user, blockchain: d.blockchain };
  };

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* token may already be invalid */
    }
    clearToken();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, role: user?.role ?? null, isAuthenticated: !!user, loading, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
};
