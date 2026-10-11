import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async createCompany(dto: CreateCompanyDto) {
    return this.prisma.company.create({ data: { name: dto.name, code: dto.code } });
  }

  async getCompany(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async updateCompany(id: string, dto: UpdateCompanyDto) {
    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async deleteCompany(id: string) {
    return this.prisma.company.delete({ where: { id } });
  }

  async listCompanies() {
    return this.prisma.company.findMany();
  }

  async createBranch(dto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: { name: dto.name, code: dto.code, companyId: dto.companyId },
    });
  }

  async getBranch(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async updateBranch(id: string, dto: UpdateBranchDto) {
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  async deleteBranch(id: string) {
    return this.prisma.branch.delete({ where: { id } });
  }

  async listBranches() {
    return this.prisma.branch.findMany();
  }

  async createWarehouse(dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({
      data: {
        name: dto.name,
        code: dto.code,
        companyId: dto.companyId,
        branchId: dto.branchId,
      },
    });
  }

  async getWarehouse(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  async updateWarehouse(id: string, dto: UpdateWarehouseDto) {
    return this.prisma.warehouse.update({ where: { id }, data: dto });
  }

  async deleteWarehouse(id: string) {
    return this.prisma.warehouse.delete({ where: { id } });
  }

  async listWarehouses() {
    return this.prisma.warehouse.findMany();
  }
}
