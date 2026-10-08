import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import Field from '../components/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import usePageTitle from '../hooks/usePageTitle.js';

export default function Register() {
  usePageTitle('Create account');
  const { register } = useAuth();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
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

    const found = {};
    if (values.name.trim().length < 2) found.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) found.email = 'Enter a valid email address.';
    if (values.password.length < 8) found.password = 'Use at least 8 characters.';
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await register(values.name.trim(), values.email.trim(), values.password);
    } catch (error) {
      setErrors(error.details || {});
      setFormError(error.details ? '' : error.message);
      setBusy(false);
    }
  };

  const bind = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange,
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start tracking your applications in a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link className="link" to="/login">
            Sign in
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

        <Field id="name" label="Name" error={errors.name}>
          <input className="input" autoComplete="name" autoFocus {...bind('name')} />
        </Field>

        <Field id="email" label="Email" error={errors.email}>
          <input className="input" type="email" autoComplete="email" {...bind('email')} />
        </Field>

        <Field id="password" label="Password" error={errors.password} hint="At least 8 characters.">
          <input className="input" type="password" autoComplete="new-password" {...bind('password')} />
        </Field>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy && <span className="spinner" />}
          Create account
        </button>
      </form>
    </AuthShell>
  );
}
