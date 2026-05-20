import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

interface Route { id: number; name: string; origin: string; destination: string; fare: number; }

export default function PassengerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeId, setRouteId] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const selectedRoute = routes.find(r => String(r.id) === routeId) ?? null;

  useEffect(() => {
    api.get('/fleet/routes')
      .then(res => { setRoutes(res.data); setFetchError(''); })
      .catch(() => setFetchError('Could not load routes. Make sure the server is running.'));
  }, []);

  const selectRoute = (id: string) => {
    setRouteId(id);
    setMsg(null);
    const r = routes.find(r => String(r.id) === id);
    if (r) { setPickup(r.origin); setDropoff(r.destination); }
  };

  const handleBook = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!selectedRoute) { setMsg({ text: 'Please select a route first.', ok: false }); return; }
    if (!pickup.trim() || !dropoff.trim()) { setMsg({ text: 'Pickup and drop-off are required.', ok: false }); return; }

    setLoading(true); setMsg(null);
    try {
      const token = localStorage.getItem('token') ?? '';
      const resp = await fetch('http://localhost:4000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          route_id: selectedRoute.id,
          pickup_address: pickup.trim(),
          dropoff_address: dropoff.trim(),
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? 'Failed to create booking.');
      setMsg({ text: 'Booking created! Track it in My Bookings.', ok: true });
      setRouteId(''); setPickup(''); setDropoff('');
    } catch (err: any) {
      setMsg({ text: err.message ?? 'Failed to create booking.', ok: false });
    } finally { setLoading(false); }
  };

  return (
    <div className="fade-in">
      {/* Welcome */}
      <div style={{ padding: '20px 24px', borderRadius: 14, marginBottom: 22,
        background: 'var(--passenger-bg)', border: '1px solid var(--passenger-border)',
        display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 32 }}>👋</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Welcome back, {user?.name}!</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>Select a route below and book your commute.</div>
        </div>
      </div>

      {/* Status message */}
      {msg && (
        <div style={{ padding: '13px 16px', borderRadius: 10, marginBottom: 18, fontSize: 14, fontWeight: 500,
          background: msg.ok ? 'var(--passenger-bg)' : 'rgba(240,107,107,0.08)',
          border: `1px solid ${msg.ok ? 'var(--passenger-border)' : 'rgba(240,107,107,0.3)'}`,
          color: msg.ok ? 'var(--passenger-light)' : 'var(--danger)',
          display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>{msg.ok ? '✓' : '✗'}</span>
          <span>{msg.text}</span>
          {msg.ok && (
            <button onClick={() => navigate('/passenger/bookings')}
              style={{ marginLeft: 'auto', fontSize: 12, padding: '4px 12px', background: 'var(--passenger-primary)',
                color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              View Bookings →
            </button>
          )}
        </div>
      )}

      {fetchError && (
        <div style={{ padding: '13px 16px', borderRadius: 10, marginBottom: 18,
          background: 'rgba(240,107,107,0.08)', border: '1px solid rgba(240,107,107,0.3)',
          color: 'var(--danger)', fontSize: 13 }}>{fetchError}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Booking Form */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Book a Ride</div>
          <form onSubmit={handleBook}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Route</label>
              <select value={routeId} onChange={e => selectRoute(e.target.value)} required>
                <option value="">— Choose a route —</option>
                {routes.map(r => <option key={r.id} value={String(r.id)}>{r.name} · ₱{r.fare}</option>)}
              </select>
            </div>

            {selectedRoute && (
              <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16,
                background: 'var(--passenger-bg)', border: '1px solid var(--passenger-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedRoute.name}</span>
                  <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--passenger-light)' }}>₱{selectedRoute.fare}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)' }}>
                  <span style={{ background: 'var(--surface2)', padding: '3px 9px', borderRadius: 5 }}>{selectedRoute.origin}</span>
                  <span>→</span>
                  <span style={{ background: 'var(--surface2)', padding: '3px 9px', borderRadius: 5 }}>{selectedRoute.destination}</span>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                📍 Pickup Address
              </label>
              <input value={pickup} onChange={e => setPickup(e.target.value)} placeholder="Where will you be picked up?" required />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                🏁 Drop-off Address
              </label>
              <input value={dropoff} onChange={e => setDropoff(e.target.value)} placeholder="Where do you want to go?" required />
            </div>

            <button type="submit" disabled={loading || !selectedRoute} className="btn btn-primary"
              style={{ width: '100%', padding: '13px', fontSize: 15, fontWeight: 700,
                background: 'var(--passenger-primary)', borderColor: 'var(--passenger-primary)',
                opacity: !selectedRoute ? 0.5 : 1, justifyContent: 'center' }}>
              {loading ? 'Creating Booking...' : 'Book Now →'}
            </button>
          </form>
        </div>

        {/* Routes Sidebar */}
        <div className="card" style={{ padding: 0, alignSelf: 'start', maxHeight: 480, overflowY: 'auto' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13, position: 'sticky', top: 0, background: 'var(--surface)' }}>
            Available Routes ({routes.length})
          </div>
          {routes.length === 0 && !fetchError && (
            <div style={{ padding: '24px', color: 'var(--text3)', fontSize: 13, textAlign: 'center' }}>Loading routes...</div>
          )}
          {fetchError && (
            <div style={{ padding: '16px', color: 'var(--danger)', fontSize: 13 }}>{fetchError}</div>
          )}
          {routes.map(r => (
            <div key={r.id} onClick={() => selectRoute(String(r.id))} style={{
              padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
              background: routeId === String(r.id) ? 'var(--passenger-bg)' : 'transparent',
              borderLeft: routeId === String(r.id) ? '3px solid var(--passenger-primary)' : '3px solid transparent',
              transition: 'all 0.12s',
            }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{r.origin} → {r.destination}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--passenger-light)', marginTop: 5 }}>₱{r.fare}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
