import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps { onGoToRegister: () => void; }

export const LoginPage = ({ onGoToRegister }: LoginPageProps) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await login(email, password); }
    catch (err: any) { setError(err.message || 'An error occurred'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--bg-base)',
    }}>
      {/* Left panel — decorative */}
      <div style={{
        width: '45%',
        background: 'linear-gradient(160deg, var(--primary-light) 0%, rgba(255,255,255,0.8) 100%)',
        padding: '4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderRight: '1px solid var(--border)',
        backdropFilter: 'blur(10px)',
      }}>
        {/* Decorative circles */}
        <div style={{ position:'absolute', top:'-80px', left:'-80px', width:'320px', height:'320px', borderRadius:'50%', background:'radial-gradient(circle, var(--primary-glow), transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-60px', right:'-60px', width:'280px', height:'280px', borderRadius:'50%', background:'radial-gradient(circle, var(--accent-glow), transparent 70%)', pointerEvents:'none' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Book icon */}
          <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', animation: 'float 4s ease-in-out infinite' }}>📚</div>

          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
            <span className="gradient-text">Library</span>
            <br />Management<br />System
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: '380px', marginBottom: '3rem' }}>
            A complete microservices platform for managing your library's book inventory, member borrowing, and return workflows.
          </p>

          {/* Mini feature highlights */}
          {[
            { icon: '📖', text: 'Manage borrow & return records' },
            { icon: '👥', text: 'Role-based access control' },
            { icon: '⚡', text: 'Real-time overdue tracking' },
          ].map(f => (
            <div key={f.text} style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
              <span style={{ fontSize:'1.2rem' }}>{f.icon}</span>
              <span style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 3rem',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome back!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Sign in to your library account</p>
          </div>

          {error && (
            <div style={{ padding: '0.875rem 1rem', background: 'var(--status-overdue-bg)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--status-overdue)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="form-group">
                <label>📧 Email Address</label>
                <input className="form-control" type="email" required autoComplete="off" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@library.com" />
              </div>
              <div className="form-group">
                <label>🔒 Password</label>
                <input className="form-control" type="password" required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '0.5rem' }}>
                {loading ? '⏳ Signing in...' : '🚀 Sign In'}
              </button>
            </form>

            {/* Quick Demo Buttons */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem', fontWeight: 600 }}>FAST QA DEMO LOGINS</p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '10px', fontSize: '0.85rem', borderColor: '#A78BFA', color: '#A78BFA', background: 'rgba(167,139,250,0.05)' }} onClick={() => { setEmail('admin@test.com'); setPassword('admin123'); }}>
                  Fill Admin
                </button>
                <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '10px', fontSize: '0.85rem', borderColor: 'var(--status-returned)', color: 'var(--status-returned)', background: 'var(--status-returned-bg)' }} onClick={() => { setEmail('member2@test.com'); setPassword('member123'); }}>
                  Fill Member
                </button>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            New to the system?{' '}
            <span onClick={onGoToRegister} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>
              Create an account →
            </span>
          </p>

          {/* Role hint */}
          <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
              <span>🔑</span> Available Roles
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[['ADMIN','#A78BFA','Full Access'],['LIBRARIAN','var(--status-active)','Manage Borrows'],['MEMBER','var(--status-returned)','View Own']].map(([role, color, desc]) => (
                <div key={role} style={{ padding: '4px 10px', borderRadius: '100px', background: `${color}15`, border: `1px solid ${color}30`, color: color as string, fontSize: '0.7rem', fontWeight: 700 }}>
                  {role} — {desc}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
