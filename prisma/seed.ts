import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create a demo company
  const company = await prisma.company.create({
    data: {
      name: 'Demo Manufacturing Co.',
      // add other required fields if any
    },
  });

  // Create a few branches linked to the company
  const branchData = [
    { name: 'Headquarters', address: '123 Main St', companyId: company.id },
    { name: 'North Plant', address: '456 North Ave', companyId: company.id },
    { name: 'South Plant', address: '789 South Rd', companyId: company.id },
  ];
  const branches = await Promise.all(
    branchData.map((b) => prisma.branch.create({ data: b })),
  );

  // Create warehouses linked to branches (or directly to company if schema allows)
  const warehouseData = [
    { name: 'Main Warehouse', location: 'HQ', branchId: branches[0].id },
    { name: 'North Warehouse', location: 'North Plant', branchId: branches[1].id },
    { name: 'South Warehouse', location: 'South Plant', branchId: branches[2].id },
  ];
  await Promise.all(
    warehouseData.map((w) => prisma.warehouse.create({ data: w })),
  );

  console.log('🌱 Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
