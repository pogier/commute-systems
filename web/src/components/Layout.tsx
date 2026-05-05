import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { getSocket } from '../services/socket';

const navItems = [
  { to: '/dashboard', label: '📊 Dashboard' },
  { to: '/bookings',  label: '🎫 Bookings' },
  { to: '/fleet',     label: '🚌 Live Fleet' },
  { to: '/routes',    label: '🗺️ Routes' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { getSocket(); }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, letterSpacing: 1 }}>🚀 RTCBFTMS</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Fleet Management</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'block', padding: '10px 12px', borderRadius: 8, marginBottom: 4,
              color: isActive ? 'var(--accent)' : 'var(--text2)',
              background: isActive ? 'rgba(79,142,247,0.12)' : 'transparent',
              fontSize: 14, fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s'
            })}>
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink to="/admin" style={({ isActive }) => ({
              display: 'block', padding: '10px 12px', borderRadius: 8, marginBottom: 4,
              color: isActive ? '#c084fc' : 'var(--text2)',
              background: isActive ? 'rgba(192,132,252,0.12)' : 'transparent',
              fontSize: 14, fontWeight: isActive ? 600 : 400,
            })}>
              ⚙️ Admin Panel
            </NavLink>
          )}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 12 }}>
            <span className={`badge ${user?.role}`}>{user?.role}</span>
          </div>
          <button onClick={handleLogout} style={{
            background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)',
            borderRadius: 6, padding: '6px 12px', fontSize: 12, width: '100%'
          }}>
            Sign Out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}