import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RoutesPage() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', origin: '', destination: '', fare: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchRoutes(); }, []);

  const fetchRoutes = async () => {
    try { const res = await api.get('/fleet/routes'); setRoutes(res.data); } catch {}
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/fleet/routes', { ...form, fare: Number(form.fare) });
      setMsg('✅ Route created!');
      setForm({ name: '', origin: '', destination: '', fare: '' });
      setShowForm(false); fetchRoutes();
    } catch (err: any) { setMsg('❌ ' + (err.response?.data?.error || 'Failed')); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>🗺️ Routes</h1>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} style={{ background: 'var(--accent)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
            {showForm ? 'Cancel' : '+ Add Route'}
          </button>
        )}
      </div>
      {msg && <div style={{ padding: '10px 16px', background: 'var(--surface2)', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{msg}</div>}
      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Add New Route</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[['name','ROUTE NAME','e.g. Route 4 - Pasig to BGC'],['origin','ORIGIN','Starting point'],['destination','DESTINATION','End point'],['fare','FARE (₱)','0.00']].map(([k,l,p]) => (
                <div key={k}>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>{l}</label>
                  <input type={k === 'fare' ? 'number' : 'text'} value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={p} required />
                </div>
              ))}
            </div>
            <button type="submit" style={{ marginTop: 16, background: 'var(--accent2)', color: '#0f1117', padding: '10px 24px', borderRadius: 8, fontWeight: 700 }}>Save Route</button>
          </form>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {routes.map((r: any) => (
          <div key={r.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</span>
              <span style={{ fontWeight: 700, color: 'var(--accent2)' }}>₱{r.fare}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text2)' }}>
              <span style={{ background: 'var(--surface2)', padding: '4px 10px', borderRadius: 6 }}>{r.origin}</span>
              <span>→</span>
              <span style={{ background: 'var(--surface2)', padding: '4px 10px', borderRadius: 6 }}>{r.destination}</span>
            </div>
          </div>
        ))}
      </div>
      {routes.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No routes yet.</div>}
    </div>
  );
}