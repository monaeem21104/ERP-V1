export class CreateBranchDto {
  name: string;
  companyId: number;
  // Additional optional fields (e.g., address) can be added later.
}

export class UpdateBranchDto {
  name?: string;
  // Optional fields for partial update.
}
