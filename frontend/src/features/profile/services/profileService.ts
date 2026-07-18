import { apiClient } from '@/lib/api';
import { STORAGE_KEYS } from '../utils/constants';
import type { ProfileServiceContract, StudentProfileFormData, ProfileDraft } from '../types';

// ─── Hybrid Profile Service ───────────────────────────────────────────────────
// Drafts (work-in-progress wizard state) live in localStorage for instant,
// offline-safe auto-save. The COMPLETED profile is persisted to the backend
// (PUT /api/profile) so it survives refreshes, devices, and browsers.

class HybridProfileService implements ProfileServiceContract {
  private readonly draftKey = STORAGE_KEYS.PROFILE_DRAFT;

  async saveDraft(data: Partial<StudentProfileFormData>, currentStep: number): Promise<void> {
    const draft: ProfileDraft = {
      data,
      currentStep,
      lastSaved: new Date().toISOString(),
    };

    try {
      localStorage.setItem(this.draftKey, JSON.stringify(draft));
    } catch (error) {
      // localStorage can fail (private browsing quota exceeded, etc.)
      console.warn('[ProfileService] Failed to save draft to localStorage:', error);
    }
  }

  async loadDraft(): Promise<ProfileDraft | null> {
    try {
      const raw = localStorage.getItem(this.draftKey);
      if (!raw) return null;

      const parsed: unknown = JSON.parse(raw);

      // Basic structural validation before trusting localStorage data
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('data' in parsed) ||
        !('currentStep' in parsed) ||
        !('lastSaved' in parsed)
      ) {
        console.warn('[ProfileService] Invalid draft structure, clearing draft.');
        await this.clearDraft();
        return null;
      }

      return parsed as ProfileDraft;
    } catch (error) {
      console.warn('[ProfileService] Failed to load draft:', error);
      return null;
    }
  }

  async clearDraft(): Promise<void> {
    try {
      localStorage.removeItem(this.draftKey);
    } catch (error) {
      console.warn('[ProfileService] Failed to clear draft:', error);
    }
  }

  async submitProfile(data: StudentProfileFormData): Promise<{ id: string }> {
    const response = await apiClient.put<{ id: string }>('/profile', data);
    // Draft is now superseded by the server copy
    await this.clearDraft();
    return response.data;
  }

  /**
   * Load the saved profile from the backend, already in wizard-form shape.
   * Returns null when the student hasn't completed onboarding yet.
   */
  async loadProfile(): Promise<Partial<StudentProfileFormData> | null> {
    try {
      const response = await apiClient.get<{
        isComplete: boolean;
        profile: Partial<StudentProfileFormData>;
      }>('/profile');
      if (!response.data.isComplete) return null;
      return response.data.profile;
    } catch {
      // Unauthenticated or server unreachable — the wizard still works from draft
      return null;
    }
  }
}

// ─── Singleton Export ──────────────────────────────────────────────────────────
// Export a singleton instance so all consumers share the same service.

export const profileService = new HybridProfileService();
