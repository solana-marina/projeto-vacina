import React, { createContext, useContext, useMemo, useState } from 'react';

import { HEALTH_ROLES, SCHOOL_ROLES } from '../lib/constants';
import { api } from '../services/api';
import { buildSession } from '../services/helpers';
import { clearAuth, getSession, saveAuth } from '../services/sessionStorage';
import { UserRole, UserSession } from '../types/api';

interface AuthContextValue {
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasAnyRole: (roles: UserRole[]) => boolean;
  getDefaultRoute: () => string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(() => getSession());
  const [isLoading, setIsLoading] = useState(false);

  const value = useMemo<AuthContextValue>(() => {
    const hasAnyRole = (roles: UserRole[]) => {
      if (!session) {
        return false;
      }
      return roles.includes(session.role);
    };

    const getDefaultRoute = () => {
      if (!session) {
        return '/auth/login';
      }

      if (session.role === 'ADMIN') {
        return '/admin/students';
      }
      if (SCHOOL_ROLES.includes(session.role)) {
        return '/school/students';
      }
      if (HEALTH_ROLES.includes(session.role)) {
        return '/health/search';
      }
      return '/auth/login';
    };

    return {
      session,
      isAuthenticated: !!session,
      isLoading,
      async login(email: string, password: string) {
        setIsLoading(true);
        try {
          const response = await api.login(email, password);
          const normalizedSession = buildSession(response);
          saveAuth(response.access, response.refresh, normalizedSession);
          setSession(normalizedSession);
        } finally {
          setIsLoading(false);
        }
      },
      logout() {
        clearAuth();
        setSession(null);
      },
      hasAnyRole,
      getDefaultRoute,
    };
  }, [isLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
