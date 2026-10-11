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
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ArrowLeftRight, Warehouse as WhIcon } from 'lucide-react';

export function WarehousesPage() {
  const { t } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [transferProductId, setTransferProductId] = useState('');
  const [transferQty, setTransferQty] = useState('10');
  const [transferError, setTransferError] = useState<string | null>(null);

  const { data: warehouses, isLoading } = useQuery<any[]>({
    queryKey: ['warehouses', selectedCompanyId],
    queryFn: () => api.get<any[]>('/warehouses'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: products } = useQuery<any[]>({
    queryKey: ['products', selectedCompanyId],
    queryFn: () => api.get<any[]>('/products'),
    enabled: Boolean(selectedCompanyId),
  });

  const transferMutation = useMutation({
    mutationFn: (body: any) => api.post('/inventory/transfers', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryBalances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setTransferModalOpen(false);
      setTransferQty('10');
    },
    onError: (err: any) => {
      setTransferError(err.message || 'Transfer failed');
    },
  });

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    if (fromWarehouseId === toWarehouseId) {
      setTransferError('Origin and destination warehouses must be different');
      return;
    }
    transferMutation.mutate({
      fromWarehouseId,
      toWarehouseId,
      lines: [{ productId: transferProductId, qty: transferQty }],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.warehouses', 'Warehouses & Stock Transfers')}
          </h1>
          <p className="text-xs text-zinc-500">
            Storage locations, dispatch hubs, and inter-facility inventory movements
          </p>
        </div>

        {hasPermission('inventory.transfer') && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setTransferError(null);
              setFromWarehouseId(warehouses?.[0]?.id || '');
              setToWarehouseId(warehouses?.[1]?.id || warehouses?.[0]?.id || '');
              setTransferProductId(products?.[0]?.id || '');
              setTransferModalOpen(true);
            }}
            className="gap-1.5"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Transfer Stock</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Physical Storage Locations</CardTitle>
            <CardDescription>Configured facility warehouses</CardDescription>
          </div>
        </CardHeader>

        {isLoading ? (
          <LoadingSpinner size="md" />
        ) : !warehouses || warehouses.length === 0 ? (
          <EmptyState title="No warehouses configured" description="Company facilities will appear here." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Warehouse Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono text-xs font-semibold">{w.code}</TableCell>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{w.branch?.name || 'Main Branch'}</TableCell>
                  <TableCell>
                    <Badge variant="success" size="sm">Active Hub</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Modal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} title="Inter-Warehouse Stock Transfer">
        <form onSubmit={handleTransfer} className="space-y-4">
          {transferError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {transferError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select label="Origin Facility" required value={fromWarehouseId} onChange={(e) => setFromWarehouseId(e.target.value)}>
              {warehouses?.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </Select>

            <Select label="Destination Facility" required value={toWarehouseId} onChange={(e) => setToWarehouseId(e.target.value)}>
              {warehouses?.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </Select>
          </div>

          <Select label="Product SKU" required value={transferProductId} onChange={(e) => setTransferProductId(e.target.value)}>
            {products?.map((p) => (
              <option key={p.id} value={p.id}>{p.sku} - {p.nameEn}</option>
            ))}
          </Select>

          <Input
            label="Transfer Quantity"
            type="number"
            step="0.01"
            required
            value={transferQty}
            onChange={(e) => setTransferQty(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setTransferModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={transferMutation.isPending}>Execute Transfer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
