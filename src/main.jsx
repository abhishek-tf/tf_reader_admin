import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { ToastProvider } from './ui/ToastContext.jsx';
import './index.css';

// Provider order matters. AuthProvider is inside ToastProvider so that a future auth error
// can raise a toast. BrowserRouter is outermost of the three because the guard inside
// AuthProvider navigates.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>
);
