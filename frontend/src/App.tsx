import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Dashboard } from './components/Dashboard';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BooksList } from './components/BooksList';
import { FinesList } from './components/FinesList';
import { ReservationsList } from './components/ReservationsList';
import { NotificationsList } from './components/NotificationsList';
import { AdminUsers } from './components/AdminUsers';
import { MyLibrary } from './components/MyLibrary';
import { api } from './services/api';

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
  const [unreadCount, setUnreadCount] = useState(0);

  // Re-set default tab on login/logout
  useEffect(() => {
    if (user) setActiveTab('Books');
  }, [user?.id]);

  // Poll unread notification count every 30s for staff users
  useEffect(() => {
    if (!user || user.role === 'MEMBER') return;
    const fetchUnread = async () => {
      try {
        const notifs = await api.getNotifications();
        setUnreadCount(notifs.filter((n: any) => !n.read).length);
      } catch (_) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

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

  const isMember = user?.role === 'MEMBER';
  const isStaff  = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const navItems = user ? [
    ...(isMember ? [{ id: 'MyLibrary', icon: '🏠', label: 'My Library' }] : []),
    { id: 'Books',        icon: '📖', label: 'Library Catalog' },
    ...(isStaff ? [{ id: 'Dashboard', icon: '📊', label: 'Borrow Records' }] : []),
    { id: 'Fines',        icon: '💰', label: isMember ? 'My Fines'    : 'System Fines' },
    { id: 'Reservations', icon: '🕒', label: isMember ? 'My Holds'    : 'Hold Queue' },
    ...(user.role === 'ADMIN' ? [
      { id: 'Users', icon: '👥', label: 'User Management' },
    ] : []),
    ...(isStaff ? [
      { id: 'Notifications', icon: '🔔', label: 'Event Logs', badge: unreadCount },
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
          {navItems.map((item: any) => (
            <a
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.id); if (item.id === 'Notifications') setUnreadCount(0); }}
              style={{ position: 'relative' }}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.badge > 0 && (
                <span style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: '#EF4444', color: '#fff', fontSize: '0.65rem', fontWeight: 800,
                  minWidth: '18px', height: '18px', borderRadius: '100px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                }}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-subtle)', margin: '1.5rem 0' }} />

        {/* System info */}
        <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: 700, marginBottom: '4px', letterSpacing: '0.08em' }}>🔗 SERVICES ONLINE</p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Auth · Borrow · Books · Fines</p>
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
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '0.5rem' }}>Join to borrow &amp; reserve books</p>
            <button className="btn btn-primary" onClick={() => setForceAuthPage(true)} style={{ width: '100%' }}>Sign In</button>
            <button className="btn btn-outline" onClick={() => { setShowRegister(true); setForceAuthPage(true); }} style={{ width: '100%' }}>Create Account</button>
          </div>
        )}
      </aside>

      <main className="main-content">
        {activeTab === 'MyLibrary'     && <MyLibrary />}
        {activeTab === 'Dashboard'     && <Dashboard />}
        {activeTab === 'Books'         && <BooksList />}
        {activeTab === 'Fines'         && <FinesList />}
        {activeTab === 'Reservations'  && <ReservationsList />}
        {activeTab === 'Notifications' && <NotificationsList />}
        {activeTab === 'Users'         && <AdminUsers />}
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
