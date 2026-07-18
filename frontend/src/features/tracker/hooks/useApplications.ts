import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiClient } from '@/lib/api';

// ─── Types matching /api/applications ─────────────────────────────────────────

export type ApplicationStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'DECISION';

export interface Application {
  id: string;
  courseId?: string | null;
  universityId?: string | null;
  universityName: string;
  programName: string;
  degree?: string | null;
  status: ApplicationStatus;
  deadline?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface CreateApplicationInput {
  courseId?: string;
  universityName?: string;
  programName?: string;
  degree?: string;
  status?: ApplicationStatus;
  deadline?: string;
  notes?: string;
}

/** Course search result row used by the add-application picker */
export interface CoursePickerRow {
  id: string;
  name: string;
  degree: string;
  university?: { name: string; city?: string | null } | null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const QUERY_KEY = ['applications'];

export function useApplications() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Application[]> => {
      const response = await api.get<Application[]>('/applications');
      return response.data ?? [];
    },
  });
}

/** Debounce-friendly course search for the add-application dialog */
export function useCourseSearch(query: string) {
  return useQuery({
    queryKey: ['course-picker', query],
    queryFn: async (): Promise<CoursePickerRow[]> => {
      const response = await api.get<CoursePickerRow[]>(
        `/courses?q=${encodeURIComponent(query)}&page=1`
      );
      return (response.data ?? []).slice(0, 8);
    },
    enabled: query.trim().length >= 2,
    staleTime: 60_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateApplicationInput) => apiClient.post('/applications', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      status?: ApplicationStatus;
      deadline?: string | null;
      notes?: string | null;
    }) =>
      apiClient.patch(`/applications/${input.id}`, {
        status: input.status,
        deadline: input.deadline,
        notes: input.notes,
      }),
    // Optimistic status move — the card jumps columns instantly
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<Application[]>(QUERY_KEY);
      if (previous && input.status) {
        queryClient.setQueryData<Application[]>(
          QUERY_KEY,
          previous.map((app) => (app.id === input.id ? { ...app, status: input.status! } : app))
        );
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(QUERY_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/applications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
