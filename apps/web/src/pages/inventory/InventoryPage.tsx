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
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Plus, Sliders, Boxes, AlertTriangle, Layers } from 'lucide-react';

export function InventoryPage() {
  const { t, i18n } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const locale = i18n.language;

  const [activeTab, setActiveTab] = useState<'balances' | 'products' | 'lowStock'>('balances');
  const [createProductModalOpen, setCreateProductModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);

  // Form state
  const [sku, setSku] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [uomId, setUomId] = useState('');
  const [reorderLevel, setReorderLevel] = useState('10');

  const [adjustWarehouseId, setAdjustWarehouseId] = useState('');
  const [adjustProductId, setAdjustProductId] = useState('');
  const [qtyDelta, setQtyDelta] = useState('0');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Queries
  const { data: balances, isLoading: loadingBalances } = useQuery<any[]>({
    queryKey: ['inventoryBalances', selectedCompanyId],
    queryFn: () => api.get<any[]>('/inventory/balances'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: products, isLoading: loadingProducts } = useQuery<any[]>({
    queryKey: ['products', selectedCompanyId],
    queryFn: () => api.get<any[]>('/products'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: lowStock } = useQuery<any[]>({
    queryKey: ['lowStock', selectedCompanyId],
    queryFn: () => api.get<any[]>('/inventory/low-stock'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: valuation } = useQuery<{ inventoryValuation: string; lines: number }>({
    queryKey: ['inventoryValuation', selectedCompanyId],
    queryFn: () => api.get<{ inventoryValuation: string; lines: number }>('/inventory/valuation'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: warehouses } = useQuery<any[]>({
    queryKey: ['warehouses', selectedCompanyId],
    queryFn: () => api.get<any[]>('/warehouses'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: uoms } = useQuery<any[]>({
    queryKey: ['uom', selectedCompanyId],
    queryFn: () => api.get<any[]>('/uom'),
    enabled: Boolean(selectedCompanyId),
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: (body: any) => api.post('/products', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setCreateProductModalOpen(false);
      setSku('');
      setNameEn('');
      setNameAr('');
    },
  });

  const adjustMutation = useMutation({
    mutationFn: (body: any) => api.post('/inventory/adjust', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryBalances'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryValuation'] });
      queryClient.invalidateQueries({ queryKey: ['lowStock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setAdjustModalOpen(false);
      setQtyDelta('0');
      setAdjustNotes('');
    },
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    createProductMutation.mutate({
      sku,
      nameEn,
      nameAr,
      uomId: uomId || uoms?.[0]?.id,
      reorderLevel,
    });
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustMutation.mutate({
      warehouseId: adjustWarehouseId || warehouses?.[0]?.id,
      productId: adjustProductId,
      qtyDelta,
      notes: adjustNotes,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.inventory', 'Inventory & Stock Management')}
          </h1>
          <p className="text-xs text-zinc-500">
            {t('inventory.subtitle', 'Real-time perpetual inventory balances, SKU valuation, and stock control')}
          </p>
        </div>

        <div className="flex gap-2">
          {hasPermission('inventory.adjust') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAdjustWarehouseId(warehouses?.[0]?.id || '');
                setAdjustProductId(products?.[0]?.id || '');
                setAdjustModalOpen(true);
              }}
              className="gap-1.5"
            >
              <Sliders className="h-4 w-4" />
              <span>{t('inventory.adjustStock', 'Adjust Stock')}</span>
            </Button>
          )}

          {hasPermission('products.create') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setUomId(uoms?.[0]?.id || '');
                setCreateProductModalOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>{t('inventory.newProduct', 'New Product SKU')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Valuation Banner */}
      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-600 p-2 text-white">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Total Perpetual Valuation
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                {formatMoney(valuation?.inventoryValuation ?? '0', locale)}
              </p>
            </div>
          </div>
          <div className="text-xs text-emerald-800 dark:text-emerald-400">
            <span>{valuation?.lines ?? 0} active stock balance lines tracked</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <button
          onClick={() => setActiveTab('balances')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'balances'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>{t('inventory.balances', 'Stock Balances')}</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>{t('inventory.catalog', 'Product Catalog (SKUs)')}</span>
        </button>

        <button
          onClick={() => setActiveTab('lowStock')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'lowStock'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>{t('dash.lowStock', 'Low Stock Alerts')} ({lowStock?.length || 0})</span>
        </button>
      </div>

      {/* Tab: Stock Balances */}
      {activeTab === 'balances' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t('inventory.balances', 'Perpetual Balances')}</CardTitle>
              <CardDescription>On-hand quantities by warehouse with moving average unit cost</CardDescription>
            </div>
          </CardHeader>

          {loadingBalances ? (
            <LoadingSpinner size="md" />
          ) : !balances || balances.length === 0 ? (
            <EmptyState
              title="No stock balances recorded"
              description="Stock balances are created when goods are received or adjusted."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Qty On Hand</TableHead>
                  <TableHead>Avg Cost</TableHead>
                  <TableHead>Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((b) => {
                  const total = (Number(b.qtyOnHand) * Number(b.avgCost)).toFixed(2);
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-semibold">{b.warehouse?.name}</TableCell>
                      <TableCell className="font-mono text-xs">{b.product?.sku}</TableCell>
                      <TableCell>{locale === 'ar' && b.product?.nameAr ? b.product.nameAr : b.product?.nameEn}</TableCell>
                      <TableCell className="font-bold text-zinc-900 dark:text-zinc-100">{b.qtyOnHand}</TableCell>
                      <TableCell>{formatMoney(b.avgCost, locale)}</TableCell>
                      <TableCell className="font-semibold">{formatMoney(total, locale)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Tab: Products */}
      {activeTab === 'products' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Catalog Products & SKUs</CardTitle>
              <CardDescription>Raw materials, sub-assemblies, and finished goods</CardDescription>
            </div>
          </CardHeader>

          {loadingProducts ? (
            <LoadingSpinner size="md" />
          ) : !products || products.length === 0 ? (
            <EmptyState
              title="No products defined"
              description="Define master data items with SKUs and units of measure."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name (English)</TableHead>
                  <TableHead>Name (Arabic)</TableHead>
                  <TableHead>UoM</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-semibold">{p.sku}</TableCell>
                    <TableCell className="font-medium">{p.nameEn}</TableCell>
                    <TableCell className="font-arabic">{p.nameAr || '—'}</TableCell>
                    <TableCell className="text-xs text-zinc-500">{p.uom?.code || 'EA'}</TableCell>
                    <TableCell className="text-zinc-600">{p.reorderLevel}</TableCell>
                    <TableCell>
                      <Badge variant={p.isActive ? 'success' : 'secondary'} size="sm">
                        {p.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Tab: Low Stock */}
      {activeTab === 'lowStock' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Inventory items where total on-hand is at or below the reorder threshold</CardDescription>
            </div>
          </CardHeader>

          {!lowStock || lowStock.length === 0 ? (
            <EmptyState
              title="All stock levels healthy"
              description="No items have reached their reorder limits."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Current On Hand</TableHead>
                  <TableHead>Reorder Threshold</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.map((l) => (
                  <TableRow key={l.productId}>
                    <TableCell className="font-mono text-xs">{l.sku}</TableCell>
                    <TableCell className="font-medium">{locale === 'ar' && l.nameAr ? l.nameAr : l.nameEn}</TableCell>
                    <TableCell className="font-bold text-rose-600">{l.onHand}</TableCell>
                    <TableCell>{l.reorderLevel}</TableCell>
                    <TableCell>
                      <Badge variant="warning" size="sm">Reorder Required</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Create Product Modal */}
      <Modal
        isOpen={createProductModalOpen}
        onClose={() => setCreateProductModalOpen(false)}
        title="Create Product SKU"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input
            label="SKU Code"
            required
            placeholder="RAW-STEEL-001"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />

          <Input
            label="Name (English)"
            required
            placeholder="Industrial Steel Sheet 2mm"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
          />

          <Input
            label="Name (Arabic)"
            required
            placeholder="لوح صلب صناعي 2 مم"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
          />

          <Select
            label="Unit of Measure"
            value={uomId}
            onChange={(e) => setUomId(e.target.value)}
          >
            {uoms?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.code} - {u.nameEn} ({u.nameAr})
              </option>
            ))}
          </Select>

          <Input
            label="Reorder Level Threshold"
            type="number"
            step="0.01"
            required
            value={reorderLevel}
            onChange={(e) => setReorderLevel(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateProductModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createProductMutation.isPending}>
              Create SKU
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Adjust Inventory Balance"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <Select
            label="Warehouse"
            required
            value={adjustWarehouseId}
            onChange={(e) => setAdjustWarehouseId(e.target.value)}
          >
            {warehouses?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          <Select
            label="Product SKU"
            required
            value={adjustProductId}
            onChange={(e) => setAdjustProductId(e.target.value)}
          >
            {products?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} - {p.nameEn}
              </option>
            ))}
          </Select>

          <Input
            label="Quantity Delta (+ for in, - for out)"
            type="number"
            step="0.01"
            required
            value={qtyDelta}
            onChange={(e) => setQtyDelta(e.target.value)}
            helperText="Positive adds stock; negative removes stock."
          />

          <Input
            label="Audit Notes / Reason"
            placeholder="Physical count correction, cycle count"
            value={adjustNotes}
            onChange={(e) => setAdjustNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={adjustMutation.isPending}>
              Post Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
