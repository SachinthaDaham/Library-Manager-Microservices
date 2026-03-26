import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { NotificationLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { Bell, BellOff, Check, Trash2, AlertTriangle, Info, CheckCircle, User, Book as BookIcon } from 'lucide-react';

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
      
      setNotifications(notifs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
    return (
      <div className="glass-card" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Bell size={64} style={{ opacity: 0.5, margin: '0 auto 1.5rem', animation: 'calmDrift 3s infinite alternate', color: 'var(--primary)' }} />
        <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading System Event Logs...</p>
      </div>
    );
  }

  const filtered = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.read;
    if (activeTab === 'ALERTS') return n.type === 'ALERT' || n.type === 'WARNING';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Bell size={36} color="var(--primary)" />
            System <span className="gradient-text">Event Logs</span>
          </h1>
          <p className="dashboard-subtitle">Monitor system automation, alerts, and transactional events.</p>
        </div>
        
        <div className="glass-card" style={{ 
          padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', margin: 0, border: 'none',
          background: unreadCount > 0 ? 'var(--primary-light)' : '#fff' 
        }}>
          {unreadCount > 0 ? (
            <Bell size={32} color="var(--primary)" style={{ animation: 'float 2s ease-in-out infinite' }} />
          ) : (
            <BellOff size={32} color="var(--text-muted)" />
          )}
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Unread Logs</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-muted)', lineHeight: 1 }}>{unreadCount}</div>
          </div>
        </div>
      </div>

      {/* ─── Tabs & Actions ─── */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-base)', padding: '6px', borderRadius: '12px' }}>
          {(['ALL', 'UNREAD', 'ALERTS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="btn"
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                border: 'none',
                boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              {tab} {tab === 'UNREAD' && unreadCount > 0 && (
                <span style={{ marginLeft: '6px', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', color: 'var(--primary)' }}>{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-outline" 
            style={{ fontSize: '0.85rem', padding: '10px 16px', fontWeight: 600, opacity: unreadCount === 0 ? 0.5 : 1 }}
            onClick={handleMarkAllRead} 
            disabled={unreadCount === 0}
          >
            <Check size={16} style={{ marginRight: '6px' }} /> Mark All Read
          </button>
          <button 
            className="btn btn-outline" 
            style={{ fontSize: '0.85rem', padding: '10px 16px', fontWeight: 600, color: 'var(--status-overdue)', borderColor: 'var(--status-overdue-bg)' }}
            onClick={handleDeleteAllRead}
          >
            <Trash2 size={16} style={{ marginRight: '6px' }} /> Clear History
          </button>
        </div>
      </div>

      {/* ─── List ─── */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <CheckCircle size={64} style={{ opacity: 0.5, margin: '0 auto 1.5rem', color: 'var(--status-returned)' }} />
          <h3 style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>All Caught Up!</h3>
          <p style={{ fontSize: '1.1rem' }}>No {activeTab.toLowerCase()} event logs to display.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {filtered.map(notif => {
            const isAlert = notif.type === 'ALERT' || notif.type === 'WARNING';
            const isSuccess = notif.type === 'SUCCESS';
            
            const IconGroup = isAlert ? AlertTriangle : isSuccess ? CheckCircle : Info;
            const colorClass = isAlert ? 'var(--status-overdue)' : isSuccess ? 'var(--status-returned)' : 'var(--primary)';
            const bgClass = isAlert ? 'var(--status-overdue-bg)' : isSuccess ? 'var(--status-returned-bg)' : 'var(--primary-light)';
            
            return (
              <div 
                key={notif._id} 
                className="glass-card" 
                style={{
                  margin: 0, padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap',
                  borderLeft: `4px solid ${notif.read ? 'transparent' : colorClass}`,
                  opacity: notif.read ? 0.75 : 1, transition: 'all 0.3s'
                }}
              >
                <div style={{ 
                  width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: bgClass, color: colorClass, border: `1px solid ${bgClass}`
                }}>
                  <IconGroup size={28} />
                </div>
                
                <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em', color: colorClass, textTransform: 'uppercase' }}>
                      {notif.type || 'SYSTEM INFO'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {new Date(notif.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {!notif.read && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colorClass }} />
                    )}
                  </div>
                  
                  <p style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: notif.read ? 500 : 700, marginBottom: '1rem', lineHeight: 1.5 }}>
                    {notif.message}
                  </p>
                  
                  {notif.metadata && Object.keys(notif.metadata).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {notif.metadata.memberId && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          <User size={12} color="var(--text-muted)" />
                          {userMap[notif.metadata.memberId] || notif.metadata.memberId.substring(0,8)}
                        </div>
                      )}
                      {notif.metadata.bookId && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          <BookIcon size={12} color="var(--text-muted)" />
                          {bookMap[notif.metadata.bookId] || notif.metadata.bookId}
                        </div>
                      )}
                      {notif.metadata.borrowId && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          ID: {notif.metadata.borrowId.substring(0,8)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '1rem', width: '100%' }}>
                  {!notif.read && (
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '8px 16px', fontSize: '0.85rem', flex: '1 1 auto', display: 'flex', justifyContent: 'center' }}
                      onClick={(e) => handleMarkRead(notif._id, e)}
                    >
                      <Check size={16} /> Mark Read
                    </button>
                  )}
                  <button 
                    className="btn btn-outline" 
                    style={{ 
                      padding: '8px 16px', fontSize: '0.85rem', flex: '1 1 auto', display: 'flex', justifyContent: 'center',
                      color: notif.read ? 'var(--text-muted)' : 'var(--status-overdue)',
                      borderColor: notif.read ? 'var(--border)' : 'var(--status-overdue-bg)'
                    }}
                    onClick={(e) => handleDelete(notif._id, e)}
                  >
                    <Trash2 size={16} /> Delete
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
