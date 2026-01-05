import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
export function useTenants() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const tenantsQuery = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data } = await apiClient.get('/tenants');
      return data;
    },
  });
  const createTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      // إرسال البيانات (بما فيها الايميل والباسورد) للباك إند
      const res = await apiClient.post('/tenants', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      router.push('/tenants'); // العودة للقائمة بعد النجاح
    },
  });
  return {
    tenants: tenantsQuery.data,
    isLoading: tenantsQuery.isLoading,
    createTenant: createTenantMutation.mutateAsync,
    isCreating: createTenantMutation.isPending,
  };
}
