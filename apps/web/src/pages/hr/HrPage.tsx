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
import { Users, Plus, Calendar, Check, X } from 'lucide-react';

export function HrPage() {
  const { t, i18n } = useTranslation();
  const { selectedCompanyId, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const locale = i18n.language;

  const [activeTab, setActiveTab] = useState<'employees' | 'leaves'>('employees');
  const [createEmployeeOpen, setCreateEmployeeOpen] = useState(false);
  const [createLeaveOpen, setCreateLeaveOpen] = useState(false);

  // Form states
  const [employeeNo, setEmployeeNo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const [leaveEmployeeId, setLeaveEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('Personal leave');

  const { data: employees, isLoading: loadingEmployees } = useQuery<any[]>({
    queryKey: ['employees', selectedCompanyId],
    queryFn: () => api.get<any[]>('/employees'),
    enabled: Boolean(selectedCompanyId),
  });

  const { data: leaves, isLoading: loadingLeaves } = useQuery<any[]>({
    queryKey: ['leaves', selectedCompanyId],
    queryFn: () => api.get<any[]>('/leave-requests'),
    enabled: Boolean(selectedCompanyId),
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (body: any) => api.post('/employees', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setCreateEmployeeOpen(false);
      setEmployeeNo('');
      setFirstName('');
      setLastName('');
      setJobTitle('');
    },
  });

  const createLeaveMutation = useMutation({
    mutationFn: (body: any) => api.post('/leave-requests', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setCreateLeaveOpen(false);
    },
  });

  const decideLeaveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      api.post(`/leave-requests/${id}/decision`, { id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    createEmployeeMutation.mutate({ employeeNo, firstName, lastName, jobTitle });
  };

  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    createLeaveMutation.mutate({
      employeeId: leaveEmployeeId || employees?.[0]?.id,
      type: leaveType,
      startDate,
      endDate,
      reason: leaveReason,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('nav.hr', 'Human Resources & Workforce')}
          </h1>
          <p className="text-xs text-zinc-500">
            Employee directory, attendance, leave approval workflows, and workforce records
          </p>
        </div>

        <div className="flex gap-2">
          {hasPermission('hr.create') && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLeaveEmployeeId(employees?.[0]?.id || '');
                  setCreateLeaveOpen(true);
                }}
                className="gap-1.5"
              >
                <Calendar className="h-4 w-4" />
                <span>Submit Leave</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreateEmployeeOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>New Employee</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'employees'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Employee Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
            activeTab === 'leaves'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Leave Requests & Approvals</span>
        </button>
      </div>

      {activeTab === 'employees' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Staff Directory</CardTitle>
              <CardDescription>Personnel records and department assignments</CardDescription>
            </div>
          </CardHeader>

          {loadingEmployees ? (
            <LoadingSpinner size="md" />
          ) : !employees || employees.length === 0 ? (
            <EmptyState title="No employees recorded" description="Register employees to manage shifts and leave." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee #</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Joined Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs font-semibold">{e.employeeNo}</TableCell>
                    <TableCell className="font-medium">{e.firstName} {e.lastName}</TableCell>
                    <TableCell className="text-xs text-zinc-500">{e.jobTitle || 'Technician'}</TableCell>
                    <TableCell className="text-xs text-zinc-500">{formatDate(e.joinedAt, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {activeTab === 'leaves' && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Leave Requests & Approvals</CardTitle>
              <CardDescription>Pending and approved vacation or sick leave requests</CardDescription>
            </div>
          </CardHeader>

          {loadingLeaves ? (
            <LoadingSpinner size="md" />
          ) : !leaves || leaves.length === 0 ? (
            <EmptyState title="No leave requests filed" description="Staff leave applications will appear here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((lr) => (
                  <TableRow key={lr.id}>
                    <TableCell className="font-medium">
                      {lr.employee ? `${lr.employee.firstName} ${lr.employee.lastName}` : lr.employeeId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" size="sm">{lr.type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-500">{formatDate(lr.startDate, locale)}</TableCell>
                    <TableCell className="text-xs text-zinc-500">{formatDate(lr.endDate, locale)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lr.status === 'APPROVED' ? 'success' : lr.status === 'REJECTED' ? 'danger' : 'warning'
                        }
                        size="sm"
                      >
                        {lr.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-end space-x-1 rtl:space-x-reverse">
                      {lr.status === 'PENDING' && hasPermission('hr.manage') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => decideLeaveMutation.mutate({ id: lr.id, status: 'APPROVED' })}
                            title="Approve Leave"
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => decideLeaveMutation.mutate({ id: lr.id, status: 'REJECTED' })}
                            title="Reject Leave"
                          >
                            <X className="h-3.5 w-3.5 text-rose-600" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Create Employee Modal */}
      <Modal isOpen={createEmployeeOpen} onClose={() => setCreateEmployeeOpen(false)} title="Register Employee Profile">
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <Input label="Employee ID / Number" required placeholder="EMP-2001" value={employeeNo} onChange={(e) => setEmployeeNo(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" required placeholder="Ahmed" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="Last Name" required placeholder="Al-Mansoor" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <Input label="Job Title" placeholder="Senior Production Engineer" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateEmployeeOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createEmployeeMutation.isPending}>Save Employee</Button>
          </div>
        </form>
      </Modal>

      {/* Submit Leave Modal */}
      <Modal isOpen={createLeaveOpen} onClose={() => setCreateLeaveOpen(false)} title="Submit Leave Request">
        <form onSubmit={handleCreateLeave} className="space-y-4">
          <Select label="Employee" required value={leaveEmployeeId} onChange={(e) => setLeaveEmployeeId(e.target.value)}>
            {employees?.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.employeeNo} - {emp.firstName} {emp.lastName}
              </option>
            ))}
          </Select>

          <Select label="Leave Type" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
            <option value="ANNUAL">Annual Vacation</option>
            <option value="SICK">Sick Leave</option>
            <option value="EMERGENCY">Emergency Leave</option>
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="End Date" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <Input label="Reason / Notes" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setCreateLeaveOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={createLeaveMutation.isPending}>Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
