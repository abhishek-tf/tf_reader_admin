import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const DISMISS_AFTER_MS = 4000;

/**
 * The "saved" and "that failed" messages, for the whole app.
 *
 * A screen calls toast.saved() or toast.failed(error) and does not care how it is shown.
 *
 * A failure carries the traceId when the error has one, because that is the only thing that
 * makes a bug report findable in the server logs.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  // A ref, not state: an id is not rendered, so bumping it should not cause a re-render.
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (tone, text, traceId) => {
      const id = nextId.current;
      nextId.current += 1;
      setToasts((current) => [...current, { id, tone, text, traceId }]);
      // A failure stays until dismissed. An operator who looks away should not miss the one
      // message that mattered, and a traceId they cannot read is useless.
      if (tone !== 'error') {
        window.setTimeout(() => dismiss(id), DISMISS_AFTER_MS);
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      saved: (text = 'Saved.') => push('ok', text),
      failed: (errorOrText, fallback = 'That failed.') => {
        if (typeof errorOrText === 'string') return push('error', errorOrText);
        const error = errorOrText;
        return push('error', error?.friendly || error?.message || fallback, error?.traceId);
      },
      info: (text) => push('info', text),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.tone}`}>
            <div className="toast-body">
              <p>{toast.text}</p>
              {toast.traceId ? <p className="trace">Trace {toast.traceId}</p> : null}
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error('useToast must be used inside ToastProvider. Check main.jsx.');
  }
  return context;
}
