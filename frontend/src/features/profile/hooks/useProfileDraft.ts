import { useCallback, useEffect, useRef, useState } from 'react';
import { profileService } from '../services/profileService';
import type { StudentProfileFormData, ProfileDraft } from '../types';

const DEBOUNCE_MS = 500;

interface UseProfileDraftReturn {
  hasDraft: boolean;
  lastSavedAt: string | null;
  isRestoring: boolean;
  loadedDraft: ProfileDraft | null;
  saveDraft: (data: Partial<StudentProfileFormData>, currentStep: number) => void;
  clearDraft: () => Promise<void>;
}

// ─── useProfileDraft ───────────────────────────────────────────────────────────
// Manages draft persistence to localStorage.
// Debounces saves to avoid thrashing storage on each keystroke.
// Validates draft structure before restoring.

export function useProfileDraft(): UseProfileDraftReturn {
  const [hasDraft, setHasDraft] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [loadedDraft, setLoadedDraft] = useState<ProfileDraft | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft on mount
  useEffect(() => {
    let cancelled = false;

    profileService.loadDraft().then((draft) => {
      if (cancelled) return;

      if (draft) {
        setHasDraft(true);
        setLastSavedAt(draft.lastSaved);
        setLoadedDraft(draft);
      }

      setIsRestoring(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const saveDraft = useCallback((data: Partial<StudentProfileFormData>, currentStep: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      profileService.saveDraft(data, currentStep).then(() => {
        setHasDraft(true);
        setLastSavedAt(new Date().toISOString());
      });
    }, DEBOUNCE_MS);
  }, []);

  const clearDraft = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await profileService.clearDraft();
    setHasDraft(false);
    setLastSavedAt(null);
    setLoadedDraft(null);
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return { hasDraft, lastSavedAt, isRestoring, loadedDraft, saveDraft, clearDraft };
}
