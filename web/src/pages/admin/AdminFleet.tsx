import { useEffect, useState } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

interface Vehicle {
  id: number; plate_number: string; type: string;
  capacity: number; status: string; driver_name?: string;
  current_lat?: number; current_lng?: number;
}
interface DriverLoc { driver_id: number; lat: number; lng: number; }
type VehicleStatus = 'idle' | 'active' | 'maintenance';

const EMPTY_FORM = { plate_number: '', type: 'jeepney', capacity: '20' };
const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  active:      { bg: 'var(--driver-bg)',       color: 'var(--driver-light)', border: 'var(--driver-border)' },
  idle:        { bg: 'var(--surface2)',         color: 'var(--text2)',        border: 'var(--border2)' },
  maintenance: { bg: 'rgba(240,107,107,0.1)',   color: 'var(--danger)',       border: 'rgba(240,107,107,0.3)' },
};

export default function AdminFleet() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [liveLocations, setLiveLocations] = useState<Record<number, DriverLoc>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchVehicles = () => {
    api.get('/fleet/vehicles')
      .then(res => setVehicles(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVehicles();
    const socket = getSocket();
    socket.on('driver:location', (data: DriverLoc) => {
      setLiveLocations(prev => ({ ...prev, [data.driver_id]: data }));
    });
    socket.on('driver:offline', (data: { driver_id: number }) => {
      setLiveLocations(prev => { const n = { ...prev }; delete n[data.driver_id]; return n; });
    });
    return () => {
      socket.off('driver:location');
      socket.off('driver:offline');
    };
  }, []);

  const addVehicle = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await api.post('/fleet/vehicles', { ...form, capacity: Number(form.capacity) });
      setMsg({ text: 'Vehicle registered!', ok: true });
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchVehicles();
    } catch (err: any) {
      setMsg({ text: err.response?.data?.error ?? 'Failed to add vehicle.', ok: false });
    } finally { setSaving(false); }
  };

  const updateStatus = (id: number, status: VehicleStatus) => {
    api.patch(`/fleet/vehicles/${id}/status`, { status }).then(fetchVehicles).catch(() => {});
  };

  const deleteVehicle = (id: number, plate: string) => {
    if (!confirm(`Delete vehicle ${plate}? This cannot be undone.`)) return;
    api.delete(`/fleet/vehicles/${id}`).then(fetchVehicles).catch(() => {});
  };

  const onlineCount = Object.keys(liveLocations).length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text2)' }}>
      Loading fleet...
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Fleet Management</div>
          <div className="page-subtitle">{vehicles.length} vehicles · {onlineCount} driver{onlineCount !== 1 ? 's' : ''} online</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchVehicles} className="btn btn-ghost" style={{ fontSize: 13 }}>↻ Refresh</button>
          <button onClick={() => { setShowForm(s => !s); setMsg(null); }} className="btn btn-primary"
            style={{ fontSize: 13, background: 'var(--admin-primary)', borderColor: 'var(--admin-primary)' }}>
            {showForm ? '✕ Cancel' : '+ Add Vehicle'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 9, marginBottom: 16, fontSize: 13, fontWeight: 500,
          background: msg.ok ? 'var(--driver-bg)' : 'rgba(240,107,107,0.08)',
          border: `1px solid ${msg.ok ? 'var(--driver-border)' : 'rgba(240,107,107,0.3)'}`,
          color: msg.ok ? 'var(--driver-light)' : 'var(--danger)',
        }}>{msg.ok ? '✓ ' : '✗ '}{msg.text}</div>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'var(--admin-border)', background: 'var(--admin-bg)' }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 18, color: 'var(--admin-light)' }}>Register New Vehicle</div>
          <form onSubmit={addVehicle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Plate Number</label>
                <input value={form.plate_number} onChange={e => setForm(f => ({ ...f, plate_number: e.target.value }))} placeholder="ABC-1234" required />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Vehicle Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="jeepney">Jeepney</option>
                  <option value="bus">Bus</option>
                  <option value="van">Van</option>
                  <option value="tricycle">Tricycle</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Capacity (seats)</label>
                <input type="number" min="1" max="100" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} required />
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary"
              style={{ fontSize: 13, background: 'var(--admin-primary)', borderColor: 'var(--admin-primary)' }}>
              {saving ? 'Saving...' : 'Register Vehicle'}
            </button>
          </form>
        </div>
      )}

      {onlineCount > 0 && (
        <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 12, background: 'var(--driver-bg)', border: '1px solid var(--driver-border)' }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--driver-light)', marginBottom: 10 }}>🟢 Live GPS · {onlineCount} driver{onlineCount !== 1 ? 's' : ''} broadcasting</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.values(liveLocations).map(loc => (
              <div key={loc.driver_id} style={{ fontSize: 12, background: 'var(--surface)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--driver-border)' }}>
                Driver #{loc.driver_id} · {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
              </div>
            ))}
          </div>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 24px', color: 'var(--text2)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🚗</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No vehicles registered</div>
          <div style={{ fontSize: 13 }}>Click "Add Vehicle" to register one.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {vehicles.map(v => {
            const sc = STATUS_COLORS[v.status] ?? STATUS_COLORS.idle;
            return (
              <div key={v.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{v.plate_number}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2, textTransform: 'capitalize' }}>{v.type} · {v.capacity} seats</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, fontWeight: 600, textTransform: 'uppercase', background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                    {v.status}
                  </span>
                </div>

                {v.driver_name && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>👤 {v.driver_name}</div>}

                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>
                  {v.current_lat && v.current_lng
                    ? `📍 ${v.current_lat.toFixed(5)}, ${v.current_lng.toFixed(5)}`
                    : 'No GPS data'}
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {(['idle', 'active', 'maintenance'] as VehicleStatus[]).map(s => (
                    <button key={s} onClick={() => updateStatus(v.id, s)}
                      style={{ fontSize: 11, padding: '4px 9px', borderRadius: 5, cursor: 'pointer', fontWeight: 600,
                        background: v.status === s ? STATUS_COLORS[s].bg : 'var(--surface2)',
                        color: v.status === s ? STATUS_COLORS[s].color : 'var(--text3)',
                        border: `1px solid ${v.status === s ? STATUS_COLORS[s].border : 'var(--border2)'}`,
                        textTransform: 'capitalize', transition: 'all 0.12s',
                      }}>
                      {s}
                    </button>
                  ))}
                  <button onClick={() => deleteVehicle(v.id, v.plate_number)}
                    className="btn btn-danger" style={{ fontSize: 11, padding: '4px 9px', marginLeft: 'auto' }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
