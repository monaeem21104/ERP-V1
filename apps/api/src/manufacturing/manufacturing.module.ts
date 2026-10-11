import { Module } from '@nestjs/common';
import { ManufacturingService } from './manufacturing.service';
import { ManufacturingController } from './manufacturing.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  providers: [ManufacturingService],
  controllers: [ManufacturingController],
})
export class ManufacturingModule {}
