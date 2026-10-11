import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [InventoryModule, AccountingModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
