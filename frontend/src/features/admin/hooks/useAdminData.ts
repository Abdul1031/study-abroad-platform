import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiClient } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types mirroring the admin API responses
// ─────────────────────────────────────────────────────────────────────────────

export interface QualityMetrics {
  totalPrograms: number;
  eligibleCount: number;
  ineligibleCount: number;
  eligibilityRate: number;
  staleCount: number;
  reviewQueue: {
    totalFlagged: number;
    byStatus: Record<string, number>;
  };
  completenessStats: {
    average: number;
    minimum: number;
    maximum: number;
  };
  generatedAt: string;
}

export interface ReviewQueueItem {
  id: string;
  reviewStatus: 'FLAGGED' | 'APPROVED' | 'REJECTED' | string;
  flaggedAt?: string;
  course: {
    id: string;
    name: string;
    degree: string;
    field: string;
    language: string;
    completenessScore: number;
    isMatchEligible: boolean;
    matchingBlockers: string[];
    isStale: boolean;
    lastVerifiedAt?: string | null;
    university: { id: string; name: string; city?: string | null };
  };
}

interface ReviewQueueResponse {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  data: ReviewQueueItem[];
}

export interface QueueMetrics {
  pending: number;
  active: number;
  completed: number;
  failedAttempts: number;
  deadLettered: number;
  averageJobDurationMs: number;
}

interface ScraperStatusResponse {
  success: boolean;
  schedulerInitialised: boolean;
  queue: QueueMetrics | null;
  timestamp: string;
}

export interface DeadLetterJob {
  id: string;
  key: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  finishedAt?: string;
  lastError?: string;
  data: { trigger: string; requestedBy?: string };
}

interface RunScrapeResponse {
  success: boolean;
  message: string;
  jobId: string;
  deduplicated: boolean;
  queue: QueueMetrics;
}

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

export function useQualityMetrics() {
  return useQuery({
    queryKey: ['admin', 'quality-metrics'],
    queryFn: async (): Promise<QualityMetrics> => {
      const response = await api.get<QualityMetrics>('/quality/metrics');
      return response.data;
    },
    refetchInterval: 60_000,
  });
}

export function useReviewQueue(status = 'FLAGGED') {
  return useQuery({
    queryKey: ['admin', 'review-queue', status],
    queryFn: async (): Promise<ReviewQueueResponse> => {
      // Response carries total/limit/offset at the top level, not in `data`
      const body = await api.get<ReviewQueueItem[]>(
        `/quality/review-queue?status=${encodeURIComponent(status)}&limit=25`
      );
      return body as unknown as ReviewQueueResponse;
    },
  });
}

export function useScraperStatus() {
  return useQuery({
    queryKey: ['admin', 'scraper-status'],
    queryFn: async (): Promise<ScraperStatusResponse> => {
      const body = await api.get<never>('/scraper/status');
      return body as unknown as ScraperStatusResponse;
    },
    refetchInterval: 15_000,
  });
}

export function useDeadLetters() {
  return useQuery({
    queryKey: ['admin', 'dead-letters'],
    queryFn: async (): Promise<DeadLetterJob[]> => {
      const response = await api.get<DeadLetterJob[]>('/scraper/queue/dead-letters');
      return response.data ?? [];
    },
    refetchInterval: 30_000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['admin'] });
}

export function useApproveReview(reviewedBy: string) {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (input: { reviewId: string; notes?: string }) =>
      apiClient.patch(`/quality/review-queue/${input.reviewId}/approve`, {
        reviewedBy,
        notes: input.notes,
      }),
    onSuccess: invalidate,
  });
}

export function useRejectReview(reviewedBy: string) {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (input: { reviewId: string; reason: string }) =>
      apiClient.patch(`/quality/review-queue/${input.reviewId}/reject`, {
        reviewedBy,
        reason: input.reason,
      }),
    onSuccess: invalidate,
  });
}

export function useRunScraper() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async (): Promise<RunScrapeResponse> => {
      const body = await api.post<never>('/scraper/run', {});
      return body as unknown as RunScrapeResponse;
    },
    onSuccess: invalidate,
  });
}

export function useRetryDeadLetter() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (jobId: string) => api.post(`/scraper/queue/dead-letters/${jobId}/retry`, {}),
    onSuccess: invalidate,
  });
}
