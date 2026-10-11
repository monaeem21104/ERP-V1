import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { formatMoney, formatDate } from '../../lib/format';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Plus, Check, Download, FileText, Trash2 } from 'lucide-react';

export function PurchasingPage() {
  const { t, i18n } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const locale = i18n.language;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<any>(null);

  // Form states
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([{ productId: '', qtyOrdered: '10', unitPrice: '0', taxRate: '0' }]);
  const [warehouseId, setWarehouseId] = useState('');
  const [receiveLines, setReceiveLines] = useState<any[]>([]);

  // Queries
  const { data: purchaseOrders, isLoading } = useQuery<any[]>({
    queryKey: ['purchaseOrders', selectedCompanyId],
    queryFn: () => api.get<any[]>('/purchase-orders'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: suppliers } = useQuery<any[]>({
    queryKey: ['suppliers', selectedCompanyId],
    queryFn: () => api.get<any[]>('/suppliers'),
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/purchase-orders', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCreateModalOpen(false);
      setLines([{ productId: '', qtyOrdered: '10', unitPrice: '0', taxRate: '0' }]);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/purchase-orders/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: (body: any) => api.post(`/purchase-orders/${selectedPo.id}/receive`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setReceiveModalOpen(false);
    },
  });

  const invoiceMutation = useMutation({
    mutationFn: (id: string) => api.post(`/purchase-orders/${id}/invoice`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleAddLine = () => {
    setLines([...lines, { productId: '', qtyOrdered: '10', unitPrice: '0', taxRate: '0' }]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (index: number, field: string, value: string) => {
    const updated = [...lines];
    (updated[index] as any)[field] = value;
    setLines(updated);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      supplierId,
      notes,
      lines,
    });
  };

  const openReceiveModal = (po: any) => {
    setSelectedPo(po);
    setWarehouseId(warehouses?.[0]?.id || '');
    setReceiveLines(
      po.lines.map((l: any) => ({
        poLineId: l.id,
        productId: l.productId,
        qty: String(Number(l.qtyOrdered) - Number(l.qtyReceived)),
        maxQty: Number(l.qtyOrdered) - Number(l.qtyReceived),
      }))
    );
    setReceiveModalOpen(true);
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    receiveMutation.mutate({
      warehouseId,
      lines: receiveLines.map((l) => ({ poLineId: l.poLineId, qty: l.qty })),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.purchases', 'Purchase Orders')}
          </h1>
          <p className="text-xs text-zinc-500">
            {t('purchasing.subtitle', 'Manage supplier orders, goods receipts, and vendor invoices')}
          </p>
        </div>

        {hasPermission('purchasing.create') && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{t('purchasing.newPo', 'New Purchase Order')}</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t('purchasing.poList', 'Purchase Order Register')}</CardTitle>
            <CardDescription>{t('purchasing.poDesc', 'Procurement documents and inbound receipt workflows')}</CardDescription>
          </div>
        </CardHeader>

        {isLoading ? (
          <LoadingSpinner size="md" />
        ) : !purchaseOrders || purchaseOrders.length === 0 ? (
          <EmptyState
            title={t('purchasing.noPo', 'No purchase orders found')}
            description={t('purchasing.emptyDesc', 'Generate a purchase order to order raw materials or goods.')}
            action={
              hasPermission('purchasing.create') ? (
                <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 me-1" />
                  {t('purchasing.newPo', 'New Purchase Order')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.number', 'PO #')}</TableHead>
                <TableHead>{t('common.supplier', 'Supplier')}</TableHead>
                <TableHead>{t('common.items', 'Lines')}</TableHead>
                <TableHead>{t('common.status', 'Status')}</TableHead>
                <TableHead>{t('common.date', 'Date')}</TableHead>
                <TableHead className="text-end">{t('common.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-mono text-xs font-semibold">{po.number}</TableCell>
                  <TableCell className="font-medium">{po.supplier?.name}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{po.lines?.length || 0} items</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        po.status === 'COMPLETED'
                          ? 'success'
                          : po.status === 'APPROVED'
                          ? 'info'
                          : po.status === 'PARTIAL'
                          ? 'warning'
                          : 'secondary'
                      }
                      size="sm"
                    >
                      {po.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">{formatDate(po.createdAt, locale)}</TableCell>
                  <TableCell className="text-end space-x-1 rtl:space-x-reverse">
                    {po.status === 'DRAFT' && hasPermission('purchasing.approve') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => approveMutation.mutate(po.id)}
                        isLoading={approveMutation.isPending}
                        title="Approve PO"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      </Button>
                    )}

                    {['APPROVED', 'PARTIAL', 'IN_PROGRESS'].includes(po.status) && hasPermission('purchasing.receive') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReceiveModal(po)}
                        title="Receive Inbound Goods (GRN)"
                      >
                        <Download className="h-3.5 w-3.5 text-sky-600" />
                      </Button>
                    )}

                    {['PARTIAL', 'COMPLETED'].includes(po.status) && hasPermission('accounting.create') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => invoiceMutation.mutate(po.id)}
                        isLoading={invoiceMutation.isPending}
                        title="Book Vendor Invoice"
                      >
                        <FileText className="h-3.5 w-3.5 text-amber-600" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Create PO Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('purchasing.createTitle', 'Create Purchase Order')}
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Select
            label={t('common.supplier', 'Supplier')}
            required
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">{t('common.selectSupplier', 'Select Supplier')}</option>
            {suppliers?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </Select>

          <Input
            label={t('common.notes', 'Notes & Terms')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Standard net-30 terms"
          />

          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-zinc-500">Order Lines</span>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                <Plus className="h-3 w-3 me-1" /> Add Line
              </Button>
            </div>

            {lines.map((line, idx) => (
              <div key={idx} className="flex items-end gap-2 bg-zinc-50 p-2.5 rounded-lg">
                <div className="flex-1">
                  <Select
                    label="Product"
                    required
                    value={line.productId}
                    onChange={(e) => handleLineChange(idx, 'productId', e.target.value)}
                  >
                    <option value="">Select SKU</option>
                    {products?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.nameEn}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-24">
                  <Input
                    label="Qty"
                    type="number"
                    step="0.01"
                    required
                    value={line.qtyOrdered}
                    onChange={(e) => handleLineChange(idx, 'qtyOrdered', e.target.value)}
                  />
                </div>
                <div className="w-28">
                  <Input
                    label="Unit Cost"
                    type="number"
                    step="0.01"
                    required
                    value={line.unitPrice}
                    onChange={(e) => handleLineChange(idx, 'unitPrice', e.target.value)}
                  />
                </div>
                {lines.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 mb-0.5"
                    onClick={() => handleRemoveLine(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              {t('common.create', 'Create Purchase Order')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Receive Modal (GRN) */}
      <Modal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        title={t('purchasing.receiveTitle', 'Receive Goods Note (GRN)')}
      >
        <form onSubmit={handleReceiveSubmit} className="space-y-4">
          <Select
            label={t('common.warehouse', 'Receiving Warehouse')}
            required
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            {warehouses?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-zinc-500">Quantities Received</p>
            {receiveLines.map((line, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 bg-zinc-50 p-2 rounded">
                <span className="text-xs font-mono font-medium">{line.productId}</span>
                <div className="w-32">
                  <Input
                    type="number"
                    step="0.01"
                    max={line.maxQty}
                    value={line.qty}
                    onChange={(e) => {
                      const updated = [...receiveLines];
                      updated[idx].qty = e.target.value;
                      setReceiveLines(updated);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setReceiveModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={receiveMutation.isPending}>
              {t('purchasing.confirmReceipt', 'Post to Inventory')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
