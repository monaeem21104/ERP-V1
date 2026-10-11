import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../../lib/api';

export interface AuthCompany {
  id: string;
  name: string;
  status: string;
  isDefault: boolean;
}

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  status: string;
  locale: string;
  isSuperAdmin: boolean;
  permissions: string[];
  companies: AuthCompany[];
  mustChangePassword: boolean;
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string) => void;
  login: (email: string, password: string) => Promise<{ redirectTo: string; mustChangePassword: boolean }>;
  register: (email: string, password: string, fullName: string) => Promise<{ message: string }>;
  bootstrap: () => Promise<{ redirectTo: string }>;
  logout: () => Promise<void>;
  changeLocale: (locale: 'en' | 'ar') => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permissionKey: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCompanyId, setSelectedCompanyIdState] = useState<string | null>(
    localStorage.getItem('companyId')
  );
  const { i18n } = useTranslation();

  const setSelectedCompanyId = (id: string) => {
    localStorage.setItem('companyId', id);
    setSelectedCompanyIdState(id);
  };

  const refreshUser = async () => {
    try {
      const data = await api.get<UserSession>('/auth/me');
      setUser(data);
      if (data.locale && data.locale !== i18n.language) {
        changeLocale(data.locale as 'en' | 'ar');
      }
      if (!selectedCompanyId && data.companies && data.companies.length > 0) {
        const defaultCompany = data.companies.find((c) => c.isDefault) || data.companies[0];
        setSelectedCompanyId(defaultCompany.id);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{
      user: UserSession;
      redirectTo: string;
      mustChangePassword: boolean;
    }>('/auth/login', { email, password });
    
    await refreshUser();
    return { redirectTo: res.redirectTo, mustChangePassword: res.mustChangePassword };
  };

  const register = async (email: string, password: string, fullName: string) => {
    const res = await api.post<{ message: string }>('/auth/register', {
      email,
      password,
      fullName,
    });
    return res;
  };

  const bootstrap = async () => {
    const res = await api.post<{ redirectTo: string }>('/auth/bootstrap');
    await refreshUser();
    return { redirectTo: res.redirectTo };
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue cleanup on error
    }
    setUser(null);
    localStorage.removeItem('companyId');
    setSelectedCompanyIdState(null);
  };

  const changeLocale = async (newLocale: 'en' | 'ar') => {
    localStorage.setItem('locale', newLocale);
    await i18n.changeLanguage(newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';

    if (user) {
      try {
        await api.patch('/auth/locale', { locale: newLocale });
      } catch {
        // Preference updated locally
      }
    }
  };

  const hasPermission = (permissionKey: string): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return user.permissions.includes(permissionKey);
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      selectedCompanyId,
      setSelectedCompanyId,
      login,
      register,
      bootstrap,
      logout,
      changeLocale,
      refreshUser,
      hasPermission,
    }),
    [user, isLoading, selectedCompanyId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
