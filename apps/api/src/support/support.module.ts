import { Module } from '@nestjs/common';
import { SupportController } from './support.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [SupportController],
})
export class SupportModule {}
