import { useEffect, useState } from 'react';
import api from '../../services/api';

interface User {
  id: number; name: string; email: string; role: string;
  phone?: string; is_active: boolean; created_at: string;
}

const ROLE_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  admin:     { color: 'var(--admin-light)',     bg: 'var(--admin-bg)',     border: 'var(--admin-border)' },
  driver:    { color: 'var(--driver-light)',    bg: 'var(--driver-bg)',    border: 'var(--driver-border)' },
  passenger: { color: 'var(--passenger-light)', bg: 'var(--passenger-bg)', border: 'var(--passenger-border)' },
};

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(err => {
        setError(err.response?.data?.error ?? 'Failed to load users.');
      })
      .finally(() => setLoading(false));
  }, []);

  const changeRole = (id: number, role: string) => {
    api.patch(`/admin/users/${id}/role`, { role })
      .then(() => setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u)))
      .catch(() => {});
  };

  const toggleActive = (id: number, is_active: boolean) => {
    api.patch(`/admin/users/${id}/active`, { is_active: !is_active })
      .then(() => setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !is_active } : u)))
      .catch(() => {});
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    total:     users.length,
    admins:    users.filter(u => u.role === 'admin').length,
    drivers:   users.filter(u => u.role === 'driver').length,
    passengers:users.filter(u => u.role === 'passenger').length,
    inactive:  users.filter(u => !u.is_active).length,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text2)' }}>
      Loading users...
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="page-title">User Management</div>
          <div className="page-subtitle">
            {counts.total} users · {counts.admins} admins · {counts.drivers} drivers · {counts.passengers} passengers
          </div>
        </div>
      </div>

      {error ? (
        <div style={{ padding: '16px 20px', borderRadius: 10, background: 'rgba(240,107,107,0.08)', border: '1px solid rgba(240,107,107,0.2)', color: 'var(--danger)', fontSize: 13 }}>
          {error}
        </div>
      ) : (
        <>
          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Admins',     value: counts.admins,     ...ROLE_COLORS.admin },
              { label: 'Drivers',    value: counts.drivers,    ...ROLE_COLORS.driver },
              { label: 'Passengers', value: counts.passengers, ...ROLE_COLORS.passenger },
              { label: 'Inactive',   value: counts.inactive,   color: 'var(--danger)', bg: 'rgba(240,107,107,0.08)', border: 'rgba(240,107,107,0.2)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '14px 16px', background: s.bg, border: `1px solid ${s.border}` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ marginBottom: 16 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              style={{ maxWidth: 360 }}
            />
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>No users match your search.</div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text2)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const rc = ROLE_COLORS[u.role] ?? ROLE_COLORS.passenger;
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: u.is_active ? 1 : 0.5 }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>{u.email}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>{u.phone || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                            style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: rc.bg, border: `1px solid ${rc.border}`, color: rc.color, cursor: 'pointer', fontWeight: 600 }}>
                            <option value="passenger">Passenger</option>
                            <option value="driver">Driver</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600,
                            background: u.is_active ? 'var(--driver-bg)' : 'var(--surface2)',
                            color: u.is_active ? 'var(--driver-light)' : 'var(--text3)',
                            border: `1px solid ${u.is_active ? 'var(--driver-border)' : 'var(--border2)'}`,
                          }}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text3)', fontSize: 11 }}>
                          {new Date(u.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => toggleActive(u.id, u.is_active)}
                            className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
