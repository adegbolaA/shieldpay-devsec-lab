import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">ShieldPay</div>
        <nav className="sidebar-nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/customers">Customers</NavLink>
          <NavLink to="/cards">Cards</NavLink>
          <NavLink to="/transactions">Transactions</NavLink>
          <NavLink to="/payments/new">New payment</NavLink>
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <div className="sidebar-footer">
          <div>{user?.company_name || user?.email}</div>
          <button type="button" className="btn secondary" style={{ marginTop: '0.75rem', width: '100%' }} onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
