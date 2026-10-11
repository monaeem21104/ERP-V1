import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { formatMoney, formatDate } from '../../lib/format';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { BarChart3, Download, History, Boxes, Scale, TrendingUp } from 'lucide-react';

export function ReportsPage() {
  const { t, i18n } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const locale = i18n.language;

  const [activeReport, setActiveReport] = useState<'movements' | 'valuation' | 'trialBalance' | 'pnl'>('movements');

  const { data: movements, isLoading: loadingMovements } = useQuery<any[]>({
    queryKey: ['stockMovements', selectedCompanyId],
    queryFn: () => api.get<any[]>('/reports/stock-movements'),
    enabled: Boolean(selectedCompanyId) && activeReport === 'movements',
  });

  const { data: valuation, isLoading: loadingValuation } = useQuery<any>({
    queryKey: ['inventoryValuation', selectedCompanyId],
    queryFn: () => api.get<any>('/reports/inventory-valuation'),
    enabled: Boolean(selectedCompanyId) && activeReport === 'valuation',
  });

  const { data: trialBalance, isLoading: loadingTb } = useQuery<any>({
    queryKey: ['trialBalance', selectedCompanyId],
    queryFn: () => api.get<any>('/reports/trial-balance'),
    enabled: Boolean(selectedCompanyId) && activeReport === 'trialBalance',
  });

  const { data: pnl, isLoading: loadingPnl } = useQuery<any>({
    queryKey: ['profitAndLoss', selectedCompanyId],
    queryFn: () => api.get<any>('/reports/profit-loss'),
    enabled: Boolean(selectedCompanyId) && activeReport === 'pnl',
  });

  const exportCsv = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).filter((k) => typeof data[0][k] !== 'object');
    const rows = data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.reports', 'Analytical Reports & Ledger Exports')}
          </h1>
          <p className="text-xs text-zinc-500">
            Audited financial statements, stock movement journals, and CSV export engines
          </p>
        </div>

        {hasPermission('reports.export') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (activeReport === 'movements' && movements) {
                exportCsv(movements, 'stock-movements-ledger');
              } else if (activeReport === 'trialBalance' && trialBalance?.rows) {
                exportCsv(trialBalance.rows, 'trial-balance');
              }
            }}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        )}
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveReport('movements')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeReport === 'movements'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Stock Movement Ledger</span>
        </button>

        <button
          onClick={() => setActiveReport('valuation')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeReport === 'valuation'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Boxes className="h-4 w-4" />
          <span>Inventory Valuation</span>
        </button>

        <button
          onClick={() => setActiveReport('trialBalance')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeReport === 'trialBalance'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Trial Balance</span>
        </button>

        <button
          onClick={() => setActiveReport('pnl')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeReport === 'pnl'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Profit & Loss</span>
        </button>
      </div>

      {activeReport === 'movements' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Immutable Stock Movement Ledger</CardTitle>
              <CardDescription>Append-only audit trail of receipts, issues, transfers, and consumption</CardDescription>
            </div>
          </CardHeader>

          {loadingMovements ? (
            <LoadingSpinner size="md" />
          ) : !movements || movements.length === 0 ? (
            <EmptyState title="No movements in ledger" description="Inventory movements will be recorded as transactions occur." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Badge
                        variant={
                          m.type.includes('RECEIPT') || m.type.includes('IN')
                            ? 'success'
                            : m.type.includes('CONSUME') || m.type.includes('ISSUE')
                            ? 'warning'
                            : 'secondary'
                        }
                        size="sm"
                      >
                        {m.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{m.product?.sku || m.productId}</TableCell>
                    <TableCell className="font-semibold">{m.qty}</TableCell>
                    <TableCell>{formatMoney(m.unitCost, locale)}</TableCell>
                    <TableCell className="text-xs text-zinc-500">{m.referenceType ? `${m.referenceType} (${m.referenceId?.slice(0, 8)})` : '—'}</TableCell>
                    <TableCell className="text-xs text-zinc-500">{formatDate(m.occurredAt, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {activeReport === 'valuation' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Valuation Summary</CardTitle>
              <CardDescription>Total valuation breakdown based on weighted average costs</CardDescription>
            </div>
          </CardHeader>
          <div className="p-4">
            <p className="text-2xl font-bold text-emerald-700">{formatMoney(valuation?.inventoryValuation ?? 0, locale)}</p>
            <p className="text-xs text-zinc-500 mt-1">{valuation?.lines ?? 0} active stock balance lines evaluated</p>
          </div>
        </Card>
      )}

      {activeReport === 'trialBalance' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Trial Balance Report</CardTitle>
              <CardDescription>Posted debits and credits from double-entry accounting</CardDescription>
            </div>
          </CardHeader>
          {loadingTb ? (
            <LoadingSpinner size="md" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-end">Debit</TableHead>
                  <TableHead className="text-end">Credit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trialBalance?.rows?.map((r: any) => (
                  <TableRow key={r.code}>
                    <TableCell className="font-mono text-xs font-semibold">{r.code}</TableCell>
                    <TableCell>{r.nameEn}</TableCell>
                    <TableCell className="text-end font-mono">{formatMoney(r.debit, locale)}</TableCell>
                    <TableCell className="text-end font-mono">{formatMoney(r.credit, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {activeReport === 'pnl' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Profit and Loss</CardTitle>
              <CardDescription>Operational net income statement</CardDescription>
            </div>
          </CardHeader>
          <div className="p-4 space-y-2 max-w-sm">
            <div className="flex justify-between text-sm">
              <span>Revenue</span>
              <span className="font-semibold text-emerald-600">{formatMoney(pnl?.revenue ?? 0, locale)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Expenses</span>
              <span className="font-semibold text-rose-600">{formatMoney(pnl?.expenses ?? 0, locale)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-2">
              <span>Net Income</span>
              <span className="text-emerald-700">{formatMoney(pnl?.netIncome ?? 0, locale)}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
