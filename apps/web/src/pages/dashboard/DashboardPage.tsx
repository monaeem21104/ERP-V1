import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { formatMoney, formatDate } from '../../lib/format';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  ShoppingCart,
  Factory,
  TrendingUp,
  CreditCard,
  Boxes,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Building,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

interface DashboardSummary {
  totalOrders: number;
  activeProductionOrders: number;
  revenue: string;
  expenses: string;
  outstandingReceivables: string;
  outstandingPayables: string;
  inventoryValuation: string;
  lowStockAlerts: number;
  lowStock: {
    productId: string;
    sku: string;
    nameEn: string;
    nameAr: string;
    onHand: string;
    reorderLevel: string;
  }[];
  pendingPurchaseOrders: number;
  productionEfficiency: string;
  machineDowntimeMinutes: number;
  openMaintenanceOrders: number;
  cashFlowNet: string;
  recentTransactions: {
    id: string;
    number: string;
    partner: string;
    amount: string;
    direction: 'IN' | 'OUT';
    date: string;
  }[];
  activity: {
    id: string;
    message: string;
    type?: string;
    createdAt: string;
  }[];
}

export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const { selectedCompanyId, user } = useAuth();
  const locale = i18n.language;

  const { data, isLoading, error, refetch } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', selectedCompanyId],
    queryFn: () => api.get<DashboardSummary>('/dashboard'),
    enabled: Boolean(selectedCompanyId || user?.isSuperAdmin),
  });

  if (!selectedCompanyId && !user?.isSuperAdmin) {
    return (
      <EmptyState
        icon={<Building className="h-8 w-8 text-zinc-400" />}
        title={t('dash.noCompanyTitle', 'No Company Selected')}
        description={t(
          'dash.noCompanyDesc',
          'Please select a company from the top bar or request company membership from your administrator.'
        )}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" label={t('common.loading', 'Loading live ERP telemetry…')} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm font-semibold text-rose-600">
          {t('common.error', 'Unable to retrieve dashboard telemetry from server.')}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-3 text-xs font-medium text-emerald-600 underline"
        >
          {t('common.retry', 'Retry')}
        </button>
      </Card>
    );
  }

  const chartData = [
    {
      name: t('dash.revenue', 'Revenue'),
      amount: parseFloat(data.revenue) || 0,
      fill: '#16a34a',
    },
    {
      name: t('dash.expenses', 'Expenses'),
      amount: parseFloat(data.expenses) || 0,
      fill: '#ef4444',
    },
    {
      name: t('dash.cashflow', 'Net Cash Flow'),
      amount: parseFloat(data.cashFlowNet) || 0,
      fill: '#3b82f6',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.dashboard', 'Operations Telemetry')}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t(
              'dash.liveSubtitle',
              'Real-time industrial manufacturing, inventory, and finance performance'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetry Online</span>
          </Badge>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Orders */}
        <StatCard
          title={t('dash.totalOrders', 'Total Sales Orders')}
          value={data.totalOrders}
          subtitle={t('dash.ordersInSystem', 'Persisted sales orders')}
          icon={<ShoppingCart className="h-5 w-5" />}
          variant="default"
        />

        {/* Active Production Orders */}
        <StatCard
          title={t('dash.activeProduction', 'Active Production Orders')}
          value={data.activeProductionOrders}
          subtitle={t('dash.shopFloorJobs', 'Shop-floor operations in progress')}
          icon={<Factory className="h-5 w-5" />}
          variant="accent"
        />

        {/* Production Efficiency */}
        <StatCard
          title={t('dash.efficiency', 'Production Efficiency')}
          value={`${data.productionEfficiency}%`}
          subtitle={t('dash.actualVsPlanned', 'Actual vs. planned output')}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="accent"
        />

        {/* Inventory Valuation */}
        <StatCard
          title={t('dash.inventoryValue', 'Inventory Valuation')}
          value={formatMoney(data.inventoryValuation, locale)}
          subtitle={t('dash.weightedAvgMethod', 'Weighted-average cost method')}
          icon={<Boxes className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Financial Overview Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('dash.revenue', 'Revenue')}
          value={formatMoney(data.revenue, locale)}
          subtitle={t('dash.postedSales', 'Posted sales invoices')}
          icon={<DollarSign className="h-5 w-5" />}
          variant="accent"
        />

        <StatCard
          title={t('dash.expenses', 'Expenses')}
          value={formatMoney(data.expenses, locale)}
          subtitle={t('dash.operatingCosts', 'Cost of goods & operational')}
          icon={<ArrowDownRight className="h-5 w-5" />}
          variant="default"
        />

        <StatCard
          title={t('dash.receivables', 'Outstanding Receivables')}
          value={formatMoney(data.outstandingReceivables, locale)}
          subtitle={t('dash.arUncollected', 'Uncollected customer balances')}
          icon={<CreditCard className="h-5 w-5" />}
          variant="default"
        />

        <StatCard
          title={t('dash.payables', 'Outstanding Payables')}
          value={formatMoney(data.outstandingPayables, locale)}
          subtitle={t('dash.apDueSuppliers', 'Supplier liabilities due')}
          icon={<ArrowUpRight className="h-5 w-5" />}
          variant="default"
        />
      </div>

      {/* Operational Maintenance & Alert Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title={t('dash.lowStock', 'Low-Stock Alerts')}
          value={data.lowStockAlerts}
          subtitle={t('dash.belowReorderLevel', 'Items at or below reorder limit')}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={data.lowStockAlerts > 0 ? 'warning' : 'default'}
        />

        <StatCard
          title={t('dash.pendingPo', 'Pending Purchase Orders')}
          value={data.pendingPurchaseOrders}
          subtitle={t('dash.awaitingReceipt', 'Awaiting approval or receipt')}
          icon={<Clock className="h-5 w-5" />}
          variant="default"
        />

        <StatCard
          title={t('dash.downtime', 'Machine Downtime')}
          value={`${data.machineDowntimeMinutes} min`}
          subtitle={`${data.openMaintenanceOrders} ${t('dash.openWo', 'open work orders')}`}
          icon={<Wrench className="h-5 w-5" />}
          variant={data.machineDowntimeMinutes > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Chart & Activity Feed */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Financial Flow Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{t('dash.financialTelemetry', 'Financial Telemetry')}</CardTitle>
              <CardDescription>
                {t('dash.chartDesc', 'Double-entry posted totals calculated in exact decimal')}
              </CardDescription>
            </div>
          </CardHeader>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val: any) => formatMoney(val, locale)}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, color: '#f4f4f5' }}
                />
                <Legend />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Operational Activity Feed */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div>
              <CardTitle>{t('dash.activity', 'Operational Activity')}</CardTitle>
              <CardDescription>
                {t('dash.liveAuditFeed', 'Recent system-wide business events')}
              </CardDescription>
            </div>
          </CardHeader>
          <div className="mt-2 space-y-3 max-h-64 overflow-y-auto pr-1">
            {data.activity.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">
                {t('dash.noActivityYet', 'No activity records logged yet.')}
              </p>
            ) : (
              data.activity.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs border-b border-zinc-100 pb-2.5 last:border-0 dark:border-zinc-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="text-zinc-800 dark:text-zinc-200 font-medium">{act.message}</p>
                    <p className="text-[10px] text-zinc-400">{formatDate(act.createdAt, locale)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Tables: Recent Transactions & Low-Stock Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t('dash.recent', 'Recent Transactions')}</CardTitle>
              <CardDescription>
                {t('dash.recentDesc', 'Latest AR & AP payments recorded in ledger')}
              </CardDescription>
            </div>
          </CardHeader>
          {data.recentTransactions.length === 0 ? (
            <EmptyState
              title={t('dash.noTxTitle', 'No payments recorded')}
              description={t('dash.empty', 'Figures stay empty until real transactions exist.')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.number', 'Number')}</TableHead>
                  <TableHead>{t('common.partner', 'Partner')}</TableHead>
                  <TableHead>{t('common.amount', 'Amount')}</TableHead>
                  <TableHead>{t('common.direction', 'Type')}</TableHead>
                  <TableHead>{t('common.date', 'Date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">{tx.number}</TableCell>
                    <TableCell className="font-medium">{tx.partner}</TableCell>
                    <TableCell className="font-semibold">{formatMoney(tx.amount, locale)}</TableCell>
                    <TableCell>
                      <Badge variant={tx.direction === 'IN' ? 'success' : 'secondary'} size="sm">
                        {tx.direction === 'IN' ? 'Receipt (IN)' : 'Payment (OUT)'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">{formatDate(tx.date, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Low-Stock Alerts */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t('dash.lowStock', 'Low-Stock Alerts')}</CardTitle>
              <CardDescription>
                {t('dash.lowStockDesc', 'Critical reorder recommendations based on stock balance')}
              </CardDescription>
            </div>
          </CardHeader>
          {data.lowStock.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-6 w-6 text-emerald-600" />}
              title={t('dash.stockOptimal', 'All stock balances healthy')}
              description={t('dash.noLowStock', 'No items are currently below their reorder thresholds.')}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>{t('common.product', 'Product')}</TableHead>
                  <TableHead>{t('dash.onHand', 'On Hand')}</TableHead>
                  <TableHead>{t('dash.reorder', 'Reorder')}</TableHead>
                  <TableHead>{t('common.status', 'Status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.lowStock.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell className="font-medium">
                      {locale === 'ar' && item.nameAr ? item.nameAr : item.nameEn}
                    </TableCell>
                    <TableCell className="font-bold text-rose-600">{item.onHand}</TableCell>
                    <TableCell className="text-zinc-500">{item.reorderLevel}</TableCell>
                    <TableCell>
                      <Badge variant="danger" size="sm">
                        Critical
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
