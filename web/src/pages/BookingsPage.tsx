import { useEffect, useState } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [routeId, setRouteId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');

  useEffect(() => {
    fetchAll();
    const socket = getSocket();
    socket.on('new_booking', fetchAll);
    socket.on('booking_status_changed', fetchAll);
    return () => { socket.off('new_booking'); socket.off('booking_status_changed'); };
  }, []);

  const fetchAll = async () => {
    try {
      const [bRes, rRes, vRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/fleet/routes'),
        api.get('/fleet/vehicles'),
      ]);
      setBookings(bRes.data);
      setRoutes(rRes.data);
      setVehicles(vRes.data);
    } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    console.log('route_id:', routeId);
    console.log('pickup:', pickupAddress);
    console.log('dropoff:', dropoffAddress);

    try {
      const payload: any = {
        route_id: parseInt(routeId),
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
      };
      if (vehicleId) payload.vehicle_id = parseInt(vehicleId);

      const res = await api.post('/bookings', payload);
      console.log('Booking response:', res.data);
      setMsg('✅ Booking created successfully!');
      setRouteId('');
      setVehicleId('');
      setPickupAddress('');
      setDropoffAddress('');
      setShowForm(false);
      fetchAll();
    } catch (err: any) {
      console.error('Booking error:', err.response?.data);
      setMsg('❌ ' + (err.response?.data?.error || 'Failed to create booking'));
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try { await api.patch(`/bookings/${id}/status`, { status }); fetchAll(); } catch {}
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>🎫 Bookings</h1>
        <button onClick={() => setShowForm(!showForm)} style={{ background: 'var(--accent)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
          {showForm ? 'Cancel' : '+ New Booking'}
        </button>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', background: msg.startsWith('✅') ? '#1f3525' : '#3d2020', border: `1px solid ${msg.startsWith('✅') ? '#6fcf97' : 'var(--danger)'}`, borderRadius: 8, marginBottom: 16, fontSize: 14, color: msg.startsWith('✅') ? '#6fcf97' : 'var(--danger)' }}>
          {msg}
        </div>
      )}

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: 16 }}>Create New Booking</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>ROUTE *</label>
                <select
                  value={routeId}
                  onChange={e => {
                    console.log('Selected route_id:', e.target.value);
                    setRouteId(e.target.value);
                  }}
                  required
                >
                  <option value="">Select a route...</option>
                  {routes.map((r: any) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.name} — ₱{r.fare}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>VEHICLE (optional)</label>
                <select value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
                  <option value="">Any available vehicle</option>
                  {vehicles.map((v: any) => (
                    <option key={v.id} value={String(v.id)}>
                      {v.plate_number} ({v.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>PICKUP ADDRESS *</label>
                <input
                  value={pickupAddress}
                  onChange={e => setPickupAddress(e.target.value)}
                  placeholder="e.g. Cubao Terminal"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>DROP-OFF ADDRESS *</label>
                <input
                  value={dropoffAddress}
                  onChange={e => setDropoffAddress(e.target.value)}
                  placeholder="e.g. Makati CBD"
                  required
                />
              </div>

            </div>
            <div style={{ marginTop: 16 }}>
              <button
                type="submit"
                disabled={loading}
                style={{ background: 'var(--accent2)', color: '#0f1117', padding: '10px 24px', borderRadius: 8, fontWeight: 700, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {bookings.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>No bookings yet. Create one above.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['#', 'Route', 'Pickup → Drop-off', 'Status', 'Fare', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((b: any) => (
                <tr key={b.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text2)' }}>#{b.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{b.route_name || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)' }}>{b.pickup_address} → {b.dropoff_address}</td>
                  <td style={{ padding: '12px 16px' }}><span className={`badge ${b.status}`}>{b.status}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>₱{b.fare}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <select
                      defaultValue=""
                      onChange={e => e.target.value && updateStatus(b.id, e.target.value)}
                      style={{ fontSize: 12, padding: '4px 8px', width: 'auto' }}
                    >
                      <option value="">Update...</option>
                      {['confirmed', 'onboard', 'completed', 'cancelled'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}