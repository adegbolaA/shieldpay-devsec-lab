import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client.js';

export default function NewPayment() {
  const nav = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [cards, setCards] = useState([]);
  const [customer_id, setCustomerId] = useState('');
  const [card_id, setCardId] = useState('');
  const [amount_dollars, setAmount] = useState('10.00');
  const [description, setDescription] = useState('Demo charge');
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cRes, cardRes] = await Promise.all([client.get('/customers'), client.get('/cards')]);
        if (cancelled) return;
        setCustomers(cRes.data.customers || []);
        setCards(cardRes.data.cards || []);
      } catch (e) {
        if (!cancelled) setErr(e.response?.data?.error || e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const { data } = await client.post('/payments/process', {
        customer_id: customer_id ? Number(customer_id) : undefined,
        card_id: card_id ? Number(card_id) : undefined,
        amount_dollars: Number(amount_dollars),
        description,
      });
      nav(`/transactions/${data.id}`);
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.message);
    }
  };

  return (
    <>
      <h1>New payment</h1>
      <p className="subtitle">
        <Link to="/transactions">← Transactions</Link>
      </p>
      <div className="card" style={{ maxWidth: 480 }}>
        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="cust">Customer (optional if card selected)</label>
            <select id="cust" value={customer_id} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">—</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (#{c.id})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="card">Card</label>
            <select id="card" value={card_id} onChange={(e) => setCardId(e.target.value)}>
              <option value="">—</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brand} ·••• {String(c.pan).slice(-4)} (#{c.id})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="amt">Amount (USD)</label>
            <input
              id="amt"
              type="number"
              step="0.01"
              min="0.01"
              value={amount_dollars}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="desc">Description</label>
            <input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          {err && <p className="error-msg">{err}</p>}
          <button type="submit" className="btn">
            Process payment
          </button>
        </form>
      </div>
    </>
  );
}
