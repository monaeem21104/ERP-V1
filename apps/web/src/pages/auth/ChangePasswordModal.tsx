import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { useAuth } from '../../components/auth/AuthContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  enforced?: boolean;
}

export function ChangePasswordModal({ isOpen, onClose, enforced }: ChangePasswordModalProps) {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError(t('auth.passwordLength', 'New password must be at least 8 characters long'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch', 'New passwords do not match'));
      return;
    }

    setIsLoading(true);
    try {
      await api.patch('/auth/password', {
        currentPassword,
        newPassword,
      });
      setSuccess(t('auth.passwordSuccess', 'Password changed successfully!'));
      await refreshUser();
      setTimeout(() => {
        onClose();
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || t('common.error', 'Failed to change password'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={enforced ? () => {} : onClose}
      title={t('auth.changePasswordTitle', 'Change Your Password')}
      description={
        enforced
          ? t('auth.mustChange', 'You must change your initial temporary password before continuing.')
          : t('auth.changePasswordDesc', 'Update your password to keep your account secure.')
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-200">
            {success}
          </div>
        )}

        <Input
          label={t('auth.currentPassword', 'Current Password')}
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <Input
          label={t('auth.newPassword', 'New Password')}
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          helperText={t('auth.min8Chars', 'Minimum 8 characters')}
        />

        <Input
          label={t('auth.confirmPassword', 'Confirm New Password')}
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2">
          {!enforced && (
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {t('common.cancel', 'Cancel')}
            </Button>
          )}
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {t('common.save', 'Save Password')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
