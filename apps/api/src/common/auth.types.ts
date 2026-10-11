export type AuthUser = {
  id: string;
  email: string;
  sessionId: string;
  isSuperAdmin: boolean;
  permissions: string[];
  companyIds: string[];
  locale: string;
  mustChangePassword: boolean;
};
