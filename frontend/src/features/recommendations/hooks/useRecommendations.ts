import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MatchScore } from '../types/recommendation.types';
import { useAuth } from '@/features/auth/context/AuthContext';

export function useRecommendations() {
  const { user } = useAuth();
  const studentId = user?.id;

  return useQuery({
    queryKey: ['recommendations', studentId],
    queryFn: async () => {
      const response = await api.get<{ data: MatchScore[]; cached: boolean }>(
        `/recommendations/${studentId}`
      );
      return (response as any).data as MatchScore[];
    },
    enabled: !!studentId,
  });
}

export function useGenerateRecommendations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not logged in');
      const response = await api.post<{ data: MatchScore[] }>('/recommendations/generate', {
        studentId: user.id,
      });
      return (response as any).data as MatchScore[];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['recommendations', user?.id], data);
    },
  });
}
