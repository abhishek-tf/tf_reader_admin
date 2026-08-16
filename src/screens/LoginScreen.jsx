import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useToast } from '../ui/ToastContext.jsx';
import TextField from '../ui/TextField.jsx';
import FormActions from '../ui/FormActions.jsx';

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
      <form className="card login-card" onSubmit={handleSubmit} noValidate>
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
          type="password"
          value={form.password}
          onChange={change}
          error={errors.password}
          disabled={signingIn}
        />

        <FormActions
          onCancel={() => setForm({ email: '', password: '' })}
          saving={signingIn}
          saveLabel="Sign in"
          cancelLabel="Clear"
        />

        <p className="muted small">
          A reload keeps you signed in for up to twelve hours. The access token is held in memory,
          and the refresh token is an `HttpOnly` cookie no script can read.
        </p>
      </form>
    </div>
  );
}
