import { Component } from 'react';
import Icon from './Icon.jsx';

/**
 * The last line of defense: catches anything a route's own `RouteErrorBoundary` doesn't - an
 * error thrown above any route's `<Outlet/>`, or outside one entirely. Before this, there was
 * no error boundary anywhere above `RouteErrorBoundary`'s own per-route instances, so a crash
 * anywhere else had nowhere to go and React had no choice but to unmount the whole root,
 * leaving a blank page with nothing to explain it or offer a way out.
 *
 * Root-level, so there is no `resetKey`/route to fall back to the way `RouteErrorBoundary` has
 * - the one way out here is a real reload, which is what the button does.
 *
 * A class component is the one place STYLE.md's "avoid classes" doesn't apply, same reasoning
 * as `RouteErrorBoundary`: there is no hook equivalent of `getDerivedStateFromError`.
 */
export default class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  // Same reasoning as RouteErrorBoundary's own componentDidCatch: without this, a caught error
  // leaves no trace anywhere in the console, which defeats the point of catching it at all.
  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught:', error, info.componentStack);
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
              The console hit an error it couldn&apos;t recover from. Reloading is safe - nothing is
              lost that wasn&apos;t already saved.
            </p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              <Icon name="refresh" /> Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
