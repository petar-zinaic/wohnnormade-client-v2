import type {
  User,
  AuthResponse,
  AuthMessageResponse,
  LoginData,
  RegisterData,
} from "@/types/auth";
import { apiFetch } from "@/utils/api";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

class AuthService {
  private static readonly TOKEN_KEY = "auth_token";
  private static readonly USER_KEY = "auth_user";

  static async login(data: LoginData): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>("auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    this.setAuthData(result);
    return result;
  }

  static async register(data: RegisterData): Promise<AuthResponse> {
    const result = await apiFetch<AuthResponse>("auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    this.setAuthData(result);
    return result;
  }

  static async forgotPassword(email: string): Promise<AuthMessageResponse> {
    return apiFetch<AuthMessageResponse>("auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
  }

  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<AuthMessageResponse> {
    return apiFetch<AuthMessageResponse>("auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, newPassword }),
    });
  }

  static async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<AuthMessageResponse> {
    return apiFetch<AuthMessageResponse>("auth/change-password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  static logout(): void {
    this.deleteCookie(this.TOKEN_KEY);
    this.deleteCookie(this.USER_KEY);
  }

  static getToken(): string | null {
    if (typeof window === "undefined") return null;
    return this.getCookie(this.TOKEN_KEY);
  }

  static getUser(): User | null {
    if (typeof window === "undefined") return null;
    const userStr = this.getCookie(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  // Reads the `exp` claim of a JWT; null if the token can't be decoded
  static getTokenExpiry(token: string): Date | null {
    try {
      const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const { exp } = JSON.parse(atob(payload));
      return typeof exp === "number" ? new Date(exp * 1000) : null;
    } catch {
      return null;
    }
  }

  private static setAuthData(authResponse: AuthResponse): void {
    const { token, user } = authResponse;

    if (!token) {
      throw new Error("No token received from server");
    }

    if (!user) {
      throw new Error("No user data received from server");
    }

    // Expire the cookies together with the JWT (24 h), not later
    const expires =
      this.getTokenExpiry(token) ?? new Date(Date.now() + ONE_DAY_MS);
    this.setCookie(this.TOKEN_KEY, token, expires);
    this.setCookie(this.USER_KEY, JSON.stringify(user), expires);
  }

  private static setCookie(name: string, value: string, expires: Date): void {
    if (typeof window === "undefined") return;

    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  }

  private static getCookie(name: string): string | null {
    if (typeof window === "undefined") return null;

    const nameEQ = name + "=";
    const ca = document.cookie.split(";");

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private static deleteCookie(name: string): void {
    if (typeof window === "undefined") return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

export { AuthService };
