import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

interface Booking {
  id: number; route_name: string; pickup_address: string; dropoff_address: string;
  status: string; fare: number; created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', confirmed: 'Confirmed', onboard: 'On Board',
  completed: 'Completed', cancelled: 'Cancelled',
};

const STATUS_DESC: Record<string, string> = {
  pending:   '⏳ Waiting for a driver to accept...',
  confirmed: '✅ Driver accepted — on the way to pick you up!',
  onboard:   '🚌 You are onboard — heading to your destination!',
  completed: '🎉 Ride completed. Thank you for riding!',
  cancelled: '❌ Booking was cancelled.',
};

const STATUS_COLOR: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#4a8ff5', onboard: '#10b981',
  completed: '#34d399', cancelled: '#f06b6b',
};

const STATUS_STEPS: Record<string, number> = {
  pending: 1, confirmed: 2, onboard: 3, completed: 4, cancelled: 0,
};

const BADGE_CLASS: Record<string, string> = {
  pending: 'pending', confirmed: 'confirmed', onboard: 'onboard',
  completed: 'completed', cancelled: 'cancelled',
};

export default function PassengerBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const fetchBookings = () => {
    api.get('/bookings')
      .then(res => setBookings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
    const socket = getSocket();

    socket.on('booking_status_changed', (data: any) => {
      const msgs: Record<string, string> = {
        confirmed: '✅ Driver accepted your booking!',
        onboard:   '🚌 Driver picked you up! You are onboard.',
        completed: '🎉 Ride completed!',
      };
      if (msgs[data.status]) showToast(msgs[data.status]);
      fetchBookings();
    });

    socket.on('new_booking', fetchBookings);

    return () => {
      socket.off('booking_status_changed');
      socket.off('new_booking', fetchBookings);
    };
  }, []);

  const cancelBooking = (id: number) => {
    if (!confirm('Cancel this booking?')) return;
    api.delete(`/bookings/${id}`).finally(fetchBookings);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const active = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled');
  const past   = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  if (loading) return (
    <div style={{ color: 'var(--text2)', padding: 40, textAlign: 'center' }}>Loading bookings...</div>
  );

  const BookingCard = ({ b }: { b: Booking }) => {
    const steps = STATUS_STEPS[b.status] || 0;
    const color = STATUS_COLOR[b.status] || '#f59e0b';
    const isLive = b.status !== 'completed' && b.status !== 'cancelled';

    return (
      <div className="card" style={{
        opacity: isLive ? 1 : 0.7,
        borderLeft: `3px solid ${color}`,
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>
              {b.route_name || 'Unknown Route'}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text3)' }}>
              #bk-{String(b.id).padStart(3, '0')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`badge ${BADGE_CLASS[b.status]}`}>
              {STATUS_LABEL[b.status] ?? b.status}
            </span>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--passenger-light)', marginTop: 5 }}>
              ₱{b.fare ?? 0}
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>📍 {b.pickup_address}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>🏁 {b.dropoff_address}</div>

        <div style={{
          fontSize: 12, fontWeight: 600, color,
          padding: '7px 10px', borderRadius: 7, marginBottom: 10,
          background: `${color}18`, border: `1px solid ${color}30`,
        }}>
          {STATUS_DESC[b.status]}
        </div>

        <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= steps ? 'var(--passenger-primary, #10b981)' : 'var(--border)',
            }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: b.status === 'pending' ? 10 : 0 }}>
          {['Pending', 'Confirmed', 'On Board', 'Done'].map(label => (
            <span key={label} style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.4px' }}>
              {label}
            </span>
          ))}
        </div>

        {b.status === 'pending' && (
          <button onClick={() => cancelBooking(b.id)} className="btn btn-danger"
            style={{ fontSize: 12, padding: '5px 12px' }}>
            Cancel Booking
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fade-in">
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#10b981', color: '#fff', padding: '10px 18px',
          borderRadius: 10, fontWeight: 700, fontSize: 13,
          boxShadow: '0 4px 20px rgba(0,0,0,.3)', maxWidth: 260, lineHeight: 1.4,
        }}>
          {toast}
        </div>
      )}

      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <div className="page-title">My Bookings</div>
          <div className="page-subtitle">
            {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
            {active.length > 0 && ` · ${active.length} active`}
            {' · Updates live when driver acts'}
          </div>
        </div>
        <button onClick={() => navigate('/passenger/dashboard')} className="btn btn-primary"
          style={{ fontSize: 13, background: 'var(--passenger-primary)', borderColor: 'var(--passenger-primary)' }}>
          + New Booking
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎫</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>No bookings yet</div>
          <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Book your first ride to get started.</div>
          <button onClick={() => navigate('/passenger/dashboard')} className="btn btn-primary"
            style={{ background: 'var(--passenger-primary)', borderColor: 'var(--passenger-primary)' }}>
            Book a Ride →
          </button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 11 }}>
                Active ({active.length})
              </div>
              {active.map(b => <BookingCard key={b.id} b={b} />)}
            </>
          )}
          {past.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 11, marginTop: 8 }}>
                Past ({past.length})
              </div>
              {past.map(b => <BookingCard key={b.id} b={b} />)}
            </>
          )}
        </>
      )}
    </div>
  );
}