import { apiFetch } from "@/utils/api";
import { AuthService } from "./auth";
import type { Tenant } from "@/types/tenant";

// The API rejects any other field with 400
export interface UpdateUserData {
  name?: string;
  surname?: string;
  city?: string;
  country?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string | null;
  surname: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
  tenants?: Tenant[];
}

const jsonHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  ...AuthService.getAuthHeaders(),
});

class UserService {
  /**
   * Update user profile data
   * @param userId - User ID
   * @param userData - Data to update
   * @returns Promise<UserProfile> - Updated user profile
   */
  static async updateProfile(
    userId: number,
    userData: UpdateUserData
  ): Promise<UserProfile> {
    return apiFetch<UserProfile>(`users/${userId}`, {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify(userData),
    });
  }

  /**
   * Get user profile by ID
   * @param userId - User ID
   * @returns Promise<UserProfile> - User profile data
   */
  static async getUserProfile(userId: number): Promise<UserProfile> {
    return apiFetch<UserProfile>(`users/${userId}`, {
      method: "GET",
      headers: jsonHeaders(),
    });
  }

  /**
   * Get all users
   */
  static async getAllUsers(): Promise<UserProfile[]> {
    return apiFetch<UserProfile[]>("users", {
      method: "GET",
      headers: jsonHeaders(),
    });
  }

  /**
   * Delete user account, including the user's tenant reports and conversations
   * @param userId - User ID
   * @returns Promise<void>
   */
  static async deleteAccount(userId: number): Promise<void> {
    await apiFetch<unknown>(`users/${userId}`, {
      method: "DELETE",
      headers: jsonHeaders(),
    });
  }
}

export default UserService;
