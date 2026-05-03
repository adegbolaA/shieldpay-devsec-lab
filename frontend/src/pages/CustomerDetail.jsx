import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import client from '../api/client.js';

export default function CustomerDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [row, setRow] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get(`/customers/${id}`);
        if (cancelled) return;
        setRow(data);
        setName(data.name);
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setNotes(data.notes || '');
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
      const { data } = await client.put(`/customers/${id}`, { name, email, phone, notes });
      setRow(data);
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await client.delete(`/customers/${id}`);
      nav('/customers');
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    }
  };

  if (err && !row) return <p className="error-msg">{err}</p>;
  if (!row) return <p className="empty">Loading…</p>;

  return (
    <>
      <h1>{row.name}</h1>
      <p className="subtitle">
        <Link to="/customers">← Customers</Link>
      </p>
      {err && <p className="error-msg">{err}</p>}
      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={save}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
