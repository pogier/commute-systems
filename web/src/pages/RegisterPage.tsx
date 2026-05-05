import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'passenger', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 40, width: 380 }}>
        <h2 style={{ marginBottom: 24, fontSize: 20, fontWeight: 700 }}>🚀 Create Account</h2>
        <form onSubmit={handleSubmit}>
          {[['name','FULL NAME','text','Juan dela Cruz'],['email','EMAIL','email','you@example.com'],['password','PASSWORD','password','••••••••'],['phone','PHONE (optional)','tel','09xxxxxxxxx']].map(([k,l,t,p]) => (
            <div key={k} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>{l}</label>
              <input type={t} value={(form as any)[k]} placeholder={p} onChange={e => setForm({ ...form, [k]: e.target.value })} />
            </div>
          ))}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>ROLE</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="passenger">Passenger</option>
              <option value="driver">Driver</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {error && <div style={{ background: '#3d2020', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: 'var(--accent2)', color: '#0f1117', borderRadius: 8, fontWeight: 700, fontSize: 15, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text2)' }}>
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}