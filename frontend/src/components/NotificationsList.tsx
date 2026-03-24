import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { NotificationLog } from '../types';
import { useAuth } from '../context/AuthContext';

export function NotificationsList() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'ALERTS'>('ALL');
  
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [bookMap, setBookMap] = useState<Record<string, string>>({});

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const [notifs, users, books] = await Promise.all([
        api.getNotifications(),
        api.getUsers(),
        api.getBooks()
      ]);

      const uMap: Record<string, string> = {};
      users.forEach((u: any) => { uMap[u._id] = u.name; });
      const bMap: Record<string, string> = {};
      books.forEach((b: any) => { bMap[b._id] = b.title; });
      
      setUserMap(uMap);
      setBookMap(bMap);
      
      // Admin sees everything. If MEMBER role is allowed, filter by user.id
      setNotifications(notifs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    setLoading(true);
    try {
      await Promise.all(unread.map(n => api.markNotificationRead(n._id)));
      fetchNotifs();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteAllRead = async () => {
    if (!window.confirm('Clear all historical read logs?')) return;
    const readLogs = notifications.filter(n => n.read);
    setLoading(true);
    try {
      await Promise.all(readLogs.map(n => api.deleteNotification(n._id)));
      fetchNotifs();
    } catch (e: any) { alert(e.message); }
  };

  if (loading && notifications.length === 0) {
    return <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>Loading System Event Logs...</div>;
  }

  const filtered = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.read;
    if (activeTab === 'ALERTS') return n.type === 'ALERT' || n.type === 'WARNING';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            System <span className="gradient-text">Event Logs</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Monitor system automation, alerts, and transactional events.</p>
        </div>
        
        <div className="glass-card" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: unreadCount > 0 ? 'var(--primary-light)' : 'transparent', border: 'none', margin: 0 }}>
          <span style={{ fontSize: '1.8rem' }}>{unreadCount > 0 ? '🔔' : '🔕'}</span>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary)' }}>Unread Logs</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{unreadCount}</div>
          </div>
        </div>
      </header>

      {/* Tabs & Batch Actions */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ALL', 'UNREAD', 'ALERTS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                background: activeTab === tab ? 'var(--primary)' : 'transparent',
                color: activeTab === tab ? '#FFF' : 'var(--text-secondary)',
                border: activeTab === tab ? '1px solid var(--primary)' : '1px solid var(--border)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab} {tab === 'UNREAD' && unreadCount > 0 && `(${unreadCount})`}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px' }} onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            ✓ Mark All Read
          </button>
          <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 14px', color: 'var(--status-overdue)', borderColor: 'var(--status-overdue-bg)' }} onClick={handleDeleteAllRead}>
            🗑️ Clear History
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.5 }}>✅</div>
          <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>All Caught Up!</p>
          <p style={{ fontSize: '0.95rem' }}>No {activeTab.toLowerCase()} event logs to display.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map(notif => {
            const isAlert = notif.type === 'ALERT' || notif.type === 'WARNING';
            const isSuccess = notif.type === 'SUCCESS';
            const icon = isAlert ? '⚠️' : isSuccess ? '🎉' : 'ℹ️';
            const accentColor = isAlert ? 'var(--status-overdue)' : isSuccess ? 'var(--status-returned)' : 'var(--primary)';
            const bgLight = isAlert ? 'var(--status-overdue-bg)' : isSuccess ? 'var(--status-returned-bg)' : 'var(--primary-light)';
            
            return (
              <div key={notif._id} className="glass-card" style={{ 
                margin: 0, 
                padding: '1.5rem', 
                display: 'flex', 
                gap: '1.5rem', 
                alignItems: 'flex-start',
                borderLeft: `4px solid ${notif.read ? 'transparent' : accentColor}`,
                opacity: notif.read ? 0.75 : 1,
                transition: 'opacity 0.2s'
              }}>
                <div style={{ fontSize: '1.8rem', background: bgLight, width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', color: accentColor, textTransform: 'uppercase' }}>
                      {notif.type || 'SYSTEM INFO'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(notif.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {!notif.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: accentColor }} />}
                  </div>
                  
                  <p style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: notif.read ? 500 : 700, marginBottom: '0.75rem', lineHeight: 1.5 }}>
                    {notif.message}
                  </p>
                  
                  {notif.metadata && Object.keys(notif.metadata).length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {notif.metadata.memberId && (
                        <div style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-base)', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          👤 {userMap[notif.metadata.memberId] || notif.metadata.memberId.substring(0,8)}
                        </div>
                      )}
                      {notif.metadata.bookId && (
                        <div style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-base)', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          📕 {bookMap[notif.metadata.bookId] || notif.metadata.bookId}
                        </div>
                      )}
                      {notif.metadata.borrowId && (
                        <div style={{ padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-base)', border: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          ID: {notif.metadata.borrowId.substring(0,8)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {!notif.read && (
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleMarkRead(notif._id)}>
                      Mark Read
                    </button>
                  )}
                  <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: notif.read ? 0.5 : 1 }} onClick={() => handleDelete(notif._id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
