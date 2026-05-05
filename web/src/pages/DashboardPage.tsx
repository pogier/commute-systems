import { useEffect, useState } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ vehicles: 0, routes: 0, bookings: 0, active: 0 });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    setConnected(socket.connected);
    fetchStats();
    socket.on('new_booking', fetchStats);
    return () => { socket.off('new_booking'); };
  }, []);

  const fetchStats = async () => {
    try {
      const [vRes, rRes, bRes] = await Promise.all([api.get('/fleet/vehicles'), api.get('/fleet/routes'), api.get('/bookings')]);
      setStats({ vehicles: vRes.data.length, routes: rRes.data.length, bookings: bRes.data.length, active: vRes.data.filter((v: any) => v.status === 'active').length });
      setRecentBookings(bRes.data.slice(0, 5));
    } catch {}
  };

  const statCards = [
    { label: 'Total Vehicles', value: stats.vehicles, icon: '🚌', color: 'var(--accent)' },
    { label: 'Active Now', value: stats.active, icon: '📍', color: 'var(--accent2)' },
    { label: 'Routes', value: stats.routes, icon: '🗺️', color: '#f5a623' },
    { label: 'Total Bookings', value: stats.bookings, icon: '🎫', color: '#c084fc' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Dashboard</h1>
          <p style={{ color: 'var(--text2)', marginTop: 4 }}>Welcome back, {user?.name} 👋</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 14px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--accent2)' : 'var(--danger)' }} />
          <span style={{ fontSize: 12, color: connected ? 'var(--accent2)' : 'var(--danger)', fontWeight: 600 }}>
            {connected ? 'Live Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map(card => (
          <div key={card.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Recent Bookings</h2>
        {recentBookings.length === 0 ? (
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>No bookings yet. Go to Bookings to create one.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['ID','Route','From → To','Status','Fare'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b: any) => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontSize: 13, color: 'var(--text2)' }}>#{b.id}</td>
                  <td style={{ padding: '12px', fontSize: 13 }}>{b.route_name || '—'}</td>
                  <td style={{ padding: '12px', fontSize: 12, color: 'var(--text2)' }}>{b.pickup_address} → {b.dropoff_address}</td>
                  <td style={{ padding: '12px' }}><span className={`badge ${b.status}`}>{b.status}</span></td>
                  <td style={{ padding: '12px', fontSize: 13 }}>₱{b.fare}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}