import type { ApiResponse } from "@/types/tenant";

export const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
};

export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const SESSION_EXPIRED_EVENT = "auth:session-expired";

// Wraps fetch: parses the API envelope, throws ApiError, and signals an expired session
export async function apiFetch<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(getApiUrl(endpoint), init);
  const body: ApiResponse<T> | null = await response.json().catch(() => null);

  if (!response.ok) {
    const code: string | undefined = body?.error?.internal_code;
    // Only an invalid/expired token ends the session; invalid_credentials does not
    if (response.status === 401 && code === "missing_token" && typeof window !== "undefined") {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(body?.error?.message || response.statusText, response.status, code);
  }

  return (body?.result ?? body) as T;
}

type TranslationFunction = (key: string) => string;

// Translates an API error by its internal_code, falling back to a generic key
export const getErrorMessage = (
  err: unknown,
  t: TranslationFunction,
  fallbackKey: string
): string => {
  if (err instanceof ApiError && err.code) {
    const key = `apiErrors.${err.code}`;
    const translated = t(key);
    // i18next returns the key itself when no translation exists
    if (translated !== key) return translated;
  }
  return t(fallbackKey);
};
