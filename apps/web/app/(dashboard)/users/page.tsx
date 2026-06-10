'use client';

import { useEffect, useState } from 'react';
import { RoleName, UserDto, canManageRole } from '@aiwms/shared';
import { AuthUser } from '@aiwms/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/form-controls';
import { useI18n } from '@/components/i18n-provider';
import { clientFetch } from '@/lib/client-api';
import { formatDate } from '@/lib/utils';

export default function UsersPage() {
  const { t, locale } = useI18n();
  const [users, setUsers] = useState<UserDto[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleName>(RoleName.WORKER);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    const [usersData, me] = await Promise.all([
      clientFetch<UserDto[]>('users'),
      clientFetch<AuthUser>('auth/me'),
    ]);
    setUsers(usersData);
    setCurrentUser(me);
  }

  useEffect(() => {
    loadUsers().catch((err) => setError(err.message));
  }, []);

  const assignableRoles = currentUser
    ? ([RoleName.ADMIN, RoleName.OWNER, RoleName.WORKER] as RoleName[]).filter((r) =>
        canManageRole(currentUser.role, r),
      )
    : [];

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await clientFetch('users', {
        method: 'POST',
        body: JSON.stringify({ email, fullName, password, role }),
      });
      setShowForm(false);
      setEmail('');
      setFullName('');
      setPassword('');
      setRole(RoleName.WORKER);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.requestFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm(t('users.deactivateConfirm'))) return;

    try {
      await clientFetch(`users/${id}`, { method: 'DELETE' });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.requestFailed'));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('users.title')}</h1>
          <p className="text-muted">{t('users.subtitle')}</p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          {showForm ? t('common.cancel') : t('users.addUser')}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t('users.newUser')}</CardTitle>
          </CardHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="space-y-2">
                <Label htmlFor="password">{t('users.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t('users.role')}</Label>
                <Select id="role" value={role} onChange={(e) => setRole(e.target.value as RoleName)}>
                  {assignableRoles.map((value) => (
                    <option key={value} value={value}>
                      {t(`roles.${value}`)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? t('users.creating') : t('users.addUser')}
            </Button>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t('users.fullName')}</th>
              <th className="px-4 py-3 font-medium">{t('users.email')}</th>
              <th className="px-4 py-3 font-medium">{t('users.role')}</th>
              <th className="px-4 py-3 font-medium">{t('common.status')}</th>
              <th className="px-4 py-3 font-medium">{t('users.created')}</th>
              <th className="px-4 py-3 font-medium">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{user.fullName}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.role}>{t(`roles.${user.role}`)}</Badge>
                </td>
                <td className="px-4 py-3">
                  {user.isActive ? t('common.active') : t('common.inactive')}
                </td>
                <td className="px-4 py-3">{formatDate(user.createdAt, locale)}</td>
                <td className="px-4 py-3">
                  {user.isActive && user.id !== currentUser?.id && (
                    <button
                      type="button"
                      className="text-destructive hover:underline"
                      onClick={() => handleDeactivate(user.id)}
                    >
                      {t('users.deactivate')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
