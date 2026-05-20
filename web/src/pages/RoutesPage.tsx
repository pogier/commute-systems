import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Route { id: number; name: string; origin: string; destination: string; fare: number; }
interface Form { name: string; origin: string; destination: string; fare: string; }

const EMPTY_FORM: Form = { name: '', origin: '', destination: '', fare: '' };

export default function RoutesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [routes, setRoutes] = useState<Route[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchRoutes = () => {
    api.get('/fleet/routes').then(res => setRoutes(res.data)).catch(() => {});
  };

  useEffect(() => { fetchRoutes(); }, []);

  const handleCreate = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await api.post('/fleet/routes', { ...form, fare: Number(form.fare) });
      setMsg({ text: 'Route created!', ok: true });
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchRoutes();
    } catch (err: any) {
      setMsg({ text: err.response?.data?.error ?? 'Failed to create route.', ok: false });
    } finally { setSaving(false); }
  };

  const deleteRoute = (id: number, name: string) => {
    if (!confirm(`Remove route "${name}"?`)) return;
    api.delete(`/fleet/routes/${id}`).then(fetchRoutes).catch(() => {});
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">Routes</div>
          <div className="page-subtitle">{routes.length} active route{routes.length !== 1 ? 's' : ''}</div>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowForm(s => !s); setMsg(null); }} className="btn btn-primary"
            style={{ fontSize: 13, background: 'var(--admin-primary)', borderColor: 'var(--admin-primary)' }}>
            {showForm ? '✕ Cancel' : '+ Add Route'}
          </button>
        )}
      </div>

      {msg && (
        <div style={{ padding: '12px 16px', borderRadius: 9, marginBottom: 16, fontSize: 13,
          background: msg.ok ? 'var(--driver-bg)' : 'rgba(240,107,107,0.08)',
          border: `1px solid ${msg.ok ? 'var(--driver-border)' : 'rgba(240,107,107,0.3)'}`,
          color: msg.ok ? 'var(--driver-light)' : 'var(--danger)',
        }}>{msg.ok ? '✓ ' : '✗ '}{msg.text}</div>
      )}

      {showForm && isAdmin && (
        <div className="card" style={{ marginBottom: 24, borderColor: 'var(--admin-border)', background: 'var(--admin-bg)' }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 18, color: 'var(--admin-light)' }}>New Route</div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {([['name', 'Route Name', 'text', 'e.g. Route 1 - Cubao to Makati'],
                 ['fare', 'Fare (₱)', 'number', '0.00'],
                 ['origin', 'Origin', 'text', 'Starting point'],
                 ['destination', 'Destination', 'text', 'End point']] as [keyof Form, string, string, string][]).map(([k, l, t, p]) => (
                <div key={k}>
                  <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 7, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{l}</label>
                  <input type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={p} required />
                </div>
              ))}
            </div>
            <button type="submit" disabled={saving} className="btn btn-primary"
              style={{ fontSize: 13, background: 'var(--admin-primary)', borderColor: 'var(--admin-primary)' }}>
              {saving ? 'Saving...' : 'Save Route'}
            </button>
          </form>
        </div>
      )}

      {routes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px 24px', color: 'var(--text2)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🗺️</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No routes available</div>
          {isAdmin && <div style={{ fontSize: 13 }}>Click "Add Route" to create one.</div>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {routes.map(r => (
            <div key={r.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</span>
                <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--accent2)', flexShrink: 0, marginLeft: 8 }}>₱{r.fare}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)', marginBottom: isAdmin ? 14 : 0 }}>
                <span style={{ background: 'var(--surface2)', padding: '3px 10px', borderRadius: 6 }}>{r.origin}</span>
                <span>→</span>
                <span style={{ background: 'var(--surface2)', padding: '3px 10px', borderRadius: 6 }}>{r.destination}</span>
              </div>
              {isAdmin && (
                <button onClick={() => deleteRoute(r.id, r.name)} className="btn btn-danger"
                  style={{ fontSize: 12, padding: '5px 12px', width: '100%', justifyContent: 'center' }}>
                  Remove Route
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
