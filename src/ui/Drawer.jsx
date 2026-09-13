import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The slide-over panel Stitch uses for a longer, sectioned form (Create & Ingest Book): a
 * breadcrumb + title header, a scrollable body of `.drawer-section` blocks, and a footer
 * pinned to the bottom. Same open/trap/Escape/backdrop-click contract as Modal — the two
 * differ only in shape (right-edge panel vs centred card), not in behaviour.
 */
export default function Drawer({ open, onClose, eyebrow, title, children, footer, wide = false }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const panel = panelRef.current;
    panel?.querySelector(FOCUSABLE)?.focus();

    function handleKeydown(event) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll(FOCUSABLE));
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
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className={wide ? 'drawer-panel drawer-panel-wide' : 'drawer-panel'}
        aria-label={title}
        ref={panelRef}
      >
        <div className="drawer-header">
          <div>
            {eyebrow ? <div className="drawer-eyebrow">{eyebrow}</div> : null}
            <h2 className="drawer-title">{title}</h2>
          </div>
          <button type="button" className="modal-close" aria-label="Close drawer" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer ? <div className="drawer-footer">{footer}</div> : null}
      </aside>
    </div>
  );
}
