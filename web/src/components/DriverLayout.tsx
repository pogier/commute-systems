import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { getSocket } from '../services/socket';

export default function DriverLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { getSocket(); }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header style={{
        background: 'var(--surface)', borderBottom: '1px solid var(--driver-border)',
        padding: '0 32px', height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--driver-bg)', border: '1px solid var(--driver-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
            🚌
          </div>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--driver-light)' }}>Driver Mode</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8 }}>Commute System</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--driver-light)' }}>Driver</div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>
            Sign Out
          </button>
        </div>
      </header>
      <main style={{ padding: '28px 32px' }}>
        <Outlet />
      </main>
    </div>
  );
}
