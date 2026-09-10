import { Component } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

/**
 * Catches a render error in whatever's rendered through a screen's own `<Outlet/>` — the
 * create/edit overlay, on Books and Publishers — so a bug in there leaves a way out instead
 * of a backdrop stuck on screen with nothing to close it. Before this, an error thrown while
 * that overlay was open had nothing to catch it at all: no error boundary existed anywhere in
 * this app, so React had no choice but to unmount from the nearest one, which was none —
 * except here the overlay's own backdrop is a sibling of the crashed content, not an ancestor
 * of it, so the backdrop stayed mounted and rendered while the panel inside it vanished,
 * exactly the "stuck on a blurred page, no way out" report this exists to fix.
 *
 * A class component is the one place STYLE.md's "avoid classes" doesn't apply: React has no
 * hook equivalent of `getDerivedStateFromError`/`componentDidCatch` as of this writing, so an
 * error boundary cannot be written any other way.
 *
 * `resetKey` is passed the current pathname by the caller — changing it (i.e., navigating
 * anywhere at all) remounts this boundary fresh, so an error here does not follow you back to
 * a working page or block you from reopening the same overlay a second time.
 */
export default class RouteErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="modal-backdrop" role="alertdialog" aria-modal="true">
        <div className="modal-card">
          <div className="modal-header">
            <h2 className="modal-title">Something went wrong</h2>
          </div>
          <div className="modal-body">
            <p className="muted">
              This screen hit an error and couldn&apos;t finish rendering. Closing it is safe —
              nothing you were doing here was saved unless you already clicked Save or Create.
            </p>
          </div>
          <div className="modal-footer">
            <Link className="btn btn-primary" to={this.props.fallbackTo}>
              <Icon name="close" /> Close
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
