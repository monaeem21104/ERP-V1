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
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Plus } from 'lucide-react';

export function SuppliersPage() {
  const { t } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const { data: suppliers, isLoading } = useQuery<any[]>({
    queryKey: ['suppliers', selectedCompanyId],
    queryFn: () => api.get<any[]>('/suppliers'),
    enabled: Boolean(selectedCompanyId),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/suppliers', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setCreateModalOpen(false);
      setCode('');
      setName('');
      setEmail('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ code, name, email });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.suppliers', 'Supplier & Vendor Directory')}
          </h1>
          <p className="text-xs text-zinc-500">
            {t('suppliers.subtitle', 'Manage raw material suppliers, vendor contacts, and procurement channels')}
          </p>
        </div>

        {hasPermission('suppliers.create') && (
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Supplier</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Suppliers & Vendors</CardTitle>
            <CardDescription>Approved external suppliers for purchasing orders</CardDescription>
          </div>
        </CardHeader>

        {isLoading ? (
          <LoadingSpinner size="md" />
        ) : !suppliers || suppliers.length === 0 ? (
          <EmptyState
            title="No suppliers registered"
            description="Add your first supplier to issue purchase orders and receive inventory."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs font-semibold">{s.code}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{s.email || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={s.isActive ? 'success' : 'secondary'} size="sm">
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Register Supplier">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Supplier Code" required placeholder="SUPP-5001" value={code} onChange={(e) => setCode(e.target.value)} />
          <Input label="Vendor / Company Name" required placeholder="Global Metallurgy Supplies Ltd" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Contact Email" type="email" placeholder="orders@globalmetal.com" value={email} onChange={(e) => setEmail(e.target.value)} />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>Save Supplier</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
