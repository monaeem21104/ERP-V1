import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [InventoryModule, AccountingModule],
  providers: [SalesService],
  controllers: [SalesController],
})
export class SalesModule {}
