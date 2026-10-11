import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../components/auth/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Package, Globe, Info, ArrowLeft } from 'lucide-react';

export function RegisterPage() {
  const { t, i18n } = useTranslation();
  const { register, changeLocale } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isRTL = i18n.language === 'ar';

  const toggleLanguage = () => {
    changeLocale(isRTL ? 'en' : 'ar');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t('auth.passwordLength', 'Password must be at least 8 characters long'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch', 'Passwords do not match'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await register(email, password, fullName);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setError(err.message || t('common.error', 'Registration failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8fafc] p-4 dark:bg-zinc-950 font-sans">
      <div className="absolute top-4 end-4">
        <Button variant="outline" size="sm" onClick={toggleLanguage} className="gap-1.5 text-xs">
          <Globe className="h-3.5 w-3.5 text-emerald-600" />
          <span>{isRTL ? 'English' : 'العربية'}</span>
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-emerald-400 shadow-md">
            <Package className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('auth.register', 'Create account')}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('appName', 'Industrial ERP')}
          </p>
        </div>

        <Card className="p-6 sm:p-8 shadow-sm">
          {successMessage ? (
            <div className="space-y-4 text-center">
              <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-800 text-xs leading-relaxed dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300">
                <p className="font-semibold text-sm mb-1">
                  {t('auth.registerSuccess', 'Account Created Successfully')}
                </p>
                <p>{successMessage}</p>
              </div>

              <div className="rounded-lg bg-zinc-50 p-3 text-[11px] text-zinc-600 text-start">
                <Info className="h-3.5 w-3.5 inline text-emerald-600 me-1.5" />
                {t('auth.standardNote', 'Public registration always creates a Standard User. Administrator access cannot be self-assigned.')}
              </div>

              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate('/login')}
              >
                <span>{t('auth.backToSignIn', 'Proceed to Sign In')}</span>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                  {error}
                </div>
              )}

              {/* Informational banner about RBAC */}
              <div className="rounded-lg bg-zinc-50 p-3 text-[11px] text-zinc-600 border border-zinc-200/80 dark:bg-zinc-800/40 dark:border-zinc-700 dark:text-zinc-300">
                <Info className="h-3.5 w-3.5 inline text-emerald-600 me-1.5" />
                {t('auth.standardNote', 'Public registration always creates a Standard User. Administrator access cannot be self-assigned.')}
              </div>

              <Input
                label={t('auth.fullName', 'Full Name')}
                required
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <Input
                label={t('auth.email', 'Email Address')}
                type="email"
                required
                autoComplete="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label={t('auth.password', 'Password')}
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText={t('auth.min8Chars', 'Minimum 8 characters')}
              />

              <Input
                label={t('auth.confirmPassword', 'Confirm Password')}
                type="password"
                required
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
                {t('auth.register', 'Create account')}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center text-xs text-zinc-500">
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
