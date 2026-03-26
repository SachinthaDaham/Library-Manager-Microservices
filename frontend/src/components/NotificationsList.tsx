import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { NotificationLog } from '../types';
import { Bell, BellOff, Check, Trash2, AlertTriangle, Info, CheckCircle, User, Book as BookIcon, Search, Download, RefreshCw } from 'lucide-react';

export function NotificationsList() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'ALERTS' | 'SUCCESS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
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
      
      setNotifications(notifs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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

  const exportEventCSV = () => {
    const headers = ['Timestamp', 'Type', 'Message', 'Member', 'Status'];
    const csvRows = [headers.join(',')];
    
    filtered.forEach(n => {
      const member = n.metadata?.memberId ? (userMap[n.metadata.memberId] || n.metadata.memberId) : 'SYSTEM';
      csvRows.push([
        `"${new Date(n.createdAt).toLocaleString()}"`,
        `"${n.type || 'INFO'}"`,
        `"${n.message.replace(/"/g, '""')}"`,
        `"${member}"`,
        `"${n.read ? 'READ' : 'UNREAD'}"`
      ].join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      const matchesTab = 
        activeTab === 'ALL' ? true :
        activeTab === 'UNREAD' ? !n.read :
        activeTab === 'ALERTS' ? (n.type === 'ALERT' || n.type === 'WARNING') :
        activeTab === 'SUCCESS' ? n.type === 'SUCCESS' : true;
      
      const matchesSearch = !searchQuery || n.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesTab && matchesSearch;
    });
  }, [notifications, activeTab, searchQuery]);

  const stats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    alerts: notifications.filter(n => n.type === 'ALERT' || n.type === 'WARNING').length,
    success: notifications.filter(n => n.type === 'SUCCESS').length,
  }), [notifications]);

  if (loading && notifications.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Bell size={64} style={{ opacity: 0.5, margin: '0 auto 1.5rem', animation: 'calmDrift 3s infinite alternate', color: 'var(--primary)' }} />
        <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading System Event Logs...</p>
      </div>
    );
  }

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
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="glass-card" style={{ 
            padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', margin: 0, border: 'none',
            background: stats.unread > 0 ? 'var(--primary-light)' : '#fff' 
          }}>
            {stats.unread > 0 ? (
              <Bell size={28} color="var(--primary)" style={{ animation: 'float 2s ease-in-out infinite' }} />
            ) : (
              <BellOff size={28} color="var(--text-muted)" />
            )}
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Unread</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stats.unread > 0 ? 'var(--primary)' : 'var(--text-muted)', lineHeight: 1 }}>{stats.unread}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stats Dashboard ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Events', value: stats.total, color: 'var(--primary)', bg: 'var(--primary-light)', icon: <Info size={20} /> },
          { label: 'Unread', value: stats.unread, color: 'var(--primary)', bg: 'var(--primary-light)', icon: <Bell size={20} /> },
          { label: 'Alerts & Warnings', value: stats.alerts, color: 'var(--status-overdue)', bg: 'var(--status-overdue-bg)', icon: <AlertTriangle size={20} /> },
          { label: 'Success Events', value: stats.success, color: 'var(--status-returned)', bg: 'var(--status-returned-bg)', icon: <CheckCircle size={20} /> },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', margin: 0, border: 'none', background: '#fff' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Search, Tabs & Actions ─── */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        {/* Search bar */}
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: '42px', width: '100%' }}
            placeholder="Search event logs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-base)', padding: '4px', borderRadius: '10px' }}>
          {(['ALL', 'UNREAD', 'ALERTS', 'SUCCESS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="btn"
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                border: 'none',
                boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                fontWeight: 700,
                fontSize: '0.8rem'
              }}
            >
              {tab} {tab === 'UNREAD' && stats.unread > 0 && (
                <span style={{ marginLeft: '4px', background: 'var(--primary-light)', padding: '2px 6px', borderRadius: 'var(--radius-pill)', color: 'var(--primary)', fontSize: '0.7rem' }}>{stats.unread}</span>
              )}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={exportEventCSV} title="Export CSV" style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)', background: 'rgba(16,185,129,0.05)', color: 'var(--status-returned)' }}>
            <Download size={14} />
          </button>
          <button className="btn btn-outline" onClick={fetchNotifs} title="Refresh" style={{ padding: '8px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)' }}>
            <RefreshCw size={14} />
          </button>
          <button 
            className="btn btn-outline" 
            style={{ fontSize: '0.8rem', padding: '8px 14px', fontWeight: 600, opacity: stats.unread === 0 ? 0.5 : 1, borderRadius: 'var(--radius-pill)' }}
            onClick={handleMarkAllRead} 
            disabled={stats.unread === 0}
          >
            <Check size={14} style={{ marginRight: '4px' }} /> All Read
          </button>
          <button 
            className="btn btn-outline" 
            style={{ fontSize: '0.8rem', padding: '8px 14px', fontWeight: 600, color: 'var(--status-overdue)', borderColor: 'var(--status-overdue-bg)', borderRadius: 'var(--radius-pill)' }}
            onClick={handleDeleteAllRead}
          >
            <Trash2 size={14} style={{ marginRight: '4px' }} /> Clear Read
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
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
                  margin: 0, padding: '1.2rem 1.5rem', display: 'flex', gap: '1.2rem', alignItems: 'flex-start',
                  borderLeft: `4px solid ${notif.read ? 'transparent' : colorClass}`,
                  opacity: notif.read ? 0.75 : 1, transition: 'all 0.3s',
                  background: '#fff'
                }}
              >
                <div style={{ 
                  width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: bgClass, color: colorClass
                }}>
                  <IconGroup size={22} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', color: colorClass, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: bgClass }}>
                      {notif.type || 'SYSTEM'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {new Date(notif.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {!notif.read && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colorClass }} />
                    )}
                  </div>
                  
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: notif.read ? 500 : 700, marginBottom: '0.75rem', lineHeight: 1.5 }}>
                    {notif.message}
                  </p>
                  
                  {/* Metadata Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                    {notif.metadata?.memberId && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-base)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        <User size={11} /> {userMap[notif.metadata.memberId] || notif.metadata.memberId.substring(0,8)}
                      </div>
                    )}
                    {notif.metadata?.bookId && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-base)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        <BookIcon size={11} /> {bookMap[notif.metadata.bookId] || notif.metadata.bookId}
                      </div>
                    )}
                    {notif.metadata?.borrowId && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-base)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        TX: {notif.metadata.borrowId.substring(0,8)}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  {!notif.read && (
                    <button 
                      className="btn" 
                      style={{ padding: '6px 10px', background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', borderRadius: '8px' }}
                      onClick={(e) => handleMarkRead(notif._id, e)}
                      title="Mark as Read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button 
                    className="btn" 
                    style={{ 
                      padding: '6px 10px', border: '1px solid var(--border)', borderRadius: '8px', background: '#fff',
                      color: notif.read ? 'var(--text-muted)' : 'var(--status-overdue)'
                    }}
                    onClick={(e) => handleDelete(notif._id, e)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
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
