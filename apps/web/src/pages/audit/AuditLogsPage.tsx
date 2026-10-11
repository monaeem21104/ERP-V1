import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { History, ShieldAlert } from 'lucide-react';

export function AuditLogsPage() {
  const { t, i18n } = useTranslation();
  const { selectedCompanyId } = useAuth();
  const locale = i18n.language;

  const { data: auditLogs, isLoading } = useQuery<any[]>({
    queryKey: ['auditLogs', selectedCompanyId],
    queryFn: () => api.get<any[]>('/audit-logs'),
    enabled: Boolean(selectedCompanyId),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.audit', 'Security & Operational Audit Logs')}
          </h1>
          <p className="text-xs text-zinc-500">
            Immutable system audit trail tracking sensitive identity changes, authorizations, and transactions
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Audit Log Journal</CardTitle>
            <CardDescription>Server-side generated security events</CardDescription>
          </div>
        </CardHeader>

        {isLoading ? (
          <LoadingSpinner size="md" />
        ) : !auditLogs || auditLogs.length === 0 ? (
          <EmptyState title="No audit entries recorded" description="Events will appear as privileged actions occur." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Actor / User</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Metadata / Details</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs font-bold text-emerald-600">{log.action}</TableCell>
                  <TableCell className="font-mono text-xs">{log.actorId ? log.actorId.slice(0, 10) : 'System'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" size="sm">{log.entityType}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-zinc-500">{log.entityId ? log.entityId.slice(0, 10) : '—'}</TableCell>
                  <TableCell className="font-mono text-[11px] text-zinc-400 max-w-xs truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500">{formatDate(log.createdAt, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
