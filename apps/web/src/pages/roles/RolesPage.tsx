import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ShieldCheck, Edit, Check } from 'lucide-react';

export function RolesPage() {
  const { t } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [editPermsOpen, setEditPermsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const { data: roles, isLoading: loadingRoles } = useQuery<any[]>({
    queryKey: ['roles', selectedCompanyId],
    queryFn: () => api.get<any[]>('/roles'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: permissions, isLoading: loadingPerms } = useQuery<any[]>({
    queryKey: ['permissions'],
    queryFn: () => api.get<any[]>('/permissions'),
  });

  const updatePermsMutation = useMutation({
    mutationFn: ({ id, permissionKeys }: { id: string; permissionKeys: string[] }) =>
      api.post(`/roles/${id}/permissions`, { permissionKeys }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setEditPermsOpen(false);
    },
  });

  const openEdit = (role: any) => {
    setSelectedRole(role);
    const existing = role.permissions?.map((p: any) => p.permission?.key) || [];
    setSelectedKeys(existing);
    setEditPermsOpen(true);
  };

  const handleToggleKey = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.roles', 'Role & Permission Matrix')}
          </h1>
          <p className="text-xs text-zinc-500">
            Fine-grained resource.action security controls enforced across all backend endpoints
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Configured Security Roles</CardTitle>
            <CardDescription>System and company-level role definitions</CardDescription>
          </div>
        </CardHeader>

        {loadingRoles ? (
          <LoadingSpinner size="md" />
        ) : !roles || roles.length === 0 ? (
          <EmptyState title="No roles found" description="System roles are created during seed." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Code</TableHead>
                <TableHead>Role Name</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Granted Permissions</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs font-bold">{r.code}</TableCell>
                  <TableCell className="font-semibold">{r.name}</TableCell>
                  <TableCell>
                    <Badge variant={r.isPlatform ? 'danger' : 'secondary'} size="sm">
                      {r.isPlatform ? 'Platform Wide' : 'Company Scoped'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">
                    {r.isPlatform && r.code === 'SUPER_ADMIN'
                      ? 'Full Platform Bypass (*)'
                      : `${r.permissions?.length || 0} permissions`}
                  </TableCell>
                  <TableCell className="text-end">
                    {hasPermission('roles.manage') && !(r.isPlatform && r.code === 'SUPER_ADMIN') && (
                      <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                        <Edit className="h-3.5 w-3.5 me-1 text-emerald-600" />
                        Edit Matrix
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Edit Permissions Modal */}
      <Modal
        isOpen={editPermsOpen}
        onClose={() => setEditPermsOpen(false)}
        title={`Permission Matrix: ${selectedRole?.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-500">
            Configure granular resource.action grants for <span className="font-semibold text-zinc-800">{selectedRole?.code}</span>.
          </p>

          <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto p-1 border rounded-lg">
            {permissions?.map((p) => {
              const checked = selectedKeys.includes(p.key);
              return (
                <label
                  key={p.key}
                  className={`flex items-center gap-2 p-2 rounded text-xs border cursor-pointer transition-colors ${
                    checked ? 'bg-emerald-50/60 border-emerald-300 font-medium' : 'hover:bg-zinc-50 border-zinc-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleKey(p.key)}
                  />
                  <div>
                    <p className="font-mono text-[11px] font-semibold text-zinc-900">{p.key}</p>
                    <p className="text-[10px] text-zinc-400">{p.resource} • {p.action}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-xs text-zinc-500">{selectedKeys.length} permissions selected</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setEditPermsOpen(false)}>Cancel</Button>
              <Button
                type="button"
                variant="primary"
                isLoading={updatePermsMutation.isPending}
                onClick={() =>
                  updatePermsMutation.mutate({
                    id: selectedRole.id,
                    permissionKeys: selectedKeys,
                  })
                }
              >
                Apply Permissions
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
