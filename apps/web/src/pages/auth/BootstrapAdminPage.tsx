import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../components/auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ShieldCheck, ArrowLeft, AlertTriangle } from 'lucide-react';

export function BootstrapAdminPage() {
  const { t } = useTranslation();
  const { bootstrap } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleBootstrap = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await bootstrap();
      navigate(res.redirectTo || '/admin');
    } catch (err: any) {
      setError(
        err.message ||
          t(
            'auth.bootstrapError',
            'Bootstrap is either disabled because a Super Administrator already exists, or environment credentials are not configured.'
          )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] p-4 dark:bg-zinc-950 font-sans">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-emerald-400 shadow-md">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('auth.bootstrapTitle', 'Initialize Administrator')}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('auth.bootstrapSubtitle', 'One-time secure initialization from system environment configuration')}
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-sm space-y-4">
          {error ? (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <p className="font-semibold mb-1">Initialization Failed</p>
              <p>{error}</p>
            </div>
          ) : (
            <div className="rounded-lg bg-amber-50 p-3.5 text-xs text-amber-800 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>One-Time Platform Bootstrap</span>
              </div>
              <p className="leading-relaxed">
                This endpoint initializes the initial Super Administrator from the configured server environment variables (<code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">BOOTSTRAP_ADMIN_EMAIL</code>).
              </p>
              <p className="text-[11px] text-amber-700">
                Once initialized, this mechanism is permanently disabled by the server.
              </p>
            </div>
          )}

          <Button
            variant="primary"
            className="w-full"
            onClick={handleBootstrap}
            isLoading={isLoading}
          >
            {t('auth.runBootstrap', 'Execute Secure Bootstrap')}
          </Button>

          <div className="pt-2 text-center text-xs text-zinc-500">
            <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700">
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              <span>{t('auth.backToLogin', 'Back to sign in')}</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
