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
import {
  Plus,
  Play,
  CheckCircle,
  Flame,
  PackageCheck,
  ShieldCheck,
  Layers,
  Factory,
  Trash2,
} from 'lucide-react';

export function ManufacturingPage() {
  const { t, i18n } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const locale = i18n.language;

  const [activeTab, setActiveTab] = useState<'orders' | 'boms'>('orders');
  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false);
  const [createBomModalOpen, setCreateBomModalOpen] = useState(false);
  const [consumeModalOpen, setConsumeModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedMo, setSelectedMo] = useState<any>(null);

  // Form states
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [qtyPlanned, setQtyPlanned] = useState('10');
  const [bomId, setBomId] = useState('');

  // BOM Form
  const [bomProductId, setBomProductId] = useState('');
  const [bomLines, setBomLines] = useState([{ componentId: '', qty: '1', scrapPct: '0' }]);

  // Consume Form
  const [consumeProductId, setConsumeProductId] = useState('');
  const [consumeWarehouseId, setConsumeWarehouseId] = useState('');
  const [consumeQty, setConsumeQty] = useState('1');

  // Receive Form
  const [receiveWarehouseId, setReceiveWarehouseId] = useState('');
  const [receiveQty, setReceiveQty] = useState('1');
  const [receiveUnitCost, setReceiveUnitCost] = useState('50');

  // Queries
  const { data: productionOrders, isLoading: loadingOrders } = useQuery<any[]>({
    queryKey: ['productionOrders', selectedCompanyId],
    queryFn: () => api.get<any[]>('/production-orders'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: boms, isLoading: loadingBoms } = useQuery<any[]>({
    queryKey: ['boms', selectedCompanyId],
    queryFn: () => api.get<any[]>('/boms'),
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
  const createOrderMutation = useMutation({
    mutationFn: (body: any) => api.post('/production-orders', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCreateOrderModalOpen(false);
    },
  });

  const createBomMutation = useMutation({
    mutationFn: (body: any) => api.post('/boms', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      setCreateBomModalOpen(false);
      setBomLines([{ componentId: '', qty: '1', scrapPct: '0' }]);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.post(`/production-orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const consumeMutation = useMutation({
    mutationFn: (body: any) => api.post(`/production-orders/${selectedMo.id}/consume`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryBalances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setConsumeModalOpen(false);
    },
  });

  const receiveMutation = useMutation({
    mutationFn: (body: any) => api.post(`/production-orders/${selectedMo.id}/receive`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryBalances'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setReceiveModalOpen(false);
    },
  });

  const qualityMutation = useMutation({
    mutationFn: ({ checkId, passed }: { checkId: string; passed: boolean }) =>
      api.post(`/quality-checks/${checkId}`, { passed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productionOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    createOrderMutation.mutate({
      productId,
      warehouseId,
      qtyPlanned,
      bomId: bomId || undefined,
    });
  };

  const handleCreateBom = (e: React.FormEvent) => {
    e.preventDefault();
    createBomMutation.mutate({
      productId: bomProductId,
      lines: bomLines,
    });
  };

  const openConsume = (mo: any) => {
    setSelectedMo(mo);
    setConsumeWarehouseId(warehouses?.[0]?.id || '');
    setConsumeProductId(products?.[0]?.id || '');
    setConsumeQty('1');
    setConsumeModalOpen(true);
  };

  const openReceive = (mo: any) => {
    setSelectedMo(mo);
    setReceiveWarehouseId(mo.warehouseId || warehouses?.[0]?.id || '');
    setReceiveQty(mo.qtyPlanned);
    setReceiveUnitCost('45');
    setReceiveModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.manufacturing', 'Manufacturing & Production')}
          </h1>
          <p className="text-xs text-zinc-500">
            {t('mfg.subtitle', 'Bill of Materials, shop-floor work orders, consumption, and quality control')}
          </p>
        </div>

        <div className="flex gap-2">
          {hasPermission('manufacturing.create') && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBomProductId(products?.[0]?.id || '');
                  setCreateBomModalOpen(true);
                }}
                className="gap-1.5"
              >
                <Layers className="h-4 w-4" />
                <span>Create BOM</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setProductId(products?.[0]?.id || '');
                  setWarehouseId(warehouses?.[0]?.id || '');
                  setCreateOrderModalOpen(true);
                }}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>New Production Order</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Factory className="h-4 w-4" />
          <span>Production Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('boms')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'boms'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Bills of Materials (BOM)</span>
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Production Orders</CardTitle>
              <CardDescription>
                Controlled lifecycle: Draft → Approved → Planned → In Progress → Completed → Closed
              </CardDescription>
            </div>
          </CardHeader>

          {loadingOrders ? (
            <LoadingSpinner size="md" />
          ) : !productionOrders || productionOrders.length === 0 ? (
            <EmptyState
              title="No production orders found"
              description="Create a production order to begin shop-floor assembly and raw material consumption."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Planned / Completed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quality Check</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productionOrders.map((mo) => {
                  const check = mo.qualityChecks?.[0];
                  return (
                    <TableRow key={mo.id}>
                      <TableCell className="font-mono text-xs font-semibold">{mo.number}</TableCell>
                      <TableCell className="font-medium">{mo.productId}</TableCell>
                      <TableCell>
                        <span className="font-semibold">{mo.qtyCompleted}</span> / {mo.qtyPlanned}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            mo.status === 'COMPLETED'
                              ? 'success'
                              : mo.status === 'IN_PROGRESS'
                              ? 'warning'
                              : mo.status === 'APPROVED' || mo.status === 'PLANNED'
                              ? 'info'
                              : 'secondary'
                          }
                          size="sm"
                        >
                          {mo.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {check ? (
                          check.passed ? (
                            <Badge variant="success" size="sm">Passed</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs py-0.5 h-6"
                              onClick={() => qualityMutation.mutate({ checkId: check.id, passed: true })}
                            >
                              <ShieldCheck className="h-3 w-3 me-1 text-emerald-600" />
                              Pass QC
                            </Button>
                          )
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-end space-x-1 rtl:space-x-reverse">
                        {/* Status progression buttons */}
                        {mo.status === 'DRAFT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => statusMutation.mutate({ id: mo.id, status: 'APPROVED' })}
                            title="Approve MO"
                          >
                            Approve
                          </Button>
                        )}
                        {mo.status === 'APPROVED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => statusMutation.mutate({ id: mo.id, status: 'PLANNED' })}
                            title="Plan Production"
                          >
                            Plan
                          </Button>
                        )}
                        {['PLANNED', 'IN_PROGRESS'].includes(mo.status) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openConsume(mo)}
                              title="Consume Raw Materials"
                            >
                              <Flame className="h-3.5 w-3.5 text-amber-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openReceive(mo)}
                              title="Receive Finished Goods"
                            >
                              <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
                            </Button>
                          </>
                        )}
                        {mo.status === 'IN_PROGRESS' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => statusMutation.mutate({ id: mo.id, status: 'COMPLETED' })}
                            title="Mark Order Completed"
                          >
                            Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* BOM Tab */}
      {activeTab === 'boms' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Bills of Materials</CardTitle>
              <CardDescription>Component recipes and scrap factors for assembly items</CardDescription>
            </div>
          </CardHeader>

          {loadingBoms ? (
            <LoadingSpinner size="md" />
          ) : !boms || boms.length === 0 ? (
            <EmptyState
              title="No BOMs configured"
              description="Define a Bill of Materials to specify components and recipes."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assembly SKU</TableHead>
                  <TableHead>Output Qty</TableHead>
                  <TableHead>Components</TableHead>
                  <TableHead>Operations</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boms.map((bom) => (
                  <TableRow key={bom.id}>
                    <TableCell className="font-mono text-xs font-semibold">{bom.product?.sku || bom.productId}</TableCell>
                    <TableCell>{bom.quantity}</TableCell>
                    <TableCell className="text-xs text-zinc-600">
                      {bom.lines?.length || 0} component lines
                    </TableCell>
                    <TableCell className="text-xs text-zinc-600">
                      {bom.routings?.length || 0} routing steps
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">{formatDate(bom.createdAt, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Create MO Modal */}
      <Modal
        isOpen={createOrderModalOpen}
        onClose={() => setCreateOrderModalOpen(false)}
        title="Create Manufacturing Production Order"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <Select
            label="Finished Good Product"
            required
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {products?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} - {p.nameEn}
              </option>
            ))}
          </Select>

          <Select
            label="Target Production Warehouse"
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

          <Input
            label="Planned Production Quantity"
            type="number"
            step="0.01"
            required
            value={qtyPlanned}
            onChange={(e) => setQtyPlanned(e.target.value)}
          />

          <Select
            label="Bill of Materials (Optional)"
            value={bomId}
            onChange={(e) => setBomId(e.target.value)}
          >
            <option value="">None / Custom</option>
            {boms?.map((b) => (
              <option key={b.id} value={b.id}>
                BOM for {b.product?.sku}
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createOrderMutation.isPending}>
              Create Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create BOM Modal */}
      <Modal
        isOpen={createBomModalOpen}
        onClose={() => setCreateBomModalOpen(false)}
        title="Define Bill of Materials (BOM)"
        size="lg"
      >
        <form onSubmit={handleCreateBom} className="space-y-4">
          <Select
            label="Finished Good / Assembly Item"
            required
            value={bomProductId}
            onChange={(e) => setBomProductId(e.target.value)}
          >
            {products?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} - {p.nameEn}
              </option>
            ))}
          </Select>

          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-zinc-500">Components</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBomLines([...bomLines, { componentId: '', qty: '1', scrapPct: '0' }])}
              >
                <Plus className="h-3 w-3 me-1" /> Add Component
              </Button>
            </div>

            {bomLines.map((line, idx) => (
              <div key={idx} className="flex items-end gap-2 bg-zinc-50 p-2.5 rounded-lg">
                <div className="flex-1">
                  <Select
                    label="Component SKU"
                    required
                    value={line.componentId}
                    onChange={(e) => {
                      const updated = [...bomLines];
                      updated[idx].componentId = e.target.value;
                      setBomLines(updated);
                    }}
                  >
                    <option value="">Select Item</option>
                    {products?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} - {p.nameEn}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-24">
                  <Input
                    label="Quantity"
                    type="number"
                    step="0.01"
                    required
                    value={line.qty}
                    onChange={(e) => {
                      const updated = [...bomLines];
                      updated[idx].qty = e.target.value;
                      setBomLines(updated);
                    }}
                  />
                </div>
                {bomLines.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 mb-0.5"
                    onClick={() => setBomLines(bomLines.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateBomModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createBomMutation.isPending}>
              Save BOM
            </Button>
          </div>
        </form>
      </Modal>

      {/* Consume Materials Modal */}
      <Modal
        isOpen={consumeModalOpen}
        onClose={() => setConsumeModalOpen(false)}
        title="Record Material Consumption"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            consumeMutation.mutate({
              productId: consumeProductId,
              warehouseId: consumeWarehouseId,
              qty: consumeQty,
            });
          }}
          className="space-y-4"
        >
          <Select
            label="Component to Consume"
            required
            value={consumeProductId}
            onChange={(e) => setConsumeProductId(e.target.value)}
          >
            {products?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} - {p.nameEn}
              </option>
            ))}
          </Select>

          <Select
            label="Source Warehouse"
            required
            value={consumeWarehouseId}
            onChange={(e) => setConsumeWarehouseId(e.target.value)}
          >
            {warehouses?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          <Input
            label="Quantity Consumed"
            type="number"
            step="0.01"
            required
            value={consumeQty}
            onChange={(e) => setConsumeQty(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setConsumeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={consumeMutation.isPending}>
              Post Consumption
            </Button>
          </div>
        </form>
      </Modal>

      {/* Receive FG Modal */}
      <Modal
        isOpen={receiveModalOpen}
        onClose={() => setReceiveModalOpen(false)}
        title="Receive Finished Goods into Warehouse"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            receiveMutation.mutate({
              warehouseId: receiveWarehouseId,
              qty: receiveQty,
              unitCost: receiveUnitCost,
            });
          }}
          className="space-y-4"
        >
          <Select
            label="Target Warehouse"
            required
            value={receiveWarehouseId}
            onChange={(e) => setReceiveWarehouseId(e.target.value)}
          >
            {warehouses?.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </Select>

          <Input
            label="Quantity Finished"
            type="number"
            step="0.01"
            required
            value={receiveQty}
            onChange={(e) => setReceiveQty(e.target.value)}
          />

          <Input
            label="Standard / Actual Unit Cost"
            type="number"
            step="0.01"
            required
            value={receiveUnitCost}
            onChange={(e) => setReceiveUnitCost(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setReceiveModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={receiveMutation.isPending}>
              Receive into Inventory
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
