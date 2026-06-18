import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppUser {
  id: string;
  nome: string;
  login: string;
  role: string;
  foto: string | null;
  abas_permitidas: string[];
}

interface AuthContextType {
  user: AppUser | null;
  role: string | null;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
  hasAccess: (requiredRoles: string[]) => boolean;
  hasTabAccess: (tab: string) => boolean;
  updateUser: (updates: Partial<AppUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('cfa_user');
    return saved ? JSON.parse(saved) : null;
  });

  const loginFn = async (username: string, password: string): Promise<string | null> => {
    const { data, error } = await (supabase as any)
      .from('app_usuarios')
      .select('*')
      .eq('login', username)
      .eq('senha', password)
      .eq('status', 'ativo')
      .single();

    if (error || !data) return 'Login ou senha incorretos.';

    const appUser: AppUser = {
      id: data.id,
      nome: data.nome,
      login: data.login,
      role: data.role,
      foto: data.foto,
      abas_permitidas: data.abas_permitidas || [],
    };
    setUser(appUser);
    localStorage.setItem('cfa_user', JSON.stringify(appUser));
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cfa_user');
  };

  const hasAccess = (requiredRoles: string[]) => user !== null && requiredRoles.includes(user.role);
  const hasTabAccess = (tab: string) => user !== null && user.abas_permitidas.includes(tab);

  const updateUser = (updates: Partial<AppUser>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('cfa_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, login: loginFn, logout, hasAccess, hasTabAccess, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
