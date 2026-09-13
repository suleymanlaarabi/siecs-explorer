import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

const DEFAULT_DEBOUNCE_MS = 600;

export function useDebouncedAutosave<T>({
  draft,
  remoteValue,
  onSave,
  onRemoteSync,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: {
  draft: T;
  remoteValue: T;
  onSave: (value: T) => Promise<T>;
  onRemoteSync: (value: T) => void;
  debounceMs?: number;
}) {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string>();
  const [locallyDirty, setLocallyDirty] = useState(false);
  const [editing, setEditing] = useState(false);
  const draftRef = useRef(draft);
  const pendingRef = useRef<T | undefined>(undefined);
  const savingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const editingRef = useRef(false);
  const mountedRef = useRef(true);
  const syncedRemoteValue = useRef(remoteValue);
  const validRef = useRef(true);
  const flushSaveRef = useRef<() => Promise<void>>(async () => undefined);

  const flush = useCallback(async () => {
    if (savingRef.current || pendingRef.current === undefined || !validRef.current) return;

    const value = pendingRef.current;
    pendingRef.current = undefined;
    savingRef.current = true;
    if (mountedRef.current) {
      setSaveState('saving');
      setError(undefined);
    }

    try {
      const saved = await onSave(value);
      syncedRemoteValue.current = saved;
      if (mountedRef.current) {
        if (pendingRef.current === undefined && !editingRef.current) {
          onRemoteSync(saved);
          setLocallyDirty(false);
        }
        setSaveState(pendingRef.current === undefined ? 'saved' : 'pending');
      }
    } catch (saveError) {
      if (mountedRef.current) {
        setSaveState('error');
        setError(saveError instanceof Error ? saveError.message : 'Save failed');
      }
    } finally {
      savingRef.current = false;
      if (mountedRef.current && pendingRef.current !== undefined) {
        void flushSaveRef.current();
      }
    }
  }, [onRemoteSync, onSave]);

  useEffect(() => {
    flushSaveRef.current = flush;
  }, [flush]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (
      !locallyDirty &&
      !savingRef.current &&
      pendingRef.current === undefined &&
      syncedRemoteValue.current !== remoteValue
    ) {
      syncedRemoteValue.current = remoteValue;
      onRemoteSync(remoteValue);
    }
  }, [locallyDirty, onRemoteSync, remoteValue]);

  useEffect(() => {
    if (saveState !== 'saved') return;
    const timer = setTimeout(() => setSaveState('idle'), 1500);
    return () => clearTimeout(timer);
  }, [saveState]);

  const update = (value: T) => {
    setLocallyDirty(true);
    pendingRef.current = value;
    setSaveState('pending');
    setError(undefined);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = undefined;
      void flushSaveRef.current();
    }, debounceMs);
  };

  const setValidity = (valid: boolean) => {
    validRef.current = valid;
    if (!valid) {
      pendingRef.current = undefined;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
      setSaveState('pending');
    }
  };

  const setEditingState = (nextEditing: boolean) => {
    editingRef.current = nextEditing;
    setEditing(nextEditing);
    if (!nextEditing && pendingRef.current === undefined && !savingRef.current) {
      setLocallyDirty(false);
    }
  };

  return {
    saveState,
    error,
    dirty:
      locallyDirty || saveState === 'pending' || saveState === 'saving' || saveState === 'error',
    editing,
    update,
    setValidity,
    setEditing: setEditingState,
    flush,
  };
}
