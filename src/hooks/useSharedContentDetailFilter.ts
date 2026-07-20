import { useCallback, useState } from 'react';

export type SharedContentDetailFilterView = 'list' | 'filter';

export function useSharedContentDetailFilter<T extends Record<string, unknown>>(
  initialState: T,
) {
  const [view, setView] = useState<SharedContentDetailFilterView>('list');
  const [applied, setApplied] = useState<T>(initialState);
  const [draft, setDraft] = useState<T>(initialState);

  const openFilter = useCallback(() => {
    setDraft({ ...applied });
    setView('filter');
  }, [applied]);

  const applyFilter = useCallback(() => {
    setApplied({ ...draft });
    setView('list');
  }, [draft]);

  const closeFilter = useCallback(() => {
    setView('list');
  }, []);

  const resetApplied = useCallback(
    (empty: T) => {
      setApplied(empty);
      setDraft(empty);
    },
    [],
  );

  const resetDraft = useCallback(
    (empty: T) => {
      setDraft(empty);
    },
    [],
  );

  return {
    view,
    applied,
    draft,
    setApplied,
    setDraft,
    openFilter,
    applyFilter,
    closeFilter,
    resetApplied,
    resetDraft,
  };
}
