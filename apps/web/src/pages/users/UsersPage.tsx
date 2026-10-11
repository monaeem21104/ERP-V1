import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  UserPlus,
  Shield,
  KeyRound,
  LogOut,
  History,
  CheckCircle,
  Ban,
  UserX,
} from 'lucide-react';

export function UsersPage() {
  const { t, i18n } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const locale = i18n.language;

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [assignRoleOpen, setAssignRoleOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loginHistoryList, setLoginHistoryList] = useState<any[]>([]);

  // Form states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [assignRoleIds, setAssignRoleIds] = useState<string[]>([]);

  const { data: users, isLoading } = useQuery<any[]>({
    queryKey: ['users', selectedCompanyId],
    queryFn: () => api.get<any[]>('/users'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: roles } = useQuery<any[]>({
    queryKey: ['roles', selectedCompanyId],
    queryFn: () => api.get<any[]>('/roles'),
    enabled: Boolean(selectedCompanyId),
  });

  const createUserMutation = useMutation({
    mutationFn: (body: any) => api.post('/users', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateUserOpen(false);
      setEmail('');
      setFullName('');
      setSelectedRoleIds([]);
    },
  });

  const setStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/users/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const assignRolesMutation = useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) =>
      api.post(`/users/${id}/roles`, { roleIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAssignRoleOpen(false);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/reset-password`),
    onSuccess: (data: any) => {
      alert(`Temporary password generated: ${data.temporaryPassword}`);
    },
  });

  const revokeSessionsMutation = useMutation({
    mutationFn: (id: string) => api.post(`/users/${id}/revoke-sessions`),
    onSuccess: () => {
      alert('Active sessions revoked.');
    },
  });

  const openHistory = async (user: any) => {
    setSelectedUser(user);
    const history = await api.get<any[]>(`/users/${user.id}/login-history`);
    setLoginHistoryList(history);
    setHistoryOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate({
      email,
      fullName,
      roleIds: selectedRoleIds,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.users', 'User Accounts & Access Management')}
          </h1>
          <p className="text-xs text-zinc-500">
            Provision identities, assign company roles, review login history, and control active sessions
          </p>
        </div>

        {hasPermission('users.create') && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedRoleIds(roles?.[0]?.id ? [roles[0].id] : []);
              setCreateUserOpen(true);
            }}
            className="gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            <span>Provision User</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>User Directory</CardTitle>
            <CardDescription>Managed employee accounts and access privileges</CardDescription>
          </div>
        </CardHeader>

        {isLoading ? (
          <LoadingSpinner size="md" />
        ) : !users || users.length === 0 ? (
          <EmptyState title="No users found" description="Provision users to grant system access." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assigned Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-semibold">{u.fullName}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.userRoles?.map((ur: any) => (
                        <Badge key={ur.id} variant="secondary" size="sm">
                          {ur.role?.name || ur.role?.code}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        u.status === 'ACTIVE'
                          ? 'success'
                          : u.status === 'SUSPENDED'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {u.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end space-x-1 rtl:space-x-reverse">
                    {/* Status Toggle */}
                    {hasPermission('users.manage') && (
                      <>
                        {u.status === 'ACTIVE' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setStatusMutation.mutate({ id: u.id, status: 'SUSPENDED' })}
                            title="Suspend Account"
                          >
                            <Ban className="h-3.5 w-3.5 text-amber-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setStatusMutation.mutate({ id: u.id, status: 'ACTIVE' })}
                            title="Activate Account"
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                        )}
                      </>
                    )}

                    {/* Assign Roles */}
                    {hasPermission('roles.manage') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(u);
                          setAssignRoleIds(u.userRoles?.map((ur: any) => ur.roleId) || []);
                          setAssignRoleOpen(true);
                        }}
                        title="Configure Roles"
                      >
                        <Shield className="h-3.5 w-3.5 text-sky-600" />
                      </Button>
                    )}

                    {/* Reset Password */}
                    {hasPermission('users.reset_password') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Reset password for ${u.email}?`)) {
                            resetPasswordMutation.mutate(u.id);
                          }
                        }}
                        title="Reset Password"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-zinc-600" />
                      </Button>
                    )}

                    {/* Revoke Sessions */}
                    {hasPermission('users.manage') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => revokeSessionsMutation.mutate(u.id)}
                        title="Revoke Sessions"
                      >
                        <LogOut className="h-3.5 w-3.5 text-rose-600" />
                      </Button>
                    )}

                    {/* Login History */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openHistory(u)}
                      title="View Login History"
                    >
                      <History className="h-3.5 w-3.5 text-zinc-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Provision User Modal */}
      <Modal isOpen={createUserOpen} onClose={() => setCreateUserOpen(false)} title="Provision New User">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input label="Full Name" required placeholder="Marcus Vance" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Corporate Email" type="email" required placeholder="marcus@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />

          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase text-zinc-500">Assign Initial Role</label>
            <select
              className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              value={selectedRoleIds[0] || ''}
              onChange={(e) => setSelectedRoleIds([e.target.value])}
            >
              {roles?.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateUserOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createUserMutation.isPending}>Provision User</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Roles Modal */}
      <Modal isOpen={assignRoleOpen} onClose={() => setAssignRoleOpen(false)} title={`Assign Roles: ${selectedUser?.fullName}`}>
        <div className="space-y-4">
          <div className="space-y-2">
            {roles?.map((r) => {
              const checked = assignRoleIds.includes(r.id);
              return (
                <label key={r.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-zinc-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) setAssignRoleIds([...assignRoleIds, r.id]);
                      else setAssignRoleIds(assignRoleIds.filter((id) => id !== r.id));
                    }}
                  />
                  <div>
                    <p className="text-xs font-semibold">{r.name}</p>
                    <p className="text-[11px] text-zinc-500 font-mono">{r.code}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setAssignRoleOpen(false)}>Cancel</Button>
            <Button
              type="button"
              variant="primary"
              isLoading={assignRolesMutation.isPending}
              onClick={() => assignRolesMutation.mutate({ id: selectedUser.id, roleIds: assignRoleIds })}
            >
              Save Roles
            </Button>
          </div>
        </div>
      </Modal>

      {/* Login History Modal */}
      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title={`Login History: ${selectedUser?.fullName}`}>
        {loginHistoryList.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 text-center">No login events recorded.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Outcome</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loginHistoryList.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>
                    <Badge variant={h.success ? 'success' : 'danger'} size="sm">
                      {h.success ? 'Success' : `Failed (${h.reason})`}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{h.ipAddress || '127.0.0.1'}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{formatDate(h.createdAt, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Modal>
    </div>
  );
}
