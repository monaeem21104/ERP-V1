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
import { RotateCcw, Plus, Check } from 'lucide-react';

export function ReturnsPage() {
  const { t, i18n } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const locale = i18n.language;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);

  // Form states
  const [type, setType] = useState('SALES');
  const [reason, setReason] = useState('Defective goods');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('1');
  const [restockWarehouseId, setRestockWarehouseId] = useState('');

  const { data: returns, isLoading } = useQuery<any[]>({
    queryKey: ['returns', selectedCompanyId],
    queryFn: () => api.get<any[]>('/returns'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: products } = useQuery<any[]>({
    queryKey: ['products', selectedCompanyId],
    queryFn: () => api.get<any[]>('/products'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: warehouses } = useQuery<any[]>({
    queryKey: ['warehouses', selectedCompanyId],
    queryFn: () => api.get<any[]>('/warehouses'),
    enabled: Boolean(selectedCompanyId),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/returns', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      setCreateModalOpen(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (body: any) => api.post(`/returns/${selectedReturn.id}/approve`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryBalances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setApproveModalOpen(false);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      type,
      reason,
      lines: [{ productId, qty }],
    });
  };

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    approveMutation.mutate({
      id: selectedReturn.id,
      warehouseId: restockWarehouseId,
      restock: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.returns', 'Returns & RMA Management')}
          </h1>
          <p className="text-xs text-zinc-500">
            Customer returns, purchase returns, inspection, restocking, and claims
          </p>
        </div>

        {hasPermission('returns.create') && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setProductId(products?.[0]?.id || '');
              setCreateModalOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Create RMA</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Return Authorizations (RMA)</CardTitle>
            <CardDescription>Processed and pending disposition claims</CardDescription>
          </div>
        </CardHeader>

        {isLoading ? (
          <LoadingSpinner size="md" />
        ) : !returns || returns.length === 0 ? (
          <EmptyState title="No returns filed" description="RMA claims will appear here." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RMA #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs font-semibold">{r.number}</TableCell>
                  <TableCell>
                    <Badge variant={r.type === 'SALES' ? 'info' : 'warning'} size="sm">
                      {r.type} Return
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{r.reason || 'General Return'}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'APPROVED' ? 'success' : 'secondary'} size="sm">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">{formatDate(r.createdAt, locale)}</TableCell>
                  <TableCell className="text-end">
                    {r.status === 'DRAFT' && hasPermission('returns.approve') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedReturn(r);
                          setRestockWarehouseId(warehouses?.[0]?.id || '');
                          setApproveModalOpen(true);
                        }}
                      >
                        <Check className="h-3.5 w-3.5 me-1 text-emerald-600" />
                        Approve & Restock
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Issue Return Authorization (RMA)">
        <form onSubmit={handleCreate} className="space-y-4">
          <Select label="Return Category" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="SALES">Customer Sales Return</option>
            <option value="PURCHASE">Vendor Purchase Return</option>
          </Select>

          <Select label="Product SKU" required value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products?.map((p) => (
              <option key={p.id} value={p.id}>{p.sku} - {p.nameEn}</option>
            ))}
          </Select>

          <Input label="Returned Quantity" type="number" step="0.01" required value={qty} onChange={(e) => setQty(e.target.value)} />
          <Input label="Reason for Return" required value={reason} onChange={(e) => setReason(e.target.value)} />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>Issue RMA</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={approveModalOpen} onClose={() => setApproveModalOpen(false)} title="Approve & Restock Goods">
        <form onSubmit={handleApprove} className="space-y-4">
          <p className="text-xs text-zinc-500">
            Approving this RMA will inspect the returned units and increment perpetual inventory in the selected warehouse.
          </p>

          <Select
            label="Restocking Warehouse"
            required
            value={restockWarehouseId}
            onChange={(e) => setRestockWarehouseId(e.target.value)}
          >
            {warehouses?.map((w) => (
              <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setApproveModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={approveMutation.isPending}>Confirm Restocking</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
