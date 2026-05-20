import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { getSocket } from '../services/socket';

const NAV = [
  { to: '/admin/dashboard', icon: '◈', label: 'Dashboard' },
  { to: '/admin/fleet',     icon: '◈', label: 'Fleet' },
  { to: '/admin/bookings',  icon: '◈', label: 'Bookings' },
  { to: '/admin/routes',    icon: '◈', label: 'Routes' },
  { to: '/admin/panel',     icon: '◈', label: 'Users' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { getSocket(); }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Brand */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              ⚙️
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Admin Console</div>
              <div style={{ fontSize: 10, color: 'var(--admin-light)', textTransform: 'uppercase', letterSpacing: 1 }}>Commute System</div>
            </div>
          </div>
          <div style={{ padding: '10px 12px', borderRadius: 9, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--admin-light)', marginTop: 1 }}>Administrator</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>Menu</div>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 8, marginBottom: 2,
              color: isActive ? 'var(--admin-light)' : 'var(--text2)',
              background: isActive ? 'var(--admin-bg)' : 'transparent',
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              borderLeft: `2px solid ${isActive ? 'var(--admin-primary)' : 'transparent'}`,
              transition: 'all 0.12s', textDecoration: 'none',
            })}>
              <span style={{ fontSize: 10 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
            Sign Out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '32px 36px', overflowY: 'auto', maxWidth: '100%', minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  );
}
