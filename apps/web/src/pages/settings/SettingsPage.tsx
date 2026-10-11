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
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Settings as SettingsIcon, Building, Plus, Shield } from 'lucide-react';

export function SettingsPage() {
  const { t } = useTranslation();
  const { user, hasPermission, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');

  const { data: companies, isLoading } = useQuery<any[]>({
    queryKey: ['companies'],
    queryFn: () => api.get<any[]>('/companies'),
  });

  const createCompanyMutation = useMutation({
    mutationFn: (body: any) => api.post('/companies', body),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      await refreshUser();
      setCreateCompanyOpen(false);
      setCode('');
      setName('');
    },
  });

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    createCompanyMutation.mutate({ code, name, currencyCode });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.settings', 'Organization & System Settings')}
          </h1>
          <p className="text-xs text-zinc-500">
            Company tenant configurations, currency standards, and accounting policies
          </p>
        </div>

        {hasPermission('companies.manage') && (
          <Button variant="primary" size="sm" onClick={() => setCreateCompanyOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Create Company Tenant</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Company Entities</CardTitle>
            <CardDescription>Multi-tenant business organizations</CardDescription>
          </div>
        </CardHeader>

        {isLoading ? (
          <LoadingSpinner size="md" />
        ) : !companies || companies.length === 0 ? (
          <p className="text-xs text-zinc-400 py-6 text-center">No companies available.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Legal Entity Name</TableHead>
                <TableHead>Functional Currency</TableHead>
                <TableHead>Inventory Valuation</TableHead>
                <TableHead>Negative Stock Policy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs font-bold">{c.code}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="font-mono text-xs">{c.currencyCode || 'USD'}</TableCell>
                  <TableCell>
                    <Badge variant="info" size="sm">
                      {c.valuationMethod || 'WEIGHTED_AVERAGE'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.allowNegativeStock ? 'danger' : 'success'} size="sm">
                      {c.allowNegativeStock ? 'Permitted' : 'Strict (Forbidden)'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold">Security & Architecture Compliance</h4>
            <p className="mt-1 text-xs text-zinc-500 leading-relaxed max-w-2xl">
              System operates as an industrial modular monolith with database transactions, immutable ledgers, Argon2id hashing, and HttpOnly session cookies. Microservices are deliberately avoided to guarantee strict ACID transactions on stock and double-entry journals.
            </p>
          </div>
        </div>
      </Card>

      <Modal isOpen={createCompanyOpen} onClose={() => setCreateCompanyOpen(false)} title="Register New Company Tenant">
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <Input label="Company Code" required placeholder="CORP" value={code} onChange={(e) => setCode(e.target.value)} />
          <Input label="Legal Company Name" required placeholder="Nova Manufacturing Holding Inc." value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Default Currency Code" required placeholder="USD" value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateCompanyOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createCompanyMutation.isPending}>Register Company</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
