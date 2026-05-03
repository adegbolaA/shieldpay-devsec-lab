import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company_name, setCompanyName] = useState('');
  const [err, setErr] = useState('');

  if (isAuthenticated) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await register({ email, password, company_name });
      nav('/', { replace: true });
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message || 'Registration failed');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Create merchant</h1>
        <p className="subtitle" style={{ marginBottom: '1.5rem' }}>
          Register for ShieldPay demo
        </p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="company">Company name</label>
            <input
              id="company"
              value={company_name}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {err && <p className="error-msg">{err}</p>}
          <button type="submit" className="btn" style={{ width: '100%', marginTop: '0.5rem' }}>
            Register
          </button>
        </form>
        <p style={{ marginTop: '1.25rem', fontSize: '0.9rem' }}>
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
