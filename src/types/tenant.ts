export interface TenantAuthor {
  id: number;
  email: string;
  name: string;
  surname: string;
}

export enum ViolationType {
  RentNotPaid = "Rent Not Paid",
  PropertyWrecked = "Property Wrecked",
}

export interface Tenant {
  id: number;
  name: string;
  surname: string;
  dateOfBirth?: string;
  violationType: ViolationType | string;
  description: string;
  city: string;
  country: string;
  createdById: number;
  createdAt: string;
  updatedAt: string;
  createdBy: TenantAuthor;
}

export interface CreateTenantData {
  name: string;
  surname: string;
  dateOfBirth?: string; // ISO string
  violationType: ViolationType;
  description: string;
  city: string;
  country: string;
}

export interface ApiErrorBody {
  status: number;
  message: string;
  internal_code: string;
}

// Envelope of every API response; `error` is `{}` on success
export interface ApiResponse<T> {
  result: T;
  status: boolean;
  error: Partial<ApiErrorBody>;
}
