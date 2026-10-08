import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import Field from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Login() {
  usePageTitle('Sign in');
  const { login } = useAuth();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError('');
    try {
      // The public-only route sends the user onward once the session is set.
      await login(values.email, values.password);
    } catch (error) {
      setErrors(error.details || {});
      setFormError(error.details ? '' : error.message);
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see your applications."
      footer={
        <>
          New here?{' '}
          <Link className="link" to="/register">
            Create an account
          </Link>
        </>
      }
    >
      <form className="form-stack" onSubmit={onSubmit} noValidate>
        {formError && (
          <div className="alert" role="alert">
            {formError}
          </div>
        )}

        <Field id="email" label="Email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            autoComplete="email"
            autoFocus
            value={values.email}
            onChange={onChange}
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
        </Field>

        <Field id="password" label="Password" error={errors.password}>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            autoComplete="current-password"
            value={values.password}
            onChange={onChange}
            aria-invalid={errors.password ? 'true' : undefined}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
        </Field>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy && <span className="spinner" />}
          Sign in
        </button>
      </form>
    </AuthShell>
  );
}
