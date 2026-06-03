import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<HealthResponse>('/health'),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
