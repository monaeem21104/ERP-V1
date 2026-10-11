import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';

@Module({
  imports: [],
  providers: [OrganizationService, PrismaService],
  controllers: [OrganizationController],
  exports: [OrganizationService],
})
export class OrganizationModule {}
