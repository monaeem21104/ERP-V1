import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import {
  Menu,
  Globe,
  Bell,
  LogOut,
  Building2,
  KeyRound,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  onToggleSidebar: () => void;
  onChangePasswordClick: () => void;
}

export function Header({ onToggleSidebar, onChangePasswordClick }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { user, selectedCompanyId, setSelectedCompanyId, logout, changeLocale } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);

  const isRTL = i18n.language === 'ar';

  const toggleLanguage = () => {
    const nextLocale = isRTL ? 'en' : 'ar';
    changeLocale(nextLocale);
  };

  const currentCompany = user?.companies.find((c) => c.id === selectedCompanyId) || user?.companies[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-xs transition-colors dark:border-zinc-800 dark:bg-zinc-900/95 sm:px-6">
      {/* Left side: Mobile menu toggle + Company Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Company selector */}
        {user?.companies && user.companies.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setIsCompanyMenuOpen(!isCompanyMenuOpen)}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200"
            >
              <Building2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="max-w-[140px] truncate sm:max-w-[200px]">
                {currentCompany?.name ?? 'Select Company'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
            </button>

            {isCompanyMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCompanyMenuOpen(false)}
                />
                <div className="absolute start-0 z-50 mt-1.5 w-56 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    {t('header.switchCompany', 'Select Company')}
                  </div>
                  {user.companies.map((company) => (
                    <button
                      key={company.id}
                      onClick={() => {
                        setSelectedCompanyId(company.id);
                        setIsCompanyMenuOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
                    >
                      <span className="truncate">{company.name}</span>
                      {company.id === selectedCompanyId && (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right side: Language switcher + Notifications + User menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 border-zinc-200 text-xs dark:border-zinc-700 font-medium"
        >
          <Globe className="h-3.5 w-3.5 text-emerald-600" />
          <span>{isRTL ? 'English' : 'العربية'}</span>
        </Button>

        {/* Notifications Icon */}
        <button
          className="relative rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
          title={t('header.notifications', 'Notifications')}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 rounded-lg p-1 text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white shadow-xs">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden text-start rtl:text-right sm:block">
              <p className="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {user?.fullName || 'User'}
              </p>
              <p className="text-[10px] text-zinc-400">
                {user?.isSuperAdmin ? 'Super Administrator' : 'Operator'}
              </p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-zinc-400 sm:block" />
          </button>

          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute end-0 z-50 mt-1.5 w-52 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">{user?.email}</p>
                </div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onChangePasswordClick();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                >
                  <KeyRound className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{t('header.changePassword', 'Change Password')}</span>
                </button>

                <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>{t('auth.signOut', 'Sign out')}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
