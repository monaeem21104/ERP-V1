import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { BootstrapAdminPage } from './pages/auth/BootstrapAdminPage';

// Module Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { SalesOrdersPage } from './pages/sales/SalesOrdersPage';
import { PurchasingPage } from './pages/purchasing/PurchasingPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { ManufacturingPage } from './pages/manufacturing/ManufacturingPage';
import { AccountingPage } from './pages/accounting/AccountingPage';
import { EinvoicingPage } from './pages/einvoicing/EinvoicingPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { SuppliersPage } from './pages/suppliers/SuppliersPage';
import { WarehousesPage } from './pages/warehouses/WarehousesPage';
import { ReturnsPage } from './pages/returns/ReturnsPage';
import { MaintenancePage } from './pages/maintenance/MaintenancePage';
import { HrPage } from './pages/hr/HrPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { UsersPage } from './pages/users/UsersPage';
import { RolesPage } from './pages/roles/RolesPage';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Authentication routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/bootstrap" element={<BootstrapAdminPage />} />

        {/* Protected ERP Shell routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute permission="dashboard.read">
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="sales"
            element={
              <ProtectedRoute permission="sales.read">
                <SalesOrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="purchases"
            element={
              <ProtectedRoute permission="purchasing.read">
                <PurchasingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="inventory"
            element={
              <ProtectedRoute permission="inventory.read">
                <InventoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="manufacturing"
            element={
              <ProtectedRoute permission="manufacturing.read">
                <ManufacturingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="accounting"
            element={
              <ProtectedRoute permission="accounting.read">
                <AccountingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="einvoicing"
            element={
              <ProtectedRoute permission="einvoicing.read">
                <EinvoicingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="customers"
            element={
              <ProtectedRoute permission="customers.read">
                <CustomersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="suppliers"
            element={
              <ProtectedRoute permission="suppliers.read">
                <SuppliersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="warehouses"
            element={
              <ProtectedRoute permission="warehouses.read">
                <WarehousesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="returns"
            element={
              <ProtectedRoute permission="returns.read">
                <ReturnsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="maintenance"
            element={
              <ProtectedRoute permission="maintenance.read">
                <MaintenancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="hr"
            element={
              <ProtectedRoute permission="hr.read">
                <HrPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="reports"
            element={
              <ProtectedRoute permission="reports.read">
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="users"
            element={
              <ProtectedRoute permission="users.read">
                <UsersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="roles"
            element={
              <ProtectedRoute permission="roles.read">
                <RolesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="audit"
            element={
              <ProtectedRoute permission="audit.read">
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="settings"
            element={
              <ProtectedRoute permission="settings.read">
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="admin"
            element={
              <ProtectedRoute requireSuperAdmin>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
