import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Dashboard } from './components/Dashboard';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BooksList } from './components/BooksList';
import { FinesList } from './components/FinesList';
import { ReservationsList } from './components/ReservationsList';
import { NotificationsList } from './components/NotificationsList';
import { AdminUsers } from './components/AdminUsers';

const RoleColors: Record<string, string> = {
  ADMIN: '#A78BFA',
  LIBRARIAN: 'var(--status-active)',
  MEMBER: 'var(--status-returned)',
};
const RoleIcons: Record<string, string> = {
  ADMIN: '👑', LIBRARIAN: '📋', MEMBER: '🎒',
};

function AppContent() {
  const { user, logout, isLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [activeTab, setActiveTab] = useState('Books');
  const [forceAuthPage, setForceAuthPage] = useState(!localStorage.getItem('library_token'));

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', gap: '1rem' }}>
        <div style={{ fontSize: '3rem', animation: 'float 2s ease-in-out infinite' }}>📚</div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading Library System...</p>
      </div>
    );
  }

  if (!user && forceAuthPage) {
    return showRegister
      ? <RegisterPage onGoToLogin={() => setShowRegister(false)} />
      : <LoginPage onGoToRegister={() => setShowRegister(true)} />;
  }

  const navItems = user ? [
    { id: 'Dashboard', icon: '📊', label: 'Borrow Records' },
    { id: 'Books', icon: '📖', label: 'Library Catalog' },
    { id: 'Fines', icon: '💰', label: 'System Fines' },
    { id: 'Reservations', icon: '🕒', label: 'Hold Queue' },
    ...(user.role === 'ADMIN' ? [
      { id: 'Users', icon: '👥', label: 'User Management' },
    ] : []),
    ...(user.role === 'ADMIN' || user.role === 'LIBRARIAN' ? [
      { id: 'Notifications', icon: '🔔', label: 'Event Logs' }
    ] : []),
  ] : [
    { id: 'Books', icon: '📖', label: 'Library Catalog' },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        {/* Brand */}
        <div className="brand">
          <span className="brand-icon">📚</span>
          Library OS
        </div>

        {/* Nav */}
        <nav className="nav-menu">
          {navItems.map(item => (
            <a 
              key={item.id} 
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '1.5rem 0' }} />

        {/* System info */}
        <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.08em' }}>🔗 SERVICES ONLINE</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Auth :3007 · Borrow :3003</p>
        </div>

        {user ? (
          <>
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                </div>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '3px 10px', borderRadius: '100px', background: `${RoleColors[user.role]}15`, border: `1px solid ${RoleColors[user.role]}30`, color: RoleColors[user.role], fontSize: '0.7rem', fontWeight: 700 }}>
                {RoleIcons[user.role]} {user.role}
              </div>
            </div>
            <button className="btn btn-outline" onClick={() => { logout(); setForceAuthPage(false); setActiveTab('Books'); }} style={{ width: '100%', gap: '0.5rem', fontSize: '0.85rem' }}>
              🚪 Sign Out
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.5rem' }}>Join to borrow & reserve books</p>
            <button className="btn btn-primary" onClick={() => setForceAuthPage(true)} style={{ width: '100%' }}>Sign In</button>
            <button className="btn btn-outline" onClick={() => { setShowRegister(true); setForceAuthPage(true); }} style={{ width: '100%' }}>Create Account</button>
          </div>
        )}
      </aside>

      <main className="main-content">
        {activeTab === 'Dashboard' && <Dashboard />}
        {activeTab === 'Books' && <BooksList />}
        {activeTab === 'Fines' && <FinesList />}
        {activeTab === 'Reservations' && <ReservationsList />}
        {activeTab === 'Notifications' && <NotificationsList />}
        {activeTab === 'Users' && <AdminUsers />}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
