import { useEffect, useState } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

interface Booking {
  id: number; passenger_name: string; route_name: string;
  pickup_address: string; dropoff_address: string;
  status: string; fare: number; created_at: string;
}

const STATUSES = ['all', 'pending', 'confirmed', 'onboard', 'completed', 'cancelled'];
const STATUS_NEXT: Record<string, string> = {
  pending: 'confirmed', confirmed: 'onboard', onboard: 'completed',
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchBookings = () => {
    api.get('/bookings')
      .then(res => setBookings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
    const socket = getSocket();
    socket.on('new_booking', fetchBookings);
    socket.on('booking_status_changed', fetchBookings);
    return () => {
      socket.off('new_booking', fetchBookings);
      socket.off('booking_status_changed', fetchBookings);
    };
  }, []);

  const updateStatus = (id: number, status: string) => {
    api.patch(`/bookings/${id}/status`, { status }).then(fetchBookings).catch(() => {});
  };

  const visible = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">All Bookings</div>
          <div className="page-subtitle">
            {bookings.length} total · {bookings.filter(b => b.status === 'pending').length} awaiting action
          </div>
        </div>
        <button onClick={fetchBookings} className="btn btn-ghost" style={{ fontSize: 13 }}>↻ Refresh</button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUSES.map(s => {
          const count = s === 'all' ? bookings.length : bookings.filter(b => b.status === s).length;
          return (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: filter === s ? 'var(--admin-primary)' : 'var(--surface2)',
              color: filter === s ? '#fff' : 'var(--text2)',
              border: `1px solid ${filter === s ? 'var(--admin-primary)' : 'var(--border2)'}`,
              textTransform: 'capitalize', transition: 'all 0.12s',
            }}>
              {s}{count > 0 ? ` (${count})` : ''}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>Loading...</div>
      ) : visible.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 24px', color: 'var(--text2)' }}>
          No {filter === 'all' ? '' : filter} bookings found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map(b => (
            <div key={b.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{b.route_name || '—'}</span>
                  <span className={`badge ${b.status}`}>{b.status}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>#{b.id}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 3 }}>
                  👤 <strong>{b.passenger_name || 'Unknown'}</strong>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>📍 {b.pickup_address}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>🏁 {b.dropoff_address}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {new Date(b.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent2)' }}>₱{b.fare ?? 0}</div>
                {STATUS_NEXT[b.status] && (
                  <button onClick={() => updateStatus(b.id, STATUS_NEXT[b.status])} className="btn btn-primary"
                    style={{ fontSize: 12, padding: '6px 12px', background: 'var(--admin-primary)', borderColor: 'var(--admin-primary)', whiteSpace: 'nowrap' }}>
                    → {STATUS_NEXT[b.status]}
                  </button>
                )}
                <select value={b.status} onChange={e => updateStatus(b.id, e.target.value)}
                  style={{ fontSize: 12, padding: '5px 10px', borderRadius: 7, background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', cursor: 'pointer' }}>
                  {['pending', 'confirmed', 'onboard', 'completed', 'cancelled'].map(s => (
                    <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
