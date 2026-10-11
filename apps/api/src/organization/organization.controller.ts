import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  // Company endpoints
  @Post('companies')
  async createCompany(@Body() dto: CreateCompanyDto) {
    return this.orgService.createCompany(dto);
  }

  @Get('companies')
  async listCompanies() {
    return this.orgService.listCompanies();
  }

  @Get('companies/:id')
  async getCompany(@Param('id') id: string) {
    return this.orgService.getCompany(id);
  }

  @Put('companies/:id')
  async updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.orgService.updateCompany(id, dto);
  }

  @Delete('companies/:id')
  async deleteCompany(@Param('id') id: string) {
    return this.orgService.deleteCompany(id);
  }
// Branch endpoints
  @Post('branches')
  async createBranch(@Body() dto: CreateBranchDto) {
    return this.orgService.createBranch(dto);
  }

  @Get('branches')
  async listBranches() {
    return this.orgService.listBranches();
  }

  @Get('branches/:id')
  async getBranch(@Param('id') id: string) {
    return this.orgService.getBranch(id);
  }

  @Put('branches/:id')
  async updateBranch(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.orgService.updateBranch(id, dto);
  }

  @Delete('branches/:id')
  async deleteBranch(@Param('id') id: string) {
    return this.orgService.deleteBranch(id);
  }

  // Warehouse endpoints
  @Post('warehouses')
  async createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.orgService.createWarehouse(dto);
  }

  @Get('warehouses')
  async listWarehouses() {
    return this.orgService.listWarehouses();
  }

  @Get('warehouses/:id')
  async getWarehouse(@Param('id') id: string) {
    return this.orgService.getWarehouse(id);
  }

  @Put('warehouses/:id')
  async updateWarehouse(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.orgService.updateWarehouse(id, dto);
  }

  @Delete('warehouses/:id')
  async deleteWarehouse(@Param('id') id: string) {
    return this.orgService.deleteWarehouse(id);
  }
}

