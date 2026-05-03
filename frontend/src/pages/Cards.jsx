import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client.js';

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await client.get('/cards');
        if (!cancelled) setCards(data.cards || []);
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
      <h1>Saved cards</h1>
      <p className="subtitle">Test card numbers only — lab baseline may expose full PAN/CVV in API responses</p>
      {err && <p className="error-msg">{err}</p>}
      {cards.length === 0 ? (
        <p className="empty">No cards on file.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Brand</th>
                <th>PAN</th>
                <th>CVV</th>
                <th>Exp</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/cards/${c.id}`}>{c.id}</Link>
                  </td>
                  <td>{c.customer_name}</td>
                  <td>{c.brand}</td>
                  <td className="mono">{c.pan}</td>
                  <td className="mono">{c.cvv}</td>
                  <td>
                    {c.exp_month}/{c.exp_year}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
