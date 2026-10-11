export class CreateBranchDto {
  name!: string;
  code!: string;
  companyId!: string;
  // Additional optional fields (e.g., address) can be added later.
}

export class UpdateBranchDto {
  name?: string;
  // Optional fields for partial update.
}
