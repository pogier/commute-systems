import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { getSocket } from '../services/socket';

const NAV = [
  { to: '/passenger/dashboard', label: 'Book a Ride' },
  { to: '/passenger/bookings',  label: 'My Bookings' },
];

export default function PassengerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { getSocket(); }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        padding: '0 32px', height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--passenger-bg)', border: '1px solid var(--passenger-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
              🎫
            </div>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Commute</span>
          </div>
          {/* Tabs */}
          <nav style={{ display: 'flex', gap: 3 }}>
            {NAV.map(item => (
              <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
                padding: '5px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                color: isActive ? 'var(--passenger-light)' : 'var(--text2)',
                background: isActive ? 'var(--passenger-bg)' : 'transparent',
                border: isActive ? '1px solid var(--passenger-border)' : '1px solid transparent',
                transition: 'all 0.12s', textDecoration: 'none',
              })}>{item.label}</NavLink>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--passenger-light)' }}>Passenger</div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>
            Sign Out
          </button>
        </div>
      </header>
      <main style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
