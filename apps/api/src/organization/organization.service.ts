import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  // Company CRUD
  async createCompany(dto: CreateCompanyDto) {
    return this.prisma.company.create({ data: { name: dto.name } });
  }

  async getCompany(id: number) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async updateCompany(id: number, dto: UpdateCompanyDto) {
    return this.prisma.company.update({
      where: { id },
      data: { ...dto },
    });
  }

  async deleteCompany(id: number) {
    return this.prisma.company.delete({ where: { id } });
  }

  async listCompanies() {
    return this.prisma.company.findMany();
  }

  // Branch CRUD
  async createBranch(dto: any) {
    return this.prisma.branch.create({ data: { name: dto.name, companyId: dto.companyId } });
  }

  async getBranch(id: number) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async updateBranch(id: number, dto: any) {
    return this.prisma.branch.update({ where: { id }, data: { ...dto } });
  }

  async deleteBranch(id: number) {
    return this.prisma.branch.delete({ where: { id } });
  }

  async listBranches() {
    return this.prisma.branch.findMany();
  }

  // Warehouse CRUD
  async createWarehouse(dto: any) {
    return this.prisma.warehouse.create({ data: { name: dto.name, branchId: dto.branchId } });
  }

  async getWarehouse(id: number) {
    const wh = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!wh) throw new NotFoundException('Warehouse not found');
    return wh;
  }

  async updateWarehouse(id: number, dto: any) {
    return this.prisma.warehouse.update({ where: { id }, data: { ...dto } });
  }

  async deleteWarehouse(id: number) {
    return this.prisma.warehouse.delete({ where: { id } });
  }

  async listWarehouses() {
    return this.prisma.warehouse.findMany();
  }

  // Similar methods can be added for Branch and Warehouse as needed.
}
