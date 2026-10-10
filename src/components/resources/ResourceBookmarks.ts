import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'gdg_bookmarked_resources_v1';

export const getBookmarkedIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const toggleBookmarkId = (id: string): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const current = getBookmarkedIds();
    const exists = current.includes(id);
    const updated = exists ? current.filter((x) => x !== id) : [...current, id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('gdg_bookmarks_changed', { detail: updated }));
    return !exists;
  } catch {
    return false;
  }
};

export const useResourceBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    setBookmarks(getBookmarkedIds());

    const handler = (e: Event) => {
      const custom = e as CustomEvent<string[]>;
      if (custom.detail) {
        setBookmarks(custom.detail);
      } else {
        setBookmarks(getBookmarkedIds());
      }
    };

    window.addEventListener('gdg_bookmarks_changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('gdg_bookmarks_changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    return toggleBookmarkId(id);
  }, []);

  const isBookmarked = useCallback(
    (id: string) => bookmarks.includes(id),
    [bookmarks]
  );

  return { bookmarks, toggle, isBookmarked, count: bookmarks.length };
};
