import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  requireSuperAdmin?: boolean;
}

export function ProtectedRoute({ children, permission, requireSuperAdmin }: ProtectedRouteProps) {
  const { user, isLoading, hasPermission } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <LoadingSpinner size="lg" label={t('common.loading', 'Loading application…')} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSuperAdmin && !user.isSuperAdmin) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center p-6">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-3" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Super Administrator Access Required
        </h2>
        <p className="mt-1 text-sm text-zinc-500 max-w-md">
          This section is restricted to platform operators and Super Administrators.
        </p>
      </div>
    );
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center p-6">
        <ShieldAlert className="h-12 w-12 text-amber-500 mb-3" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Permission Denied
        </h2>
        <p className="mt-1 text-sm text-zinc-500 max-w-md">
          You lack the required permission <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">{permission}</code> to access this resource.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
