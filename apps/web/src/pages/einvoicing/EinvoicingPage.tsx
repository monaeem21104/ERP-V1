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
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { FileCheck, Shield, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export function EinvoicingPage() {
  const { t, i18n } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const locale = i18n.language;

  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [resultMessage, setResultMessage] = useState<any>(null);

  const { data: einvoices, isLoading } = useQuery<any[]>({
    queryKey: ['einvoices', selectedCompanyId],
    queryFn: () => api.get<any[]>('/einvoices'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: invoices } = useQuery<any[]>({
    queryKey: ['invoices', selectedCompanyId],
    queryFn: () => api.get<any[]>('/invoices'),
    enabled: Boolean(selectedCompanyId),
  });

  const validateMutation = useMutation({
    mutationFn: (body: any) => api.post('/einvoices/validate', body),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['einvoices'] });
      setResultMessage(data);
    },
  });

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    validateMutation.mutate({ invoiceId: selectedInvoiceId });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.einvoicing', 'E-Invoicing & Compliance Gateway')}
          </h1>
          <p className="text-xs text-zinc-500">
            {t('einvoicing.subtitle', 'Provider-independent tax authority adapter layer (ZATCA / Peppol / Sandbox compliant)')}
          </p>
        </div>

        {hasPermission('einvoicing.submit') && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setResultMessage(null);
              setSelectedInvoiceId(invoices?.[0]?.id || '');
              setValidateModalOpen(true);
            }}
            className="gap-1.5"
          >
            <FileCheck className="h-4 w-4" />
            <span>Validate & Transmit Invoice</span>
          </Button>
        )}
      </div>

      {/* Gateway Status Banner */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-zinc-400">Active Provider Adapter</p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Universal Provider Adapter (Sandbox Environment)
            </p>
          </div>
        </div>
        <Badge variant="success" size="sm">Operational</Badge>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>E-Invoice Submissions</CardTitle>
            <CardDescription>Audited electronic invoice transmission logs and digital signatures</CardDescription>
          </div>
        </CardHeader>

        {isLoading ? (
          <LoadingSpinner size="md" />
        ) : !einvoices || einvoices.length === 0 ? (
          <EmptyState
            title="No e-invoicing submissions yet"
            description="Submit an invoice for compliance validation and digital certification."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Compliance Status</TableHead>
                <TableHead>Validation Errors</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {einvoices.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell className="font-mono text-xs font-bold">{sub.invoice?.number || sub.invoiceId}</TableCell>
                  <TableCell className="text-xs font-semibold">{sub.provider}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sub.status === 'VALIDATED' || sub.status === 'ACCEPTED'
                          ? 'success'
                          : sub.status === 'REJECTED'
                          ? 'danger'
                          : 'secondary'
                      }
                      size="sm"
                    >
                      {sub.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-rose-600 max-w-xs truncate">
                    {sub.lastError || 'None (Valid)'}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">{formatDate(sub.createdAt, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Validate & Transmit Modal */}
      <Modal
        isOpen={validateModalOpen}
        onClose={() => setValidateModalOpen(false)}
        title="Validate & Transmit E-Invoice"
      >
        <form onSubmit={handleValidate} className="space-y-4">
          <Select
            label="Select Invoice to Transmit"
            required
            value={selectedInvoiceId}
            onChange={(e) => setSelectedInvoiceId(e.target.value)}
          >
            {invoices?.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.number} - {inv.type} (${inv.total})
              </option>
            ))}
          </Select>

          {resultMessage && (
            <div
              className={`rounded-lg p-3 text-xs border ${
                resultMessage.valid
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                {resultMessage.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                )}
                <span>{resultMessage.valid ? 'Validation Passed' : 'Validation Failed'}</span>
              </div>
              {resultMessage.errors?.length > 0 && (
                <ul className="list-disc ps-4 space-y-0.5">
                  {resultMessage.errors.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setValidateModalOpen(false)}>
              Close
            </Button>
            <Button type="submit" variant="primary" isLoading={validateMutation.isPending}>
              Transmit Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
