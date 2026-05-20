import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      // Role-based redirect handled by RoleRouter in App.tsx
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(79,142,247,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.04) 0%, transparent 60%)'
    }}>
      <div style={{ width: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>🚌</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>Commute System</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6 }}>Real-Time Booking & Fleet Tracking</p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 18, padding: '32px 36px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)'
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, color: 'var(--text)' }}>Sign in to your account</div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            {error && (
              <div style={{
                background: 'rgba(240,107,107,0.08)', border: '1px solid rgba(240,107,107,0.2)',
                borderRadius: 9, padding: '11px 14px', color: 'var(--danger)', fontSize: 13, marginBottom: 18
              }}>{error}</div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '13px', background: loading ? 'var(--border2)' : 'var(--accent)',
              color: loading ? 'var(--text2)' : '#fff', borderRadius: 10, fontWeight: 700,
              fontSize: 15, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s'
            }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* Role hint */}
          <div style={{ marginTop: 20, padding: '12px 16px', borderRadius: 9, background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>You'll be redirected to:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge admin">⚙️ Admin Console</span>
              <span className="badge driver">🚌 Driver Mode</span>
              <span className="badge passenger">🎫 Passenger Portal</span>
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text2)' }}>
          No account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Register here</Link>
        </p>
      </div>
    </div>
  );
}
