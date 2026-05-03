import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('merchant@demo.com');
  const [password, setPassword] = useState('Demo1234!');
  const [err, setErr] = useState('');

  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await login(email, password);
      nav('/', { replace: true });
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message || 'Login failed');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>ShieldPay</h1>
        <p className="subtitle" style={{ marginBottom: '1.5rem' }}>
          Multi-merchant payments dashboard (demo / fake money)
        </p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {err && <p className="error-msg">{err}</p>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: '0.5rem' }}>
            Sign in
          </button>
        </form>
        <p style={{ marginTop: '1.25rem', fontSize: '0.9rem', color: 'var(--muted)' }}>
          No account? <Link to="/register">Register a merchant</Link>
        </p>
        <p className="mono" style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
          Seeded demo: merchant@demo.com / Demo1234!
        </p>
      </div>
    </div>
  );
}
