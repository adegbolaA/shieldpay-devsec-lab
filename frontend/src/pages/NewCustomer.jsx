import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client.js';

export default function NewCustomer() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const { data } = await client.post('/customers', { name, email, phone, notes });
      nav(`/customers/${data.id}`);
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    }
  };

  return (
    <>
      <h1>New customer</h1>
      <p className="subtitle">
        <Link to="/customers">← Customers</Link>
      </p>
      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
          {err && <p className="error-msg">{err}</p>}
          <button type="submit" className="btn">
            Save
          </button>
        </form>
      </div>
    </>
  );
}
