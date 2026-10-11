import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../components/auth/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Package, Globe, Shield, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login, changeLocale } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isRTL = i18n.language === 'ar';

  const toggleLanguage = () => {
    changeLocale(isRTL ? 'en' : 'ar');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await login(email, password);
      navigate(res.redirectTo || '/dashboard');
    } catch (err: any) {
      setError(err.message || t('auth.invalid', 'Invalid email or password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] p-4 dark:bg-zinc-950 font-sans">
      {/* Language Switcher in corner */}
      <div className="absolute top-4 end-4">
        <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-1.5 text-xs">
          <Globe className="h-3.5 w-3.5 text-emerald-600" />
          <span>{isRTL ? 'English' : 'العربية'}</span>
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-emerald-400 shadow-md">
            <Package className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('appName', 'Industrial ERP')}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('auth.subtitle', 'Enterprise Resource Planning & Production Operations')}
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                {error}
              </div>
            )}

            <Input
              label={t('auth.email', 'Email Address')}
              type="email"
              required
              autoComplete="email"
              placeholder="operator@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label={t('auth.password', 'Password')}
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
              <span>{t('auth.signIn', 'Sign in')}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </form>

          {/* Quick links */}
          <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500">
            <div>
              <span>{t('auth.noAccount', "Don't have an account?")} </span>
              <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
                {t('auth.register', 'Create account')}
              </Link>
            </div>
            <div>
              <Link
                to="/bootstrap"
                className="inline-flex items-center gap-1 font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <Shield className="h-3 w-3" />
                <span>{t('auth.bootstrapLink', 'System Setup / Bootstrap Admin')}</span>
              </Link>
            </div>
          </div>
        </Card>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-zinc-400">
          Protected by database-backed Argon2id authentication & RBAC.
        </p>
      </div>
    </div>
  );
}
