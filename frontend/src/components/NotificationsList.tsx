import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { NotificationLog } from '../types';

export function NotificationsList() {
  const [notifs, setNotifs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = () => api.getNotifications().then(setNotifs).finally(() => setLoading(false));

  useEffect(() => { fetchNotifs(); }, []);

  const handleRead = async (id: string, e: any) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      fetchNotifs();
    } catch(e: any) { alert(e.message); }
  };

  const handleDelete = async (id: string, e: any) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      setNotifs(notifs.filter(n => n._id !== id));
    } catch(e: any) { alert(e.message); }
  };

  if (loading) return <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>Loading Event Dispatcher Logs...</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="dashboard-title">Event Notification Logs 🔔</h1>
          <p className="dashboard-subtitle">Simulated email dispatches triggered by RabbitMQ exchanges</p>
        </div>
      </header>
      
      {notifs.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Event Log is empty. Run a borrow or return action to trigger RabbitMQ!
          </div>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {notifs.map(notif => (
          <div key={notif._id} className="glass-card" style={{ padding: '1.25rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', borderLeft: `4px solid ${notif.message.includes('OVERDUE') ? '#F43F5E' : '#10B981'}`, opacity: notif.read ? 0.6 : 1 }}>
            <div style={{ fontSize: '1.5rem' }}>
                {notif.message.includes('OVERDUE') ? '⚠️' : '✅'}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Dispatch &rarr; Member {notif.memberId} {!notif.read && <span style={{ color: '#F59E0B', fontSize: '0.7rem', marginLeft: '0.5rem' }}>● NEW</span>}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(notif.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {notif.message}
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                  {!notif.read && (
                    <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={(e) => handleRead(notif._id, e)}>Mark Read</button>
                  )}
                  <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: '#F43F5E', color: '#F43F5E' }} onClick={(e) => handleDelete(notif._id, e)}>Delete Log</button>
                </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
