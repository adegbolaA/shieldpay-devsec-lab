import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';

function formatMoney(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);
}

function buildLast7Bars(rows) {
  const volByDay = Object.fromEntries((rows || []).map((r) => [r.d, Number(r.v) || 0]));
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ d: key, v: volByDay[key] || 0 });
  }
  const max = Math.max(1, ...out.map((x) => x.v));
  return out.map((x) => ({ ...x, h: Math.round((x.v / max) * 100) }));
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: d } = await client.get('/stats/dashboard');
        if (!cancelled) setData(d);
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.error || e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) return <p className="error-msg">{err}</p>;
  if (!data) return <p className="empty">Loading dashboard…</p>;

  const bars = buildLast7Bars(data.last7_days);
  const t = data.totals;

  return (
    <>
      <h1>Dashboard</h1>
      <p className="subtitle">Overview for your merchant account</p>

      <div className="grid-stats">
        <div className="stat-box">
          <div className="label">Captured volume</div>
          <div className="value">{formatMoney(t.volume_cents)}</div>
        </div>
        <div className="stat-box">
          <div className="label">Transactions</div>
          <div className="value">{t.transactions}</div>
        </div>
        <div className="stat-box">
          <div className="label">Customers</div>
          <div className="value">{t.customers}</div>
        </div>
        <div className="stat-box">
          <div className="label">Saved cards</div>
          <div className="value">{t.cards}</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Last 7 days (volume)</h2>
        <div className="bar-chart">
          {bars.map((b) => (
            <div key={b.d} className="bar-col">
              <div className="bar" style={{ height: `${b.h}px` }} title={formatMoney(b.v)} />
              <span className="bar-label">{b.d.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Recent transactions</h2>
        {(data.recent_transactions || []).length === 0 ? (
          <p className="empty">No transactions yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_transactions.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/transactions/${r.id}`}>{r.id}</Link>
                    </td>
                    <td>{r.customer_name || '—'}</td>
                    <td>{formatMoney(r.amount_cents)}</td>
                    <td>
                      <span className={`badge ${r.status === 'captured' ? 'ok' : r.status === 'refunded' ? 'warn' : 'bad'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>{r.description}</td>
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
