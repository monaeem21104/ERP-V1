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
import { Plus, BookOpen, Scale, TrendingUp, RotateCcw, Check, Trash2 } from 'lucide-react';

export function AccountingPage() {
  const { t, i18n } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const locale = i18n.language;

  const [activeTab, setActiveTab] = useState<'accounts' | 'trialBalance' | 'pnl'>('accounts');
  const [createAccountModalOpen, setCreateAccountModalOpen] = useState(false);
  const [createJournalModalOpen, setCreateJournalModalOpen] = useState(false);

  // Account form
  const [code, setCode] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [type, setType] = useState<'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'>('ASSET');

  // Journal form
  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState([
    { accountId: '', debit: '100', credit: '0', memo: '' },
    { accountId: '', debit: '0', credit: '100', memo: '' },
  ]);
  const [journalError, setJournalError] = useState<string | null>(null);

  // Queries
  const { data: accounts, isLoading: loadingAccounts } = useQuery<any[]>({
    queryKey: ['accounts', selectedCompanyId],
    queryFn: () => api.get<any[]>('/accounts'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: trialBalance, isLoading: loadingTb } = useQuery<any>({
    queryKey: ['trialBalance', selectedCompanyId],
    queryFn: () => api.get<any>('/reports/trial-balance'),
    enabled: Boolean(selectedCompanyId) && activeTab === 'trialBalance',
  });

  const { data: pnl, isLoading: loadingPnl } = useQuery<any>({
    queryKey: ['profitAndLoss', selectedCompanyId],
    queryFn: () => api.get<any>('/reports/profit-loss'),
    enabled: Boolean(selectedCompanyId) && activeTab === 'pnl',
  });

  // Mutations
  const createAccountMutation = useMutation({
    mutationFn: (body: any) => api.post('/accounts', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setCreateAccountModalOpen(false);
      setCode('');
      setNameEn('');
      setNameAr('');
    },
  });

  const createJournalMutation = useMutation({
    mutationFn: (body: any) => api.post('/journals', body),
    onSuccess: (data: any) => {
      // Automatically post the newly created draft
      api.post(`/journals/${data.id}/post`).then(() => {
        queryClient.invalidateQueries({ queryKey: ['trialBalance'] });
        queryClient.invalidateQueries({ queryKey: ['profitAndLoss'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        setCreateJournalModalOpen(false);
        setMemo('');
      });
    },
    onError: (err: any) => {
      setJournalError(err.message || 'Journal entry must be balanced');
    },
  });

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    createAccountMutation.mutate({ code, nameEn, nameAr, type });
  };

  const handleCreateJournal = (e: React.FormEvent) => {
    e.preventDefault();
    setJournalError(null);

    const totalDebit = lines.reduce((acc, l) => acc + (parseFloat(l.debit) || 0), 0);
    const totalCredit = lines.reduce((acc, l) => acc + (parseFloat(l.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      setJournalError(`Unbalanced entry: Total Debit (${totalDebit.toFixed(2)}) must equal Total Credit (${totalCredit.toFixed(2)})`);
      return;
    }

    createJournalMutation.mutate({
      date: new Date().toISOString(),
      memo,
      lines,
    });
  };

  const handleAddLine = () => {
    setLines([...lines, { accountId: '', debit: '0', credit: '0', memo: '' }]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.accounting', 'Accounting & Financial Ledger')}
          </h1>
          <p className="text-xs text-zinc-500">
            {t('accounting.subtitle', 'Double-entry bookkeeping, chart of accounts, trial balance, and financial statements')}
          </p>
        </div>

        <div className="flex gap-2">
          {hasPermission('accounting.create') && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLines([
                    { accountId: accounts?.[0]?.id || '', debit: '100', credit: '0', memo: '' },
                    { accountId: accounts?.[1]?.id || '', debit: '0', credit: '100', memo: '' },
                  ]);
                  setCreateJournalModalOpen(true);
                }}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>New Journal Entry</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreateAccountModalOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>New Account</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'accounts'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Chart of Accounts</span>
        </button>

        <button
          onClick={() => setActiveTab('trialBalance')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'trialBalance'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Trial Balance</span>
        </button>

        <button
          onClick={() => setActiveTab('pnl')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'pnl'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Profit & Loss Statement</span>
        </button>
      </div>

      {/* Tab: Chart of Accounts */}
      {activeTab === 'accounts' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Chart of Accounts</CardTitle>
              <CardDescription>General ledger account hierarchy</CardDescription>
            </div>
          </CardHeader>

          {loadingAccounts ? (
            <LoadingSpinner size="md" />
          ) : !accounts || accounts.length === 0 ? (
            <EmptyState
              title="No accounts defined"
              description="Create standard chart of accounts entries to record financial transactions."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name (English)</TableHead>
                  <TableHead>Name (Arabic)</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((acc) => (
                  <TableRow key={acc.id}>
                    <TableCell className="font-mono text-xs font-bold">{acc.code}</TableCell>
                    <TableCell className="font-medium">{acc.nameEn}</TableCell>
                    <TableCell className="font-arabic">{acc.nameAr || '—'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          acc.type === 'ASSET'
                            ? 'info'
                            : acc.type === 'REVENUE'
                            ? 'success'
                            : acc.type === 'EXPENSE'
                            ? 'warning'
                            : 'secondary'
                        }
                        size="sm"
                      >
                        {acc.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      {acc.isBank ? 'Bank Account' : acc.isCash ? 'Cash on Hand' : 'General Ledger'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Tab: Trial Balance */}
      {activeTab === 'trialBalance' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Trial Balance Report</CardTitle>
              <CardDescription>Double-entry validation: Total Debits must equal Total Credits</CardDescription>
            </div>
          </CardHeader>

          {loadingTb ? (
            <LoadingSpinner size="md" />
          ) : !trialBalance || !trialBalance.rows || trialBalance.rows.length === 0 ? (
            <EmptyState
              title="No posted journal movements"
              description="Post invoices or manual journal entries to view debit/credit balances."
            />
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead className="text-end">Debit</TableHead>
                    <TableHead className="text-end">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialBalance.rows.map((r: any) => (
                    <TableRow key={r.code}>
                      <TableCell className="font-mono text-xs font-semibold">{r.code}</TableCell>
                      <TableCell>{r.nameEn}</TableCell>
                      <TableCell className="text-end font-mono font-medium">{formatMoney(r.debit, locale)}</TableCell>
                      <TableCell className="text-end font-mono font-medium">{formatMoney(r.credit, locale)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-zinc-50 dark:bg-zinc-800/50">
                    <TableCell colSpan={2}>TOTAL (BALANCED)</TableCell>
                    <TableCell className="text-end text-emerald-600 font-mono">
                      {formatMoney(trialBalance.totalDebit, locale)}
                    </TableCell>
                    <TableCell className="text-end text-emerald-600 font-mono">
                      {formatMoney(trialBalance.totalCredit, locale)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      )}

      {/* Tab: Profit & Loss */}
      {activeTab === 'pnl' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Profit and Loss Statement (P&L)</CardTitle>
              <CardDescription>Revenue minus expenses based on posted double-entry journal entries</CardDescription>
            </div>
          </CardHeader>

          {loadingPnl ? (
            <LoadingSpinner size="md" />
          ) : (
            <div className="space-y-4 max-w-lg">
              <div className="rounded-xl border border-zinc-200 p-4 space-y-3 dark:border-zinc-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-zinc-600">Total Operating Revenue</span>
                  <span className="font-bold text-emerald-600 font-mono">{formatMoney(pnl?.revenue ?? '0', locale)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t pt-2">
                  <span className="font-medium text-zinc-600">Total Operating Expenses</span>
                  <span className="font-bold text-rose-600 font-mono">{formatMoney(pnl?.expenses ?? '0', locale)}</span>
                </div>
                <div className="flex justify-between items-center text-base border-t-2 pt-3 font-bold">
                  <span>Net Operating Income</span>
                  <span className="text-emerald-700 font-mono">{formatMoney(pnl?.netIncome ?? '0', locale)}</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Create Account Modal */}
      <Modal
        isOpen={createAccountModalOpen}
        onClose={() => setCreateAccountModalOpen(false)}
        title="Add General Ledger Account"
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <Input
            label="Account Code"
            required
            placeholder="1350"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <Input
            label="Name (English)"
            required
            placeholder="Finished Goods Inventory"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
          />

          <Input
            label="Name (Arabic)"
            required
            placeholder="مخزون البضائع تامة الصنع"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
          />

          <Select
            label="Account Classification"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="ASSET">ASSET (Assets / Liquid)</option>
            <option value="LIABILITY">LIABILITY (Accounts Payable / Debt)</option>
            <option value="EQUITY">EQUITY (Capital / Retained Earnings)</option>
            <option value="REVENUE">REVENUE (Sales & Income)</option>
            <option value="EXPENSE">EXPENSE (Cost of Goods & Expenses)</option>
          </Select>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateAccountModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createAccountMutation.isPending}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Balanced Journal Entry Modal */}
      <Modal
        isOpen={createJournalModalOpen}
        onClose={() => setCreateJournalModalOpen(false)}
        title="Post Balanced Journal Entry"
        size="lg"
      >
        <form onSubmit={handleCreateJournal} className="space-y-4">
          {journalError && (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {journalError}
            </div>
          )}

          <Input
            label="Entry Memo / Description"
            required
            placeholder="Monthly depreciation adjustment"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />

          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-zinc-500">Journal Lines (Debits = Credits)</span>
              <Button type="button" variant="outline" size="sm" onClick={handleAddLine}>
                <Plus className="h-3 w-3 me-1" /> Add Line
              </Button>
            </div>

            {lines.map((line, idx) => (
              <div key={idx} className="flex items-end gap-2 bg-zinc-50 p-2 rounded-lg">
                <div className="flex-1">
                  <Select
                    label="Account"
                    required
                    value={line.accountId}
                    onChange={(e) => {
                      const updated = [...lines];
                      updated[idx].accountId = e.target.value;
                      setLines(updated);
                    }}
                  >
                    <option value="">Select Account</option>
                    {accounts?.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.nameEn}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-28">
                  <Input
                    label="Debit"
                    type="number"
                    step="0.01"
                    value={line.debit}
                    onChange={(e) => {
                      const updated = [...lines];
                      updated[idx].debit = e.target.value;
                      setLines(updated);
                    }}
                  />
                </div>
                <div className="w-28">
                  <Input
                    label="Credit"
                    type="number"
                    step="0.01"
                    value={line.credit}
                    onChange={(e) => {
                      const updated = [...lines];
                      updated[idx].credit = e.target.value;
                      setLines(updated);
                    }}
                  />
                </div>
                {lines.length > 2 && (
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
            <Button type="button" variant="outline" onClick={() => setCreateJournalModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createJournalMutation.isPending}>
              Post to Ledger
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
