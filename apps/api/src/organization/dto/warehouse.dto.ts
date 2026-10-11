export class CreateWarehouseDto {
  name: string;
  branchId: number;
  // Additional optional fields (e.g., location) can be added later.
}

export class UpdateWarehouseDto {
  name?: string;
  // Optional fields for partial update.
}
