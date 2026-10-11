import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form);
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
          <p className="eyebrow">Welcome back</p>
          <h1>Log in to your tasks</h1>
          <p>See what's due and pick up where you left off.</p>
        </div>

        {error && <div className="error-message" role="alert">{error}</div>}

        <form className="auth-form" onSubmit={submit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

          <label htmlFor="password">Password</label>
          <div className="password-field">
            <input id="password" type={show ? 'text' : 'password'} required autoComplete="current-password"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" className="password-toggle" onClick={() => setShow(!show)}>
              {show ? 'Hide' : 'Show'}
            </button>
          </div>

          <button className="primary-button" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
        </form>

        <p className="auth-footer">New here? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  );
}