import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [company_name, setCompanyName] = useState('');
  const [webhook_url, setWebhookUrl] = useState('');
  const [webhook_secret, setWebhookSecret] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetResult, setResetResult] = useState(null);
  const [exportJson, setExportJson] = useState('');
  const [keys, setKeys] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setErr('');
    try {
      const { data } = await client.get('/settings/profile');
      setProfile(data);
      setCompanyName(data.company_name || '');
      setWebhookUrl(data.webhook_url || '');
      setWebhookSecret(data.webhook_secret || '');
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setMsg('');
    setErr('');
    try {
      const { data } = await client.put('/settings/profile', { company_name, webhook_url, webhook_secret });
      setProfile(data);
      setMsg('Saved.');
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    }
  };

  const rotateKeys = async () => {
    setErr('');
    try {
      const { data } = await client.post('/settings/api-keys/rotate');
      setKeys(data);
      await load();
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    }
  };

  const runExport = async () => {
    setErr('');
    setExportJson('');
    try {
      const { data } = await client.get('/settings/export');
      setExportJson(JSON.stringify(data, null, 2));
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    }
  };

  const requestReset = async (e) => {
    e.preventDefault();
    setResetResult(null);
    setErr('');
    try {
      const { data } = await client.post('/auth/request-reset', { email: resetEmail });
      setResetResult(data);
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    }
  };

  if (!profile && !err) return <p className="empty">Loading…</p>;

  return (
    <>
      <h1>Settings</h1>
      <p className="subtitle">
        Profile, webhooks, API keys, export — <Link to="/">Home</Link>
      </p>
      {err && <p className="error-msg">{err}</p>}
      {msg && <p style={{ color: 'var(--accent)' }}>{msg}</p>}

      <div className="card" style={{ maxWidth: 560 }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Profile & webhooks</h2>
        <form onSubmit={saveProfile}>
          <div className="form-group">
            <label>Email</label>
            <input value={profile?.email || ''} disabled style={{ opacity: 0.7 }} />
          </div>
          <div className="form-group">
            <label htmlFor="co">Company</label>
            <input id="co" value={company_name} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="wh">Webhook URL</label>
            <input id="wh" value={webhook_url} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://example.test/hook" />
          </div>
          <div className="form-group">
            <label htmlFor="whs">Webhook secret</label>
            <input id="whs" value={webhook_secret} onChange={(e) => setWebhookSecret(e.target.value)} />
          </div>
          <button type="submit" className="btn">
            Save
          </button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>API keys</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Current public: {profile?.api_key_public}</p>
        <button type="button" className="btn secondary" onClick={rotateKeys}>
          Rotate keys
        </button>
        {keys && (
          <pre className="mono" style={{ marginTop: '1rem', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(keys, null, 2)}
          </pre>
        )}
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Export JSON</h2>
        <button type="button" className="btn secondary" onClick={runExport}>
          Download snapshot
        </button>
        {exportJson && (
          <textarea readOnly value={exportJson} style={{ width: '100%', minHeight: 200, marginTop: '1rem', fontSize: '0.75rem' }} />
        )}
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Password reset (lab flow)</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
          Baseline returns a token in JSON — for class discussion only.
        </p>
        <form onSubmit={requestReset}>
          <div className="form-group">
            <label htmlFor="re">Email</label>
            <input id="re" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn secondary">
            Request reset
          </button>
        </form>
        {resetResult && (
          <pre className="mono" style={{ marginTop: '1rem', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(resetResult, null, 2)}
          </pre>
        )}
      </div>
    </>
  );
}
