export class CreateCompanyDto {
  name: string;
  // Additional fields can be added as needed, e.g., address, taxId, etc.
}

export class UpdateCompanyDto {
  name?: string;
  // Optional fields for partial update
}
