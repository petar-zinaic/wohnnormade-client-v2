import { apiFetch } from "@/utils/api";
import type { CreateTenantData, Tenant } from "@/types/tenant";
import { AuthService } from "./auth";

const jsonHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  ...AuthService.getAuthHeaders(),
});

class TenantService {
  static async getTenants(): Promise<Tenant[]> {
    return apiFetch<Tenant[]>("/tenant", {
      headers: jsonHeaders(),
    });
  }

  static async getTenantById(id: number): Promise<Tenant> {
    return apiFetch<Tenant>(`/tenant/${id}`, {
      headers: jsonHeaders(),
    });
  }

  static async searchTenants(query: string, dateOfBirth: string): Promise<Tenant[]> {
    const normalized = query.replace(/\s+/g, " ").trim();
    const url = `/tenant/search?q=${encodeURIComponent(normalized)}&dateOfBirth=${encodeURIComponent(dateOfBirth)}`;
    return apiFetch<Tenant[]>(url, {
      headers: jsonHeaders(),
    });
  }

  static async createTenant(data: CreateTenantData): Promise<Tenant> {
    return apiFetch<Tenant>("/tenant/create", {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
  }

  static async updateTenant(
    id: number,
    data: Partial<CreateTenantData>
  ): Promise<Tenant> {
    return apiFetch<Tenant>(`/tenant/${id}`, {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
  }

  static async deleteTenant(id: number): Promise<void> {
    await apiFetch<unknown>(`/tenant/${id}`, {
      method: "DELETE",
      headers: jsonHeaders(),
    });
  }
}

export default TenantService;
