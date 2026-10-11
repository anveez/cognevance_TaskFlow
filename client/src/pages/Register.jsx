import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand"><span className="brand-icon">✓</span>Taskwine</div>
        <div className="auth-heading">
          <p className="eyebrow">Get started</p>
          <h1>Create your account</h1>
          <p>Add tasks, set deadlines, and track what's done.</p>
        </div>

        {error && <div className="error-message" role="alert">{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="name">Name</label>
          <input id="name" required autoComplete="name" value={form.name} onChange={set('name')} />

          <label htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />

          <label htmlFor="password">Password (at least 8 characters)</label>
          <div className="password-field">
            <input id="password" type={show ? 'text' : 'password'} required minLength={8} autoComplete="new-password"
              value={form.password} onChange={set('password')} />
            <button type="button" className="password-toggle" onClick={() => setShow(!show)}>
              {show ? 'Hide' : 'Show'}
            </button>
          </div>

          <button className="primary-button" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        </form>

        <p className="auth-footer">Already registered? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}