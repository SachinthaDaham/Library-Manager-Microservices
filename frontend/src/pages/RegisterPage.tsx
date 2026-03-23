import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface RegisterPageProps { onGoToLogin: () => void; }

const isPasswordStrong = (pw: string) => {
  return pw.length >= 8 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);
};

const getPasswordErrors = (pw: string) => {
  const errs = [];
  if (pw.length < 8) errs.push('8+ characters');
  if (!/[A-Z]/.test(pw)) errs.push('uppercase letter');
  if (!/[a-z]/.test(pw)) errs.push('lowercase letter');
  if (!/[0-9]/.test(pw)) errs.push('number');
  if (!/[^A-Za-z0-9]/.test(pw)) errs.push('special character');
  return errs;
};


export const RegisterPage = ({ onGoToLogin }: RegisterPageProps) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!isPasswordStrong(password)) {
      setError('Please choose a stronger password matching the security rules.');
      return;
    }
    setLoading(true); setError('');
    try { 
      await register(name, email, password, role); 
      // Auto-login succeeds, component will unmount
    }
    catch (err: any) { 
      setError(err.message || 'Registration failed'); 
      setLoading(false); 
    }
  };

  const roleInfo: Record<string, { icon: string; desc: string; color: string }> = {
    ADMIN: { icon: '👑', desc: 'Full system control — manage all borrows, users, and stats', color: '#A78BFA' },
    LIBRARIAN: { icon: '📋', desc: 'Manage borrow and return transactions for members', color: 'var(--status-active)' },
    MEMBER: { icon: '🎒', desc: 'View your own borrow history and current loans', color: 'var(--status-returned)' },
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 30% 0%, rgba(109,40,217,0.15),transparent), radial-gradient(ellipse 60% 40% at 85% 90%, rgba(245,158,11,0.1),transparent)',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', animation: 'float 4s ease-in-out infinite' }}>📚</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            Join <span className="gradient-text">Library Sys</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Create your library staff account</p>
        </div>

        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          {error && (
            <div style={{ padding: '0.875rem 1rem', background: 'var(--status-overdue-bg)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 'var(--radius-sm)', color: 'var(--status-overdue)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>👤 Full Name</label>
              <input className="form-control" required autoComplete="off" value={name} onChange={e => setName(e.target.value)} placeholder="Sachintha Daham" />
            </div>
            <div className="form-group">
              <label>📧 Email Address</label>
              <input className="form-control" type="email" required autoComplete="off" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@library.com" />
            </div>
            <div className="form-group">
              <label>🔒 Password</label>
              <input className="form-control" type="password" required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Strong password required" />
              {password && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: isPasswordStrong(password) ? 'var(--status-returned)' : 'var(--status-overdue)' }}>
                  {isPasswordStrong(password)
                    ? '✅ Strong password ready'
                    : `⚠️ Missing: ${getPasswordErrors(password).join(', ')}`}
                </div>
              )}
            </div>

            {/* Role selector */}
            <div className="form-group">
              <label>🎭 Role</label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                {(['ADMIN', 'LIBRARIAN', 'MEMBER'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    style={{
                      flex: 1,
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${role === r ? roleInfo[r].color : 'var(--border)'}`,
                      background: role === r ? `${roleInfo[r].color}12` : 'transparent',
                      color: role === r ? roleInfo[r].color : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: '1.3rem', marginBottom: '3px' }}>{roleInfo[r].icon}</div>
                    {r}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {roleInfo[role].desc}
              </p>
            </div>

            <button type="submit" className="btn btn-gold" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '0.5rem' }}>
              {loading ? '⏳ Creating account...' : '✨ Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <span onClick={onGoToLogin} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
            Sign in →
          </span>
        </p>
      </div>
    </div>
  );
};
