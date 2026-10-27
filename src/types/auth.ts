export interface User {
  id: number;
  email: string;
  name: string | null;
  surname: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
}

// `result` of POST auth/login and auth/register
export interface AuthResponse {
  user: User;
  token: string;
}

// `result` of forgot-password, reset-password and change-password
export interface AuthMessageResponse {
  message: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  surname: string;
  city: string;
  country: string;
  captchaToken: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    userData?: {
      name: string;
      surname: string;
      city: string;
      country: string;
      captchaToken: string;
    }
  ) => Promise<void>;
  logout: () => void;
}
