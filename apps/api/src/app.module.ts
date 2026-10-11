import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { IamModule } from './iam/iam.module';
import { InventoryModule } from './inventory/inventory.module';
import { AccountingModule } from './accounting/accounting.module';
import { PurchasingModule } from './purchasing/purchasing.module';
import { SalesModule } from './sales/sales.module';
import { ManufacturingModule } from './manufacturing/manufacturing.module';
import { PartnersModule } from './partners/partners.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { OrganizationModule } from './organization/organization.module';
import { SupportModule } from './support/support.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { CompanyMiddleware } from './common/company.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: Number(process.env.THROTTLE_TTL_SECONDS ?? 60) * 1000, limit: Number(process.env.THROTTLE_LIMIT ?? 120) }],
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    IamModule,
    OrganizationModule,
    InventoryModule,
    AccountingModule,
    PurchasingModule,
    SalesModule,
    ManufacturingModule,
    PartnersModule,
    DashboardModule,
    SupportModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CompanyMiddleware).forRoutes('*');
  }
}
