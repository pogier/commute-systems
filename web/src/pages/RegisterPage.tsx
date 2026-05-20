import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roles = [
  { value: 'passenger', label: 'Passenger', icon: '🎫', desc: 'Book rides and track vehicles', color: 'var(--passenger-primary)', bg: 'var(--passenger-bg)', border: 'var(--passenger-border)' },
  { value: 'driver', label: 'Driver', icon: '🚌', desc: 'Go online and broadcast GPS', color: 'var(--driver-primary)', bg: 'var(--driver-bg)', border: 'var(--driver-border)' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'passenger' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '24px',
      backgroundImage: 'radial-gradient(ellipse at 80% 80%, rgba(16,185,129,0.04) 0%, transparent 60%)'
    }}>
      <div style={{ width: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 14, background: 'var(--surface)',
            border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 24, margin: '0 auto 14px'
          }}>🚀</div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Create Account</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Join the Commute System</p>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 18, padding: '30px 34px', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
          {/* Role selector */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>I am a...</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {roles.map(r => (
                <div key={r.value} onClick={() => setForm({ ...form, role: r.value })}
                  style={{
                    padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                    background: form.role === r.value ? r.bg : 'var(--surface2)',
                    border: `1px solid ${form.role === r.value ? r.border : 'var(--border2)'}`,
                    transition: 'all 0.15s'
                  }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{r.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: form.role === r.value ? r.color : 'var(--text)', marginBottom: 2 }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {[['name', 'Full Name', 'text', 'Your full name'], ['email', 'Email Address', 'email', 'you@example.com'], ['password', 'Password', 'password', '••••••••'], ['phone', 'Phone Number (optional)', 'tel', '+63 9XX XXX XXXX']].map(([k, l, t, p]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{l}</label>
                <input type={t} value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={p} required={k !== 'phone'} />
              </div>
            ))}

            {error && (
              <div style={{ background: 'rgba(240,107,107,0.08)', border: '1px solid rgba(240,107,107,0.2)', borderRadius: 9, padding: '11px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', marginTop: 8,
              background: loading ? 'var(--border2)' : 'var(--passenger-primary)',
              color: loading ? 'var(--text2)' : '#fff', borderRadius: 10, fontWeight: 700,
              fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s'
            }}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--text2)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
