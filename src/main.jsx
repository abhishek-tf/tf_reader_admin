import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { ToastProvider } from './ui/ToastContext.jsx';
import AppErrorBoundary from './ui/AppErrorBoundary.jsx';
import './index.css';

// Provider order matters. AuthProvider is inside ToastProvider so that a future auth error
// can raise a toast. BrowserRouter is outermost of the three because the guard inside
// AuthProvider navigates. AppErrorBoundary wraps everything: it is the one thing above every
// route's own RouteErrorBoundary, so nothing here is left with no boundary at all.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>
);
