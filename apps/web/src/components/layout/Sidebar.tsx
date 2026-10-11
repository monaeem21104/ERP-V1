import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Boxes,
  Factory,
  Receipt,
  FileSpreadsheet,
  Users2,
  Truck,
  Warehouse,
  RotateCcw,
  Wrench,
  Users,
  BarChart3,
  UserCog,
  ShieldCheck,
  History,
  Settings,
  ShieldAlert,
  ChevronRight,
  Package,
} from 'lucide-react';
import { cn } from '../ui/Button';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface NavItem {
  id: string;
  to: string;
  icon: React.ElementType;
  labelKey: string;
  defaultLabel: string;
  permission?: string;
  requireSuperAdmin?: boolean;
}

interface NavSection {
  titleKey: string;
  defaultTitle: string;
  items: NavItem[];
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t, i18n } = useTranslation();
  const { user, hasPermission } = useAuth();
  const isRTL = i18n.language === 'ar';

  const sections: NavSection[] = [
    {
      titleKey: 'navSections.core',
      defaultTitle: 'Core Operations',
      items: [
        { id: 'dashboard', to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard', defaultLabel: 'Dashboard', permission: 'dashboard.read' },
        { id: 'sales', to: '/sales', icon: ShoppingCart, labelKey: 'nav.sales', defaultLabel: 'Sales', permission: 'sales.read' },
        { id: 'purchases', to: '/purchases', icon: ShoppingBag, labelKey: 'nav.purchases', defaultLabel: 'Purchases', permission: 'purchasing.read' },
        { id: 'inventory', to: '/inventory', icon: Boxes, labelKey: 'nav.inventory', defaultLabel: 'Inventory', permission: 'inventory.read' },
        { id: 'manufacturing', to: '/manufacturing', icon: Factory, labelKey: 'nav.manufacturing', defaultLabel: 'Manufacturing', permission: 'manufacturing.read' },
      ],
    },
    {
      titleKey: 'navSections.finance',
      defaultTitle: 'Finance & Compliance',
      items: [
        { id: 'accounting', to: '/accounting', icon: Receipt, labelKey: 'nav.accounting', defaultLabel: 'Accounting', permission: 'accounting.read' },
        { id: 'einvoicing', to: '/einvoicing', icon: FileSpreadsheet, labelKey: 'nav.einvoicing', defaultLabel: 'E-Invoicing', permission: 'einvoicing.read' },
      ],
    },
    {
      titleKey: 'navSections.logistics',
      defaultTitle: 'Parties & Logistics',
      items: [
        { id: 'customers', to: '/customers', icon: Users2, labelKey: 'nav.customers', defaultLabel: 'Customers', permission: 'customers.read' },
        { id: 'suppliers', to: '/suppliers', icon: Truck, labelKey: 'nav.suppliers', defaultLabel: 'Suppliers', permission: 'suppliers.read' },
        { id: 'warehouses', to: '/warehouses', icon: Warehouse, labelKey: 'nav.warehouses', defaultLabel: 'Warehouses & Transfers', permission: 'warehouses.read' },
        { id: 'returns', to: '/returns', icon: RotateCcw, labelKey: 'nav.returns', defaultLabel: 'Returns', permission: 'returns.read' },
        { id: 'maintenance', to: '/maintenance', icon: Wrench, labelKey: 'nav.maintenance', defaultLabel: 'Maintenance', permission: 'maintenance.read' },
      ],
    },
    {
      titleKey: 'navSections.enterprise',
      defaultTitle: 'Enterprise & Reports',
      items: [
        { id: 'hr', to: '/hr', icon: Users, labelKey: 'nav.hr', defaultLabel: 'Human Resources', permission: 'hr.read' },
        { id: 'reports', to: '/reports', icon: BarChart3, labelKey: 'nav.reports', defaultLabel: 'Reports', permission: 'reports.read' },
      ],
    },
    {
      titleKey: 'navSections.administration',
      defaultTitle: 'System Administration',
      items: [
        { id: 'users', to: '/users', icon: UserCog, labelKey: 'nav.users', defaultLabel: 'User Management', permission: 'users.read' },
        { id: 'roles', to: '/roles', icon: ShieldCheck, labelKey: 'nav.roles', defaultLabel: 'Roles & Permissions', permission: 'roles.read' },
        { id: 'audit', to: '/audit', icon: History, labelKey: 'nav.audit', defaultLabel: 'Audit Logs', permission: 'audit.read' },
        { id: 'settings', to: '/settings', icon: Settings, labelKey: 'nav.settings', defaultLabel: 'Settings', permission: 'settings.read' },
        { id: 'admin', to: '/admin', icon: ShieldAlert, labelKey: 'nav.admin', defaultLabel: 'Admin Dashboard', requireSuperAdmin: true },
      ],
    },
      // Organization section
    {
      titleKey: 'navSections.organization',
      defaultTitle: 'Organization',
      items: [
        { id: 'branches', to: '/branches', icon: Package, labelKey: 'nav.branches', defaultLabel: 'Branches', permission: 'branches.read' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed inset-y-0 z-50 flex w-64 flex-col bg-[#141414] text-zinc-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-e border-zinc-800/80',
          isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo */}
        <div className="flex h-16 items-center gap-3 px-5 border-b border-zinc-800/70">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-950">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">MOVE-X</span>
            <span className="ms-1.5 rounded bg-emerald-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800/60 uppercase">
              ERP
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
          {sections.map((section) => {
            const visibleItems = section.items.filter((item) => {
              if (item.requireSuperAdmin) return user?.isSuperAdmin;
              if (item.permission) return hasPermission(item.permission);
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.titleKey} className="space-y-1">
                <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  {t(section.titleKey, section.defaultTitle)}
                </p>
                <div className="mt-1 space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.id}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all',
                            isActive
                              ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                              : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 shrink-0 transition-colors" />
                          <span>{t(item.labelKey, item.defaultLabel)}</span>
                        </div>
                        <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60 rtl:rotate-180" />
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/40">
          <div className="rounded-lg bg-zinc-900/60 p-2.5 text-xs text-zinc-400 flex items-center justify-between">
            <div className="truncate">
              <p className="font-medium text-zinc-200 truncate">{user?.fullName ?? 'Operator'}</p>
              <p className="text-[11px] text-zinc-500 truncate">{user?.isSuperAdmin ? 'Super Admin' : user?.email}</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}
