import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Role = 'admin' | 'operador' | 'master';

export type AuthUser = {
  id: number | string;
  username: string;
  nome: string;
  role: Role;
};

type AuthContextValue = {
  user: AuthUser | null;
  isOperador: boolean;
  isAdmin: boolean;
  isMaster: boolean;
  login: (username: string, senha: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = 'user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const login = async (username: string, senha: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : `http://${window.location.hostname}:8001/api`}/usuarios/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, senha }),
      });

      if (!response.ok) {
        const erro = await response.json().catch(() => ({}));
        throw new Error(erro.detail || 'Erro ao fazer login');
      }

      const userData = await response.json();
      const user: AuthUser = {
        id: userData.id,
        username: userData.username,
        nome: userData.nome,
        role: userData.role,
      };

      setUser(user);
      try {
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } catch {
        // ignore
      }
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    try {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const value: AuthContextValue = useMemo(() => {
    const role = (user?.role ?? '') as Role | '';
    return {
      user,
      isOperador: role === 'operador',
      isAdmin: role === 'admin',
      isMaster: role === 'master',
      login,
      logout,
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

