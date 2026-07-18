import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { UniversityFilters, University } from '../types/university-filters.types';

interface UniversityListResponse {
  success: boolean;
  data: University[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export function useUniversities(filters: UniversityFilters & { q?: string }) {
  return useInfiniteQuery({
    queryKey: ['universities', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = new URLSearchParams();

      // Free-text search across university names, cities, and course names
      if (filters.q) queryParams.append('q', filters.q);
      if (filters.city?.length) queryParams.append('city', filters.city.join(','));
      if (filters.state?.length) queryParams.append('state', filters.state.join(','));
      if (filters.type?.length) queryParams.append('type', filters.type.join(','));
      if (filters.degree?.length) queryParams.append('degree', filters.degree.join(','));
      if (filters.field?.length) queryParams.append('field', filters.field.join(','));
      if (filters.language?.length) queryParams.append('language', filters.language.join(','));
      if (filters.tuitionMin != null) queryParams.append('tuitionMin', String(filters.tuitionMin));
      if (filters.tuitionMax != null) queryParams.append('tuitionMax', String(filters.tuitionMax));
      if (filters.intake?.length) queryParams.append('intake', filters.intake.join(','));
      if (filters.hasDormitory) queryParams.append('hasDormitory', 'true');
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      queryParams.append('page', String(pageParam));

      const body = (await api.get<University[]>(
        `/universities?${queryParams.toString()}`
      )) as unknown as UniversityListResponse;

      return {
        universities: body.data ?? [],
        total: body.total ?? 0,
        hasMore: body.hasMore ?? false,
        nextPage: pageParam + 1,
      };
    },
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextPage : undefined),
    initialPageParam: 1,
  });
}

export function useUniversityDetail(id: string) {
  return useQuery({
    queryKey: ['university', id],
    queryFn: () => api.get(`/universities/${id}`),
    enabled: !!id,
  });
}

export function useUniversitySearch(query: string) {
  return useQuery({
    queryKey: ['universities', 'search', query],
    queryFn: () => api.get(`/universities/search?q=${query}`),
    enabled: query.length > 2,
    staleTime: 10 * 60 * 1000, // 10 min cache for search
  });
}
