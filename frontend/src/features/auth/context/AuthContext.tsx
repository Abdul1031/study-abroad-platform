import React, { createContext, useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

interface Student {
  id: string;
  email: string;
  fullName: string;
  country: string;
  /** Provided by the backend from its admin allowlist */
  role?: 'STUDENT' | 'ADMIN';
}

interface AuthContextType {
  user: Student | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, country: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get<{ student: Student }>('/auth/me');
        // The backend returns { success: true, student: ... }, not wrapped in 'data'
        setUser((response as any).student);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<{
      accessToken: string;
      student: Student;
    }>('/auth/login', { email, password });

    api.setToken((response as any).accessToken);
    setUser((response as any).student);
  }, []);

  const signup = useCallback(
    async (email: string, password: string, fullName: string, country: string) => {
      const response = await api.post<{
        accessToken: string;
        student: Student;
      }>('/auth/signup', { email, password, fullName, country });

      api.setToken((response as any).accessToken);
      setUser((response as any).student);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {});
    } finally {
      api.clearToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
