import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import TextField from '../ui/TextField.jsx';
import FormActions from '../ui/FormActions.jsx';
import { LoginDecoration } from '../ui/pageDecorations.jsx';
import logo from '../assets/tf-logo-indigo.svg';

// Inline rather than a library: there is no icon package in this project, and STYLE.md rules
// out adding a dependency for two glyphs. Feather's well-known eye / eye-off outlines, just
// redrawn as plain SVG. `currentColor` lets the button's own CSS colour the stroke.
function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

/**
 * Console sign in. POST /api/admin/v1/auth/login with an email and a password.
 *
 * A wrong password, an unknown email and a disabled account all answer 401 with the same
 * message, deliberately, so nobody can work out which emails exist. So the screen shows one
 * message for all three rather than guessing which happened.
 */
export default function LoginScreen() {
  const { signIn, signingIn, signedIn, restoring } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  // Hidden by default, on every open of this screen. Whether it is a real password or plain
  // text is a display choice only — the value in `form.password` never changes because of it.
  const [showPassword, setShowPassword] = useState(false);

  function change(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    // Clear this field's error as soon as the operator starts fixing it, so a stale message
    // does not sit under a field they have already corrected.
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }

  // Validate on submit, not on every keystroke. Per-keystroke validation makes messages
  // flash while somebody is still typing their email.
  function validate() {
    const found = {};
    if (!form.email.trim()) found.email = 'Enter your email address.';
    else if (!form.email.includes('@')) found.email = 'That does not look like an email address.';
    if (!form.password) found.password = 'Enter your password.';
    return found;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      await signIn(form.email.trim(), form.password);
      // Send them where they were heading before the guard intercepted them.
      const target = location.state?.from ?? '/';
      navigate(target, { replace: true });
    } catch (error) {
      if (error.isAuthFailure) {
        setErrors({ password: 'Email or password is wrong.' });
      } else {
        toast.failed(error);
      }
    }
  }

  // Reloading while sitting on /login still restores the session, so do not show a sign in
  // form to somebody who is already signed in. Computed during render rather than in an
  // effect, because it is derived from state we already have.
  if (restoring) {
    return <p className="muted">Checking your session...</p>;
  }
  if (signedIn) {
    return <Navigate to={location.state?.from ?? '/'} replace />;
  }

  return (
    <div className="login-page">
      <LoginDecoration />
      <form className="card login-card" onSubmit={handleSubmit} noValidate>
        <img src={logo} alt="Taylor & Francis" className="login-logo" />
        <h1>Sign in</h1>
        <p className="muted">Operator access to the TF Reader console.</p>

        <TextField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={change}
          error={errors.email}
          placeholder="you@taylorandfrancis.com"
          disabled={signingIn}
          autoFocus
        />
        <TextField
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={form.password}
          onChange={change}
          error={errors.password}
          disabled={signingIn}
          endAdornment={
            <button
              type="button"
              className="input-adornment-btn"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          }
        />

        <FormActions
          onCancel={() => {
            setForm({ email: '', password: '' });
            setErrors({});
          }}
          saving={signingIn}
          saveLabel="Sign in"
          cancelLabel="Clear"
        />
      </form>
    </div>
  );
}
