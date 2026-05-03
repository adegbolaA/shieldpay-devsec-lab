import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';

function formatMoney(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);
}

export default function Admin() {
  const [merchants, setMerchants] = useState([]);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, s] = await Promise.all([client.get('/admin/merchants'), client.get('/admin/stats')]);
        if (cancelled) return;
        setMerchants(m.data.merchants || []);
        setStats(s.data);
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.error || e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <h1>Admin</h1>
      <p className="subtitle">
        Global view — <Link to="/">Dashboard</Link>
      </p>
      {err && <p className="error-msg">{err}</p>}
      {stats && (
        <div className="grid-stats">
          <div className="stat-box">
            <div className="label">Merchants</div>
            <div className="value">{stats.merchants}</div>
          </div>
          <div className="stat-box">
            <div className="label">All transactions</div>
            <div className="value">{stats.transactions}</div>
          </div>
          <div className="stat-box">
            <div className="label">Platform volume</div>
            <div className="value">{formatMoney(stats.volume_cents)}</div>
          </div>
        </div>
      )}
      <div className="card">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Merchants</h2>
        {merchants.length === 0 ? (
          <p className="empty">No data.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {merchants.map((m) => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>{m.email}</td>
                    <td>{m.company_name}</td>
                    <td>{m.role}</td>
                    <td className="mono" style={{ fontSize: '0.8rem' }}>
                      {m.created_at}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
