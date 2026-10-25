"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "draftmark:reviewer_name";

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function useReviewerName() {
  const searchParams = useSearchParams();
  const storedName = useSyncExternalStore(
    subscribeToStorage,
    () => localStorage.getItem(STORAGE_KEY) ?? "",
    () => ""
  );
  const fromUrl = searchParams.get("reviewer");

  // An explicit edit wins for the rest of the session; otherwise the URL param
  // seeds the name, falling back to the last persisted value.
  const [editedName, setEditedName] = useState<string | null>(null);
  const name = editedName ?? fromUrl ?? storedName;

  // Persist a URL-provided name. Write-only effect (no setState).
  useEffect(() => {
    if (fromUrl) localStorage.setItem(STORAGE_KEY, fromUrl);
  }, [fromUrl]);

  const setName = useCallback((value: string) => {
    setEditedName(value);
  }, []);

  const persistName = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    }
  }, []);

  return { name, setName, persistName };
}
