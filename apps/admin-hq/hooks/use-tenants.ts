'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
    vendureChannelId: string | null;
    createdAt: string;
}

export function useTenants() {
    return useQuery({
        queryKey: ['tenants'],
        queryFn: async () => {
            // In a real app this would call /api/tenants
            const { data } = await apiClient.get<Tenant[]>('/api/tenants');
            return data;
        },
    });
}

export function useCreateTenant() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (dto: { name: string }) => {
            const { data } = await apiClient.post('/api/tenants', dto);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] });
        },
    });
}
