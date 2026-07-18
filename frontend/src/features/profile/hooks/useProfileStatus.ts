import { useQuery } from '@tanstack/react-query';
import { profileService } from '../services/profileService';
import type { StudentProfileFormData } from '../types';

/** Snapshot of the server-side profile — shared by Dashboard, Sidebar, wizard. */
export interface ProfileStatus {
  isComplete: boolean;
  profile: Partial<StudentProfileFormData> | null;
}

/**
 * The server is the source of truth for whether onboarding happened. Cached
 * for a minute so navigating between pages doesn't refetch, and invalidated
 * by the wizard's submit mutation.
 */
export function useProfileStatus() {
  return useQuery<ProfileStatus>({
    queryKey: ['profile-status'],
    queryFn: async () => {
      const profile = await profileService.loadProfile();
      return { isComplete: profile !== null, profile };
    },
    staleTime: 60_000,
    // Don't retry a 401 into a permission-error toast storm on public pages
    retry: false,
  });
}
