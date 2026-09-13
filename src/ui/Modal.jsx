import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The centred, Indigo-backdrop dialog Stitch uses for a focused edit (Create Publisher, Add
 * Institution): a title with a close button, a scrollable body, and a footer that pins the
 * cancel/confirm pair to the bottom-right.
 *
 * Traps Tab inside the dialog and closes on Escape or a backdrop click, same expectations as
 * any modal — closing is the caller's call (`onClose`), this component only reports the intent.
 */
export default function Modal({ open, onClose, title, children, footer, width = 'default' }) {
  const cardRef = useRef(null);
  // `onClose` is an inline arrow function at nearly every call site, so it is a new reference
  // on every render of the caller — including the one caused by typing a single character into
  // any field inside this modal, since that's a state update in the caller (or a component
  // between it and here) same as any other. A ref sidesteps that: the Escape/Tab handler below
  // always calls whatever `onClose` currently is, without needing it in the effect's own
  // dependency array.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;

    const card = cardRef.current;
    card?.querySelector(FOCUSABLE)?.focus();

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !card) return;
      const focusable = Array.from(card.querySelectorAll(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
    // `onClose` deliberately isn't a dependency here — see the ref above. Re-running this on
    // every caller render was the actual bug: it re-grabs and refocuses the first focusable
    // element in the dialog every time, which yanked focus out of whatever field the operator
    // was mid-keystroke in.
  }, [open]);

  if (!open) return null;

  const cardClass = [
    'modal-card',
    width === 'wide' && 'modal-card-wide',
    width === 'xwide' && 'modal-card-xwide',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={cardClass} ref={cardRef}>
        <div className="modal-header">
          <h2 className="modal-title" id="modal-title">
            {title}
          </h2>
          <button type="button" className="modal-close" aria-label="Close dialog" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
