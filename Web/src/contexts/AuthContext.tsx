import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthUser, Role } from '../utils/authStorage';
import {
  clearStoredUser,
  getStoredUser,
  migrateAdminSessionFromLocalStorage,
  persistUser,
} from '../utils/authStorage';

export type { AuthUser, Role };

type AuthContextValue = {
  user: AuthUser | null;
  isOperador: boolean;
  isAdmin: boolean;
  isMaster: boolean;
  login: (username: string, senha: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    migrateAdminSessionFromLocalStorage();
    setUser(getStoredUser());
  }, []);

  const login = async (username: string, senha: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : `http://${window.location.hostname}:8001/api`}/usuarios/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, senha }),
      }
    );

    if (!response.ok) {
      const erro = await response.json().catch(() => ({}));
      throw new Error(erro.detail || 'Erro ao fazer login');
    }

    const userData = await response.json();
    const loggedUser: AuthUser = {
      id: userData.id,
      username: userData.username,
      nome: userData.nome,
      role: userData.role,
    };

    setUser(loggedUser);
    persistUser(loggedUser);
    return loggedUser;
  };

  const logout = useCallback(() => {
    setUser(null);
    clearStoredUser();
  }, []);

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
  }, [user, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
