import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const resources: Record<string, string[]> = {
  dashboard: ['read'],
  users: ['read', 'create', 'update', 'manage', 'invite', 'reset_password'],
  roles: ['read', 'manage'],
  audit: ['read'],
  settings: ['read', 'update'],
  companies: ['read', 'manage'],
  customers: ['read', 'create', 'update', 'delete'],
  suppliers: ['read', 'create', 'update', 'delete'],
  products: ['read', 'create', 'update', 'delete'],
  warehouses: ['read', 'create', 'update', 'delete'],
  inventory: ['read', 'create', 'update', 'delete', 'adjust', 'transfer', 'approve', 'count'],
  purchasing: ['read', 'create', 'update', 'delete', 'approve', 'receive'],
  sales: ['read', 'create', 'update', 'delete', 'approve', 'deliver', 'discount'],
  accounting: ['read', 'create', 'update', 'post', 'reverse', 'export'],
  manufacturing: ['read', 'create', 'update', 'delete', 'approve', 'plan', 'complete'],
  returns: ['read', 'create', 'update', 'approve', 'inspect'],
  maintenance: ['read', 'create', 'update', 'complete'],
  hr: ['read', 'create', 'update', 'manage'],
  payroll: ['read', 'process', 'export'],
  reports: ['read', 'export'],
  einvoicing: ['read', 'submit', 'cancel'],
  notifications: ['read'],
  attachments: ['read', 'create', 'delete'],
};

const ROLE_MAP: Record<string, string[] | '*'> = {
  COMPANY_ADMIN: '*',
  FINANCE_MANAGER: [
    'dashboard.read',
    'accounting.read',
    'accounting.create',
    'accounting.post',
    'accounting.reverse',
    'accounting.export',
    'reports.read',
    'reports.export',
    'customers.read',
    'suppliers.read',
    'sales.read',
    'purchasing.read',
  ],
  ACCOUNTANT: ['dashboard.read', 'accounting.read', 'accounting.create', 'accounting.post', 'reports.read'],
  PRODUCTION_MANAGER: [
    'dashboard.read',
    'manufacturing.read',
    'manufacturing.create',
    'manufacturing.update',
    'manufacturing.approve',
    'manufacturing.plan',
    'manufacturing.complete',
    'inventory.read',
    'products.read',
    'reports.read',
  ],
  PRODUCTION_OPERATOR: ['dashboard.read', 'manufacturing.read', 'manufacturing.update', 'manufacturing.complete'],
  INVENTORY_MANAGER: [
    'dashboard.read',
    'inventory.read',
    'inventory.create',
    'inventory.update',
    'inventory.adjust',
    'inventory.transfer',
    'inventory.approve',
    'warehouses.read',
    'warehouses.create',
    'products.read',
    'products.create',
    'reports.read',
  ],
  WAREHOUSE_OPERATOR: ['dashboard.read', 'inventory.read', 'inventory.create', 'inventory.transfer', 'purchasing.receive'],
  PURCHASING_MANAGER: [
    'dashboard.read',
    'purchasing.read',
    'purchasing.create',
    'purchasing.approve',
    'purchasing.receive',
    'suppliers.read',
    'suppliers.create',
    'inventory.read',
    'products.read',
  ],
  SALES_MANAGER: [
    'dashboard.read',
    'sales.read',
    'sales.create',
    'sales.approve',
    'sales.deliver',
    'sales.discount',
    'customers.read',
    'customers.create',
    'reports.read',
  ],
  SALES_REPRESENTATIVE: ['dashboard.read', 'sales.read', 'sales.create', 'customers.read'],
  HR_MANAGER: ['dashboard.read', 'hr.read', 'hr.create', 'hr.update', 'hr.manage', 'payroll.read', 'payroll.process'],
  MAINTENANCE_TECHNICIAN: [
    'dashboard.read',
    'maintenance.read',
    'maintenance.create',
    'maintenance.update',
    'maintenance.complete',
  ],
  AUDITOR: [
    'dashboard.read',
    'audit.read',
    'reports.read',
    'accounting.read',
    'inventory.read',
    'sales.read',
    'purchasing.read',
  ],
  READ_ONLY: ['dashboard.read', 'reports.read', 'inventory.read', 'sales.read', 'purchasing.read', 'accounting.read'],
  STANDARD_USER: ['dashboard.read', 'notifications.read'],
};

function matchPerms(pattern: string[] | '*', all: string[]) {
  if (pattern === '*') return all;
  return [...new Set(pattern)];
}

async function upsertRole(code: string, name: string, isPlatform: boolean) {
  const existing = await prisma.role.findFirst({ where: { code, companyId: null } });
  if (existing) return existing;
  return prisma.role.create({
    data: { code, name, isSystem: true, isPlatform },
  });
}

async function main() {
  await prisma.platformSetting.upsert({
    where: { id: 'platform' },
    create: {
      id: 'platform',
      registrationPolicy: process.env.REGISTRATION_POLICY ?? 'approval_required',
      requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION !== 'false',
    },
    update: {},
  });

  for (const [resource, actions] of Object.entries(resources)) {
    for (const action of actions) {
      const key = `${resource}.${action}`;
      await prisma.permission.upsert({
        where: { key },
        create: { key, resource, action },
        update: {},
      });
    }
  }

  await upsertRole('SUPER_ADMIN', 'Super Administrator', true);

  const allKeys = Object.entries(resources).flatMap(([r, acts]) => acts.map((a) => `${r}.${a}`));
  for (const [code, patterns] of Object.entries(ROLE_MAP)) {
    const role = await upsertRole(code, code.replaceAll('_', ' '), false);
    const keys = matchPerms(patterns, allKeys);
    const perms = await prisma.permission.findMany({ where: { key: { in: keys } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (perms.length) {
      await prisma.rolePermission.createMany({
        data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }
  }

  if (process.env.SEED_DEMO === 'true') {
    const existing = await prisma.company.findUnique({ where: { code: 'DEMO' } });
    if (!existing) {
      const company = await prisma.company.create({
        data: { code: 'DEMO', name: 'Demo Manufacturing Co.', currencyCode: 'USD' },
      });
      await prisma.unitOfMeasure.create({
        data: { companyId: company.id, code: 'EA', nameEn: 'Each', nameAr: 'قطعة' },
      });
      await prisma.warehouse.create({ data: { companyId: company.id, code: 'MAIN', name: 'Main Warehouse' } });
      console.log('Demo company created without fabricated operational statistics.');
    }
  }

  console.log('Seed completed.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
