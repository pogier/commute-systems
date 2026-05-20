import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

interface Booking {
  id: number; passenger_name: string; route_name: string;
  pickup_address: string; dropoff_address: string;
  status: string; fare: number; created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    Promise.all([
      api.get('/bookings'),
      api.get('/fleet/vehicles'),
      api.get('/admin/users'),
    ])
      .then(([b, v, u]) => { setBookings(b.data); setVehicles(v.data); setUsers(u.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
    const socket = getSocket();
    socket.on('new_booking', fetchAll);
    socket.on('booking_status_changed', fetchAll);
    return () => {
      socket.off('new_booking', fetchAll);
      socket.off('booking_status_changed', fetchAll);
    };
  }, []);

  const counts = {
    total:     bookings.length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    active:    bookings.filter(b => ['confirmed', 'onboard'].includes(b.status)).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    revenue:   bookings.filter(b => b.status === 'completed').reduce((s, b) => s + Number(b.fare ?? 0), 0),
  };

  const stats = [
    { label: 'Total Bookings', value: counts.total,              sub: `${counts.pending} pending`,  color: 'var(--accent)',          icon: '📋', path: '/admin/bookings' },
    { label: 'Active Trips',   value: counts.active,             sub: `${counts.completed} done`,   color: 'var(--driver-primary)',   icon: '🚌', path: '/admin/bookings' },
    { label: 'Fleet Size',     value: vehicles.length,           sub: 'registered vehicles',        color: 'var(--admin-primary)',    icon: '🚗', path: '/admin/fleet' },
    { label: 'Total Users',    value: users.length,              sub: `${users.filter(u => u.role === 'driver').length} drivers`,  color: 'var(--admin-light)', icon: '👥', path: '/admin/panel' },
    { label: 'Revenue (₱)',    value: counts.revenue.toFixed(2), sub: 'from completed trips',       color: 'var(--accent2)',          icon: '💰', path: '/admin/bookings' },
    { label: 'Cancelled',      value: counts.cancelled,          sub: 'bookings cancelled',         color: 'var(--danger)',           icon: '✕', path: '/admin/bookings' },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text2)', gap: 10 }}>
      <div className="spin" />Loading dashboard...
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Real-time overview · {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        <button onClick={fetchAll} className="btn btn-ghost" style={{ fontSize: 13 }}>↻ Refresh</button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {stats.map(s => (
          <div key={s.label} className="card stat-card" onClick={() => navigate(s.path)}
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 22px', cursor: 'pointer' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 3 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent bookings */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Recent Bookings</span>
          <button onClick={() => navigate('/admin/bookings')} className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}>View All →</button>
        </div>
        {bookings.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>No bookings yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Passenger', 'Route', 'Addresses', 'Status', 'Fare', 'Time'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 15).map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 600 }}>{b.passenger_name || '—'}</td>
                    <td style={{ padding: '11px 16px', color: 'var(--text2)' }}>{b.route_name || '—'}</td>
                    <td style={{ padding: '11px 16px', color: 'var(--text2)', maxWidth: 220 }}>
                      <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📍 {b.pickup_address} → 🏁 {b.dropoff_address}
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px' }}><span className={`badge ${b.status}`}>{b.status}</span></td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: 'var(--accent2)' }}>₱{b.fare ?? 0}</td>
                    <td style={{ padding: '11px 16px', color: 'var(--text3)', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {new Date(b.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
