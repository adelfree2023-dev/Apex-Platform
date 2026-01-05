'use client';
import { createContext, useContext, ReactNode } from 'react';

interface TenantContextType {
  slug: string;
  name?: string;
}

const TenantContext = createContext<TenantContextType | null>(null);

export function TenantProvider({ children, tenant }: { children: ReactNode; tenant: TenantContextType }) {
  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
}
