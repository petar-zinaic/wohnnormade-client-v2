"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { TenantService } from "@/services";
import type { CreateTenantData, Tenant } from "@/types";

interface TenantContextType {
  currentTenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
  createTenant: (data: CreateTenantData) => Promise<Tenant>;
  getTenantById: (id: number) => Promise<Tenant>;
  updateTenant: (
    id: number,
    data: Partial<CreateTenantData>
  ) => Promise<Tenant>;
  deleteTenant: (id: number) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTenant = async (data: CreateTenantData): Promise<Tenant> => {
    setIsLoading(true);
    setError(null);
    try {
      const tenant = await TenantService.createTenant(data);
      setCurrentTenant(tenant);
      return tenant;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create tenant";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getTenantById = async (id: number): Promise<Tenant> => {
    setIsLoading(true);
    setError(null);
    try {
      const tenant = await TenantService.getTenantById(id);
      setCurrentTenant(tenant);
      return tenant;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch tenant";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateTenant = async (
    id: number,
    data: Partial<CreateTenantData>
  ): Promise<Tenant> => {
    setIsLoading(true);
    setError(null);
    try {
      const tenant = await TenantService.updateTenant(id, data);
      setCurrentTenant(tenant);
      return tenant;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update tenant";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTenant = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await TenantService.deleteTenant(id);
      if (currentTenant?.id === id) {
        setCurrentTenant(null);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete tenant";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: TenantContextType = {
    currentTenant,
    isLoading,
    error,
    createTenant,
    getTenantById,
    updateTenant,
    deleteTenant,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
