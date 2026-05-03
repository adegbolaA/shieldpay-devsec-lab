import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import client from '../api/client.js';

export default function CardDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [row, setRow] = useState(null);
  const [holder_name, setHolderName] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get(`/cards/${id}`);
        if (cancelled) return;
        setRow(data);
        setHolderName(data.holder_name || '');
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.error || e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const { data } = await client.put(`/cards/${id}`, { holder_name });
      setRow(data);
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    }
  };

  const remove = async () => {
    if (!window.confirm('Remove this card?')) return;
    try {
      await client.delete(`/cards/${id}`);
      nav('/cards');
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    }
  };

  if (err && !row) return <p className="error-msg">{err}</p>;
  if (!row) return <p className="empty">Loading…</p>;

  return (
    <>
      <h1>Card #{row.id}</h1>
      <p className="subtitle">
        <Link to="/cards">← Cards</Link>
      </p>
      {err && <p className="error-msg">{err}</p>}
      <div className="card" style={{ maxWidth: 520 }}>
        <p className="mono">
          PAN: {row.pan} · CVV: {row.cvv} · Exp: {row.exp_month}/{row.exp_year}
        </p>
        <p>
          Customer: {row.customer_name} (ID {row.customer_id})
        </p>
        <form onSubmit={save}>
          <div className="form-group">
            <label htmlFor="holder">Cardholder name</label>
            <input id="holder" value={holder_name} onChange={(e) => setHolderName(e.target.value)} />
          </div>
          <div className="row-actions">
            <button type="submit" className="btn">
              Save
            </button>
            <button type="button" className="btn danger" onClick={remove}>
              Delete
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
