'use client';

import { useEffect, useState } from 'react';
import { AuthUser } from '@aiwms/shared';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';

export default function SettingsPage() {
  const { t } = useI18n();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [error, setError] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    clientFetch<AuthUser>('auth/me')
      .then((data) => {
        setUser(data);
        setFullName(data.fullName);
        setEmail(data.email);
      })
      .catch((err) => setError(err.message));
  }, []);

  async function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoadingProfile(true);
    setProfileMessage('');
    setError('');

    try {
      await clientFetch('users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ fullName, email }),
      });
      setProfileMessage(t('settings.profileSaved'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.requestFailed'));
    } finally {
      setLoadingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoadingPassword(true);
    setPasswordMessage('');
    setError('');

    try {
      await clientFetch('users/profile/password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMessage(t('settings.passwordSaved'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.requestFailed'));
    } finally {
      setLoadingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-muted">{t('settings.subtitle')}</p>
      </div>

      {user && (
        <p className="text-sm text-muted">
          {t('settings.signedInAs')}: <span className="font-medium">{t(`roles.${user.role}`)}</span>
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('common.language')}</CardTitle>
        </CardHeader>
        <LocaleSwitcher />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.profile')}</CardTitle>
          <CardDescription>{t('settings.profileDesc')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('users.fullName')}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('users.email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {profileMessage && <p className="text-sm text-green-700">{profileMessage}</p>}
          <Button type="submit" disabled={loadingProfile}>
            {loadingProfile ? t('settings.saving') : t('settings.saveProfile')}
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.passwordSection')}</CardTitle>
          <CardDescription>{t('settings.passwordDesc')}</CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('settings.currentPassword')}</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          {passwordMessage && <p className="text-sm text-green-700">{passwordMessage}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={loadingPassword}>
            {loadingPassword ? t('settings.updating') : t('settings.updatePassword')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
