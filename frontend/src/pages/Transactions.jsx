import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';

function formatMoney(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);
}

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get('/transactions');
        if (!cancelled) setRows(data.transactions || []);
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
      <h1>Transactions</h1>
      <p className="subtitle">History for your merchant</p>
      {err && <p className="error-msg">{err}</p>}
      {rows.length === 0 ? (
        <p className="empty">No transactions yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>When</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link to={`/transactions/${t.id}`}>{t.id}</Link>
                  </td>
                  <td className="mono" style={{ fontSize: '0.8rem' }}>
                    {t.created_at}
                  </td>
                  <td>{t.customer_name || '—'}</td>
                  <td>{formatMoney(t.amount_cents)}</td>
                  <td>
                    <span className={`badge ${t.status === 'captured' ? 'ok' : t.status === 'refunded' ? 'warn' : 'bad'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td>{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
