import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../components/auth/AuthContext';
import { api } from '../../lib/api';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { formatDate } from '../../lib/format';
import {
  ShieldAlert,
  Users,
  ShieldCheck,
  Building,
  History,
  Activity,
  ArrowRight,
  Lock,
} from 'lucide-react';

export function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const locale = i18n.language;

  const { data: users } = useQuery<any[]>({
    queryKey: ['adminUsers'],
    queryFn: () => api.get<any[]>('/users'),
  });

  const { data: companies } = useQuery<any[]>({
    queryKey: ['adminCompanies'],
    queryFn: () => api.get<any[]>('/companies'),
  });

  const { data: auditLogs } = useQuery<any[]>({
    queryKey: ['adminAuditLogs'],
    queryFn: () => api.get<any[]>('/audit-logs'),
  });

  return (
    <div className="space-y-6">
      {/* Admin Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-[#141414] p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-emerald-600 p-3 text-white shadow-md shadow-emerald-950">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">Platform Administration Console</h1>
                <Badge variant="success" size="sm">Super Administrator Scope</Badge>
              </div>
              <p className="mt-0.5 text-xs text-zinc-400">
                Centralized platform governance, multi-tenant directory, IAM policies, and cryptographic security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/users">
              <Button variant="primary" size="sm" className="gap-1 text-xs">
                <span>Manage Users</span>
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Registered Users"
          value={users?.length || 0}
          subtitle="Identities across all tenant scopes"
          icon={<Users className="h-5 w-5" />}
          variant="default"
        />

        <StatCard
          title="Active Tenants"
          value={companies?.length || 0}
          subtitle="Multi-tenant business organizations"
          icon={<Building className="h-5 w-5" />}
          variant="accent"
        />

        <StatCard
          title="Audit Trail Entries"
          value={auditLogs?.length || 0}
          subtitle="Immutable security event logs"
          icon={<History className="h-5 w-5" />}
          variant="default"
        />

        <StatCard
          title="Cryptographic Security"
          value="Argon2id"
          subtitle="RFC 9106 password hashing enabled"
          icon={<Lock className="h-5 w-5" />}
          variant="accent"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Identity & Access Control</h3>
              <p className="text-xs text-zinc-500">Provision accounts, suspend users, assign roles</p>
            </div>
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-4 pt-3 border-t">
            <Link to="/users" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              <span>Open User Management</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Permission Matrix</h3>
              <p className="text-xs text-zinc-500">Manage resource.action privileges and role scopes</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-sky-600" />
          </div>
          <div className="mt-4 pt-3 border-t">
            <Link to="/roles" className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
              <span>Configure Security Matrix</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">Audit & Compliance</h3>
              <p className="text-xs text-zinc-500">Inspect authentication and operational logs</p>
            </div>
            <Activity className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-4 pt-3 border-t">
            <Link to="/audit" className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">
              <span>Review Audit Trail</span>
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Security Logs */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Administrative & Security Events</CardTitle>
            <CardDescription>Live audit stream of identity and authorization actions</CardDescription>
          </div>
        </CardHeader>
        {!auditLogs || auditLogs.length === 0 ? (
          <p className="text-xs text-zinc-400 py-6 text-center">No security logs recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.slice(0, 5).map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs font-bold text-emerald-600">{log.action}</TableCell>
                  <TableCell className="font-mono text-xs">{log.actorId ? log.actorId.slice(0, 10) : 'System'}</TableCell>
                  <TableCell>{log.entityType}</TableCell>
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
