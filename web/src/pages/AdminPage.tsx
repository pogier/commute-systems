import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdminPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vForm, setVForm] = useState({ plate_number: '', type: 'jeepney', capacity: '20', driver_id: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [vRes, dRes] = await Promise.all([api.get('/fleet/vehicles'), api.get('/fleet/drivers')]);
      setVehicles(vRes.data);
      setDrivers(dRes.data);
    } catch {}
  };

  const addVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/fleet/vehicles', { ...vForm, capacity: Number(vForm.capacity), driver_id: vForm.driver_id || undefined });
      setMsg('✅ Vehicle added!');
      setVForm({ plate_number: '', type: 'jeepney', capacity: '20', driver_id: '' });
      fetchAll();
    } catch (err: any) { setMsg('❌ ' + (err.response?.data?.error || 'Failed')); }
  };

  const updateVehicleStatus = async (id: number, status: string) => {
    try { await api.patch(`/fleet/vehicles/${id}/status`, { status }); fetchAll(); } catch {}
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>⚙️ Admin Panel</h1>
      {msg && <div style={{ padding: '10px 16px', background: 'var(--surface2)', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{msg}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Add Vehicle</h2>
          <form onSubmit={addVehicle}>
            {[['plate_number', 'PLATE NUMBER', 'ABC-1234'], ['capacity', 'CAPACITY', '20']].map(([k, l, p]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>{l}</label>
                <input value={(vForm as any)[k]} onChange={e => setVForm({ ...vForm, [k]: e.target.value })} placeholder={p} required />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>TYPE</label>
              <select value={vForm.type} onChange={e => setVForm({ ...vForm, type: e.target.value })}>
                <option value="jeepney">Jeepney</option>
                <option value="bus">Bus</option>
                <option value="van">Van</option>
                <option value="tricycle">Tricycle</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>ASSIGN DRIVER</label>
              <select value={vForm.driver_id} onChange={e => setVForm({ ...vForm, driver_id: e.target.value })}>
                <option value="">Unassigned</option>
                {drivers.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <button type="submit" style={{ background: 'var(--accent)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 600 }}>
              Add Vehicle
            </button>
          </form>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>All Vehicles ({vehicles.length})</h2>
          <div style={{ overflowY: 'auto', maxHeight: 400 }}>
            {vehicles.map((v: any) => (
              <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{v.plate_number}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{v.type} · {v.driver_name || 'No driver'}</div>
                </div>
                <select value={v.status} onChange={e => updateVehicleStatus(v.id, e.target.value)}
                  style={{ width: 'auto', fontSize: 12, padding: '4px 8px' }}>
                  <option value="idle">Idle</option>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}