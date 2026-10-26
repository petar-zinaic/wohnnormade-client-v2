"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth";
import { SESSION_EXPIRED_EVENT } from "@/utils/api";
import type { User, AuthContextType } from "@/types";

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  // Mirrors `user` so the session-expired listener sees the current value
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  useEffect(() => {
    const token = AuthService.getToken();
    if (token) {
      const expiry = AuthService.getTokenExpiry(token);
      if (expiry && expiry.getTime() <= Date.now()) {
        AuthService.logout();
      } else {
        const cached = AuthService.getUser();
        if (cached) {
          setUser(cached);
        }
      }
    }
    setIsLoading(false);
  }, []);

  // apiFetch fires this on 401 missing_token (token missing, invalid or expired)
  useEffect(() => {
    const handleSessionExpired = () => {
      const hadSession = !!userRef.current || AuthService.isAuthenticated();
      AuthService.logout();
      userRef.current = null;
      setUser(null);
      if (hadSession) {
        router.push("/login?sessionExpired=1");
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [router]);

  const login = async (email: string, password: string) => {
    const response = await AuthService.login({ email, password });
    setUser(response.user);
  };

  const register = async (
    email: string,
    password: string,
    userData?: { name: string; surname: string; city: string; country: string }
  ) => {
    if (!userData) {
      throw new Error("User data is required for registration");
    }

    const registerData = {
      email,
      password,
      name: userData.name,
      surname: userData.surname,
      city: userData.city,
      country: userData.country,
    };

    const response = await AuthService.register(registerData);
    setUser(response.user);
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
