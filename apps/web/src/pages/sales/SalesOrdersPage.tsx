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
import { Plus, Check, Truck, FileText, DollarSign, Trash2 } from 'lucide-react';

export function SalesOrdersPage() {
  const { t, i18n } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const locale = i18n.language;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deliverModalOpen, setDeliverModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedSo, setSelectedSo] = useState<any>(null);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [discountPct, setDiscountPct] = useState('0');
  const [lines, setLines] = useState([{ productId: '', qtyOrdered: '1', unitPrice: '0', taxRate: '0' }]);
  const [warehouseId, setWarehouseId] = useState('');
  const [deliverLines, setDeliverLines] = useState<any[]>([]);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('BANK');

  // Queries
  const { data: salesOrders, isLoading } = useQuery<any[]>({
    queryKey: ['salesOrders', selectedCompanyId],
    queryFn: () => api.get<any[]>('/sales-orders'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: customers } = useQuery<any[]>({
    queryKey: ['customers', selectedCompanyId],
    queryFn: () => api.get<any[]>('/customers'),
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
    mutationFn: (body: any) => api.post('/sales-orders', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCreateModalOpen(false);
      setLines([{ productId: '', qtyOrdered: '1', unitPrice: '0', taxRate: '0' }]);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/sales-orders/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deliverMutation = useMutation({
    mutationFn: (body: any) => api.post(`/sales-orders/${selectedSo.id}/deliver`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeliverModalOpen(false);
    },
  });

  const invoiceMutation = useMutation({
    mutationFn: (id: string) => api.post(`/sales-orders/${id}/invoice`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const payMutation = useMutation({
    mutationFn: (body: any) => api.post('/payments', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setPayModalOpen(false);
    },
  });

  const handleAddLine = () => {
    setLines([...lines, { productId: '', qtyOrdered: '1', unitPrice: '0', taxRate: '0' }]);
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
      customerId,
      discountPct,
      lines,
    });
  };

  const openDeliverModal = (so: any) => {
    setSelectedSo(so);
    setWarehouseId(warehouses?.[0]?.id || '');
    setDeliverLines(
      so.lines.map((l: any) => ({
        soLineId: l.id,
        productId: l.productId,
        qty: String(Number(l.qtyOrdered) - Number(l.qtyDelivered)),
        maxQty: Number(l.qtyOrdered) - Number(l.qtyDelivered),
      }))
    );
    setDeliverModalOpen(true);
  };

  const handleDeliverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    deliverMutation.mutate({
      warehouseId,
      lines: deliverLines.map((l) => ({ soLineId: l.soLineId, qty: l.qty })),
    });
  };

  const openPayModal = (so: any) => {
    setSelectedSo(so);
    setPayAmount('100');
    setPayModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.sales', 'Sales Orders')}
          </h1>
          <p className="text-xs text-zinc-500">
            {t('sales.subtitle', 'Manage customer quotations, sales orders, delivery notes, and billing')}
          </p>
        </div>

        {hasPermission('sales.create') && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{t('sales.newOrder', 'New Sales Order')}</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{t('sales.ordersList', 'Order Register')}</CardTitle>
            <CardDescription>{t('sales.ordersDesc', 'Database records for all sales commitments')}</CardDescription>
          </div>
        </CardHeader>

        {isLoading ? (
          <LoadingSpinner size="md" />
        ) : !salesOrders || salesOrders.length === 0 ? (
          <EmptyState
            title={t('sales.noOrders', 'No sales orders found')}
            description={t('sales.emptyDesc', 'Create your first sales order to start processing shipments.')}
            action={
              hasPermission('sales.create') ? (
                <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 me-1" />
                  {t('sales.newOrder', 'New Sales Order')}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.number', 'Order #')}</TableHead>
                <TableHead>{t('common.customer', 'Customer')}</TableHead>
                <TableHead>{t('common.items', 'Lines')}</TableHead>
                <TableHead>{t('common.status', 'Status')}</TableHead>
                <TableHead>{t('common.date', 'Created')}</TableHead>
                <TableHead className="text-end">{t('common.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesOrders.map((so) => (
                <TableRow key={so.id}>
                  <TableCell className="font-mono text-xs font-semibold">{so.number}</TableCell>
                  <TableCell className="font-medium">{so.customer?.name}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{so.lines?.length || 0} items</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        so.status === 'COMPLETED'
                          ? 'success'
                          : so.status === 'APPROVED'
                          ? 'info'
                          : so.status === 'PARTIAL'
                          ? 'warning'
                          : 'secondary'
                      }
                      size="sm"
                    >
                      {so.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">{formatDate(so.createdAt, locale)}</TableCell>
                  <TableCell className="text-end space-x-1 rtl:space-x-reverse">
                    {so.status === 'DRAFT' && hasPermission('sales.approve') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => approveMutation.mutate(so.id)}
                        isLoading={approveMutation.isPending}
                        title="Approve Order"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      </Button>
                    )}

                    {['APPROVED', 'PARTIAL'].includes(so.status) && hasPermission('sales.deliver') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeliverModal(so)}
                        title="Deliver Goods"
                      >
                        <Truck className="h-3.5 w-3.5 text-sky-600" />
                      </Button>
                    )}

                    {['APPROVED', 'PARTIAL', 'COMPLETED'].includes(so.status) && hasPermission('accounting.create') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => invoiceMutation.mutate(so.id)}
                        isLoading={invoiceMutation.isPending}
                        title="Generate Sales Invoice"
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

      {/* Create Sales Order Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('sales.createTitle', 'Create Sales Order')}
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label={t('common.customer', 'Customer')}
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">{t('common.selectCustomer', 'Select Customer')}</option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </Select>

            <Input
              label={t('sales.discountPct', 'Discount %')}
              type="number"
              step="0.01"
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
            />
          </div>

          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-zinc-500">Order Lines</span>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                <Plus className="h-3 w-3 me-1" /> Add Item
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
                    label="Unit Price"
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
              {t('common.create', 'Create Order')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deliver Modal */}
      <Modal
        isOpen={deliverModalOpen}
        onClose={() => setDeliverModalOpen(false)}
        title={t('sales.deliverTitle', 'Deliver Goods to Customer')}
      >
        <form onSubmit={handleDeliverSubmit} className="space-y-4">
          <Select
            label={t('common.warehouse', 'Dispatch Warehouse')}
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
            <p className="text-xs font-semibold uppercase text-zinc-500">Quantities to Dispatch</p>
            {deliverLines.map((line, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 bg-zinc-50 p-2 rounded">
                <span className="text-xs font-mono font-medium">{line.productId}</span>
                <div className="w-32">
                  <Input
                    type="number"
                    step="0.01"
                    max={line.maxQty}
                    value={line.qty}
                    onChange={(e) => {
                      const updated = [...deliverLines];
                      updated[idx].qty = e.target.value;
                      setDeliverLines(updated);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setDeliverModalOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={deliverMutation.isPending}>
              {t('sales.confirmDelivery', 'Confirm Dispatch')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
