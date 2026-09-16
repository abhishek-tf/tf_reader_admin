import { useEffect } from 'react';

/**
 * Warns before a reload or tab close would throw away unsaved input, or interrupt something
 * already in flight - the one thing a form like BookForm cannot recover from on its own (a
 * File object cannot be persisted across a real reload, so there is nothing to restore it from
 * afterwards). Pass whether there is currently something worth warning about; this hook does
 * the actual add/removeEventListener bookkeeping, so a form using it stays a one-line call.
 */
export function useBeforeUnloadWarning(shouldWarn) {
  useEffect(() => {
    if (!shouldWarn) return undefined;
    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shouldWarn]);
}
