import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { formatMoney } from '../../lib/format';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Plus, Users2 } from 'lucide-react';

export function CustomersPage() {
  const { t, i18n } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const locale = i18n.language;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [creditLimit, setCreditLimit] = useState('50000');

  const { data: customers, isLoading } = useQuery<any[]>({
    queryKey: ['customers', selectedCompanyId],
    queryFn: () => api.get<any[]>('/customers'),
    enabled: Boolean(selectedCompanyId),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/customers', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setCreateModalOpen(false);
      setCode('');
      setName('');
      setEmail('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ code, name, email, creditLimit });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.customers', 'Customer Relationship Directory')}
          </h1>
          <p className="text-xs text-zinc-500">
            {t('customers.subtitle', 'Manage corporate client accounts, credit limits, and sales profiles')}
          </p>
        </div>

        {hasPermission('customers.create') && (
          <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Customer Accounts</CardTitle>
            <CardDescription>Verified clients and commercial payment terms</CardDescription>
          </div>
        </CardHeader>

        {isLoading ? (
          <LoadingSpinner size="md" />
        ) : !customers || customers.length === 0 ? (
          <EmptyState
            title="No customers registered"
            description="Add your first customer to establish accounts and sales orders."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Credit Limit</TableHead>
                <TableHead>Account Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs font-semibold">{c.code}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{c.email || '—'}</TableCell>
                  <TableCell className="font-semibold">{formatMoney(c.creditLimit, locale)}</TableCell>
                  <TableCell>
                    <Badge variant={c.isActive ? 'success' : 'secondary'} size="sm">
                      {c.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Add Customer Profile">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Customer Code" required placeholder="CUST-1001" value={code} onChange={(e) => setCode(e.target.value)} />
          <Input label="Company Name" required placeholder="Acme Industrial Corp" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Contact Email" type="email" placeholder="billing@acme.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Credit Limit ($)" type="number" step="0.01" required value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>Save Profile</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
