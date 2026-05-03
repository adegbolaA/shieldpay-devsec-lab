import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import client from '../api/client.js';

function formatMoney(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents || 0) / 100);
}

export default function TransactionDetail() {
  const { id } = useParams();
  const [row, setRow] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get(`/transactions/${id}`);
        if (!cancelled) setRow(data);
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.error || e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (err && !row) return <p className="error-msg">{err}</p>;
  if (!row) return <p className="empty">Loading…</p>;

  return (
    <>
      <h1>Transaction #{row.id}</h1>
      <p className="subtitle">
        <Link to="/transactions">← Transactions</Link>
      </p>
      <div className="card" style={{ maxWidth: 560 }}>
        <p>
          <strong>Amount:</strong> {formatMoney(row.amount_cents)} {row.currency}
        </p>
        <p>
          <strong>Status:</strong>{' '}
          <span className={`badge ${row.status === 'captured' ? 'ok' : row.status === 'refunded' ? 'warn' : 'bad'}`}>
            {row.status}
          </span>
        </p>
        <p>
          <strong>Customer:</strong> {row.customer_name || '—'} {row.customer_id ? `(#${row.customer_id})` : ''}
        </p>
        <p>
          <strong>Description:</strong> {row.description}
        </p>
        <p className="mono" style={{ fontSize: '0.85rem' }}>
          <strong>Created:</strong> {row.created_at}
        </p>
        {(row.pan_snapshot || row.cvv_snapshot) && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: 8 }}>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>Snapshot (unsafe baseline)</p>
            {row.pan_snapshot && (
              <p className="mono" style={{ margin: '0.5rem 0 0' }}>
                PAN: {row.pan_snapshot}
              </p>
            )}
            {row.cvv_snapshot && (
              <p className="mono" style={{ margin: '0.35rem 0 0' }}>
                CVV: {row.cvv_snapshot}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
