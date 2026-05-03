import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';

export default function Customers() {
  const [search, setSearch] = useState('');
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (q) => {
    setErr('');
    setLoading(true);
    try {
      const { data } = await client.get('/customers', { params: { search: q } });
      setList(data.customers || []);
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    load(search);
  };

  return (
    <>
      <h1>Customers</h1>
      <p className="subtitle">Search uses the merchant-scoped list API</p>

      <form onSubmit={onSearch} className="card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ marginBottom: 0, flex: '1 1 220px' }}>
          <label htmlFor="search">Search</label>
          <input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, phone" />
        </div>
        <button type="submit" className="btn">
          Search
        </button>
        <Link to="/customers/new" className="btn secondary" style={{ textDecoration: 'none' }}>
          Add customer
        </Link>
      </form>

      {err && <p className="error-msg">{err}</p>}
      {loading ? (
        <p className="empty">Loading…</p>
      ) : list.length === 0 ? (
        <p className="empty">No customers match.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/customers/${c.id}`}>{c.id}</Link>
                  </td>
                  <td>{c.name}</td>
                  <td>{c.email || '—'}</td>
                  <td>{c.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
