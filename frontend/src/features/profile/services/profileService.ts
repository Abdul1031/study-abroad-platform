import { STORAGE_KEYS } from '../utils/constants';
import type { ProfileServiceContract, StudentProfileFormData, ProfileDraft } from '../types';

// ─── Local Storage Profile Service ────────────────────────────────────────────
// Implements ProfileServiceContract using localStorage.
// Swap this implementation for an API-based service in future phases
// without changing any consuming components.

class LocalStorageProfileService implements ProfileServiceContract {
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

  async submitProfile(_data: StudentProfileFormData): Promise<{ id: string }> {
    // Mock submission — replace with API call in Phase 2
    // Simulates network latency for realistic UX testing
    await new Promise<void>((resolve) => setTimeout(resolve, 1500));

    const mockId = `student_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Clear draft on successful submission
    await this.clearDraft();

    return { id: mockId };
  }
}

// ─── Singleton Export ──────────────────────────────────────────────────────────
// Export a singleton instance so all consumers share the same service.
// Replace this with dependency injection when moving to backend.

export const profileService: ProfileServiceContract = new LocalStorageProfileService();
