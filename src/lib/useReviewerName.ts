"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "draftmark:reviewer_name";

export function useReviewerName() {
  const searchParams = useSearchParams();
  const [name, setNameState] = useState("");

  useEffect(() => {
    const fromUrl = searchParams.get("reviewer");
    const fromStorage = localStorage.getItem(STORAGE_KEY);

    const initial = fromUrl || fromStorage || "";
    setNameState(initial);

    // If URL param is present, persist it
    if (fromUrl && fromUrl !== fromStorage) {
      localStorage.setItem(STORAGE_KEY, fromUrl);
    }
  }, [searchParams]);

  const setName = useCallback((value: string) => {
    setNameState(value);
  }, []);

  const persistName = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    }
  }, []);

  return { name, setName, persistName };
}
