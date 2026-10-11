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
import { Wrench, Plus, Cpu, Clock } from 'lucide-react';

export function MaintenancePage() {
  const { t, i18n } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const locale = i18n.language;

  const [activeTab, setActiveTab] = useState<'orders' | 'machines'>('orders');
  const [createWoOpen, setCreateWoOpen] = useState(false);
  const [createMachineOpen, setCreateMachineOpen] = useState(false);

  // Form states
  const [machineCode, setMachineCode] = useState('');
  const [machineName, setMachineName] = useState('');

  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [woType, setWoType] = useState('PREVENTIVE');
  const [woNotes, setWoNotes] = useState('');

  const { data: machines, isLoading: loadingMachines } = useQuery<any[]>({
    queryKey: ['machines', selectedCompanyId],
    queryFn: () => api.get<any[]>('/machines'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: mOrders, isLoading: loadingWo } = useQuery<any[]>({
    queryKey: ['maintenanceOrders', selectedCompanyId],
    queryFn: () => api.get<any[]>('/maintenance-orders'),
    enabled: Boolean(selectedCompanyId),
  });

  const createMachineMutation = useMutation({
    mutationFn: (body: any) => api.post('/machines', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['machines'] });
      setCreateMachineOpen(false);
      setMachineCode('');
      setMachineName('');
    },
  });

  const createWoMutation = useMutation({
    mutationFn: (body: any) => api.post('/maintenance-orders', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceOrders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCreateWoOpen(false);
      setWoNotes('');
    },
  });

  const handleMachineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMachineMutation.mutate({ code: machineCode, name: machineName });
  };

  const handleWoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWoMutation.mutate({
      machineId: selectedMachineId || machines?.[0]?.id,
      type: woType,
      notes: woNotes,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.maintenance', 'Plant Maintenance & Machine Assets')}
          </h1>
          <p className="text-xs text-zinc-500">
            Machine telemetry, preventive maintenance, repair work orders, and spare parts tracking
          </p>
        </div>

        <div className="flex gap-2">
          {hasPermission('maintenance.create') && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateMachineOpen(true)}
                className="gap-1.5"
              >
                <Cpu className="h-4 w-4" />
                <span>Register Machine</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedMachineId(machines?.[0]?.id || '');
                  setCreateWoOpen(true);
                }}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>New Work Order</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'orders'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Wrench className="h-4 w-4" />
          <span>Maintenance Work Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('machines')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'machines'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Cpu className="h-4 w-4" />
          <span>Machine & Asset Registry</span>
        </button>
      </div>

      {activeTab === 'orders' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Maintenance Orders (Work Orders)</CardTitle>
              <CardDescription>Scheduled inspections and corrective maintenance</CardDescription>
            </div>
          </CardHeader>

          {loadingWo ? (
            <LoadingSpinner size="md" />
          ) : !mOrders || mOrders.length === 0 ? (
            <EmptyState title="No maintenance orders found" description="Create a work order for preventive service or breakdown repair." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mOrders.map((wo) => (
                  <TableRow key={wo.id}>
                    <TableCell className="font-mono text-xs font-semibold">{wo.number}</TableCell>
                    <TableCell className="font-medium">{wo.machine?.name || wo.machineId}</TableCell>
                    <TableCell>
                      <Badge variant={wo.type === 'BREAKDOWN' ? 'danger' : 'info'} size="sm">
                        {wo.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={wo.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
                        {wo.status || 'OPEN'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">{formatDate(wo.createdAt, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'machines' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Plant Machinery & Equipment</CardTitle>
              <CardDescription>Industrial machinery registry and operating status</CardDescription>
            </div>
          </CardHeader>

          {loadingMachines ? (
            <LoadingSpinner size="md" />
          ) : !machines || machines.length === 0 ? (
            <EmptyState title="No machines registered" description="Add plant equipment to track preventive maintenance schedules." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Code</TableHead>
                  <TableHead>Equipment Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Open Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machines.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs font-bold">{m.code}</TableCell>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>
                      <Badge variant={m.isActive ? 'success' : 'secondary'} size="sm">
                        {m.isActive ? 'Operational' : 'Decommissioned'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">{m.orders?.length || 0} work orders</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Create Machine Modal */}
      <Modal isOpen={createMachineOpen} onClose={() => setCreateMachineOpen(false)} title="Register Industrial Machine">
        <form onSubmit={handleMachineSubmit} className="space-y-4">
          <Input label="Machine Asset Code" required placeholder="CNC-MILL-01" value={machineCode} onChange={(e) => setMachineCode(e.target.value)} />
          <Input label="Equipment Name" required placeholder="5-Axis CNC Milling Center" value={machineName} onChange={(e) => setMachineName(e.target.value)} />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateMachineOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createMachineMutation.isPending}>Register Machine</Button>
          </div>
        </form>
      </Modal>

      {/* Create WO Modal */}
      <Modal isOpen={createWoOpen} onClose={() => setCreateWoOpen(false)} title="Issue Maintenance Work Order">
        <form onSubmit={handleWoSubmit} className="space-y-4">
          <Select label="Machine Asset" required value={selectedMachineId} onChange={(e) => setSelectedMachineId(e.target.value)}>
            {machines?.map((m) => (
              <option key={m.id} value={m.id}>{m.code} - {m.name}</option>
            ))}
          </Select>

          <Select label="Maintenance Category" value={woType} onChange={(e) => setWoType(e.target.value)}>
            <option value="PREVENTIVE">Preventive Maintenance (PM)</option>
            <option value="BREAKDOWN">Unscheduled Breakdown Repair</option>
            <option value="CALIBRATION">Sensor & Tool Calibration</option>
          </Select>

          <Input label="Work Order Notes & Task Scope" placeholder="Inspect hydraulic filters and lubrication lines" value={woNotes} onChange={(e) => setWoNotes(e.target.value)} />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateWoOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createWoMutation.isPending}>Issue Work Order</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
