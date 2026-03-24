import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { BorrowRecord } from '../types';
import { BorrowModal } from './BorrowModal';
import { ReturnModal } from './ReturnModal';
import { useAuth } from '../context/AuthContext';

const STAT_CARDS = [
  { key: 'total',    label: 'Total Borrows',   icon: '📚', color: 'var(--primary)',      bg: 'var(--primary-light)' },
  { key: 'active',   label: 'Active Loans',    icon: '📖', color: 'var(--status-active)', bg: 'var(--status-active-bg)' },
  { key: 'returned', label: 'Returned Books',  icon: '✅', color: 'var(--status-returned)', bg: 'var(--status-returned-bg)' },
  { key: 'overdue',  label: 'Overdue Fines',   icon: '⚠️', color: 'var(--status-overdue)',  bg: 'var(--status-overdue-bg)' },
];

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, returned: 0, overdue: 0 });
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<BorrowRecord | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [bookMap, setBookMap] = useState<Record<string, string>>({});
  const [myPenaltyPoints, setMyPenaltyPoints] = useState<number>(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, borrowsData, usersData, booksData] = await Promise.all([
        api.getStats(), api.getBorrows(), api.getUsers(), api.getBooks()
      ]);

      const uMap: Record<string, string> = {};
      usersData.forEach((u: any) => { uMap[u._id] = u.name; });
      const bMap: Record<string, string> = {};
      booksData.forEach((b: any) => { bMap[b._id] = b.title; });
      setUserMap(uMap);
      setBookMap(bMap);
      
      let filteredBorrows = borrowsData;
      if (user?.role === 'MEMBER') {
          filteredBorrows = borrowsData.filter((b: any) => b.memberId === user.id);
          const me = usersData.find((u: any) => u._id === user.id);
          if (me) setMyPenaltyPoints(me.penaltyPoints || 0);
      }

      setStats(statsData);
      setBorrows(filteredBorrows.sort((a: any, b: any) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime()));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const formatDate = (d?: string) => d
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
    : '—';

  const isOverdueSoon = (dueDate?: string) => {
    if (!dueDate) return false;
    const diff = new Date(dueDate).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Library <span className="gradient-text">Overview</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Live borrow statistics & recent transactions</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          {user?.role === 'MEMBER' && (
            <div className="glass-card" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: myPenaltyPoints > 0 ? 'var(--status-overdue-bg)' : 'var(--status-returned-bg)', border: 'none', margin: 0 }}>
              <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{myPenaltyPoints > 0 ? '🚨' : '🌟'}</span>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>Penalty Points</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: myPenaltyPoints > 0 ? 'var(--status-overdue)' : 'var(--status-returned)', lineHeight: 1 }}>{myPenaltyPoints} <span style={{fontSize:'1rem', opacity:0.6}}>/ 5</span></div>
              </div>
            </div>
          )}
          {user?.role !== 'MEMBER' && (
            <button className="btn btn-primary" onClick={() => setShowBorrowModal(true)} style={{ padding: '0 1.5rem', height: '100%', minHeight: '3.5rem', fontSize: '0.95rem' }}>
              <span style={{ fontSize: '1.2rem', marginRight: '4px' }}>＋</span> New Borrow
            </button>
          )}
        </div>
      </div>

      {/* ─── Custom Pro Stats Grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {STAT_CARDS.map(card => (
          <div key={card.key} className="glass-card" style={{ padding: '1.8rem', position: 'relative', margin: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', borderTop: `4px solid ${card.color}` }}>
            {/* Background glow hint */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: card.bg, borderRadius: '50%', filter: 'blur(30px)', zIndex: 0 }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: '1.5rem', background: card.bg, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                  {card.icon}
                </div>
              </div>
              <div style={{ fontSize: '3rem', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {loading ? '—' : (stats as any)[card.key]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Recent Transactions ─── */}
      <div className="glass-card" style={{ overflow: 'hidden', margin: 0 }}>
        {/* Table header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.4)' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>Recent Transactions</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{borrows.length} records found in your history</p>
          </div>
          <button className="btn btn-outline" onClick={loadData} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            🔄 Refresh Target
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member Info</th>
                <th>Book Title</th>
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {borrows.map(r => (
                <tr key={r._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, flexShrink: 0 }}>
                        {(userMap[r.memberId] || r.memberId).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{userMap[r.memberId] || r.memberId.substring(0,8) + '…'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {r._id.substring(0,6)}...</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.2rem', padding: '6px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>📕</span>
                      <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{bookMap[r.bookId] || r.bookId.substring(0,8) + '…'}</div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{formatDate(r.borrowDate)}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: isOverdueSoon(r.dueDate) ? 'var(--status-overdue)' : 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: isOverdueSoon(r.dueDate) ? 600 : 400 }}>
                      {isOverdueSoon(r.dueDate) && <span style={{fontSize:'1.1rem'}}>⚠️</span>}
                      {formatDate(r.dueDate)}
                    </span>
                  </td>
                  <td><span className={`status-badge status-${r.status.toLowerCase()}`}>{r.status}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    {(user?.role === 'ADMIN' || user?.role === 'LIBRARIAN') && r.status !== 'RETURNED' && (
                      <button
                        className="btn"
                        style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'var(--status-returned-bg)', color: 'var(--status-returned)', border: '1px solid rgba(16,185,129,0.2)' }}
                        onClick={() => setSelectedReturn(r)}
                      >
                        ↩ Return Book
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && borrows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.5 }}>📭</div>
                    <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No borrow records yet</p>
                    <p style={{ fontSize: '0.95rem' }}>Start your reading journey by issuing a new book.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showBorrowModal && <BorrowModal onClose={() => setShowBorrowModal(false)} onSuccess={() => { setShowBorrowModal(false); loadData(); }} />}
      {selectedReturn && <ReturnModal record={selectedReturn} onClose={() => setSelectedReturn(null)} onSuccess={() => { setSelectedReturn(null); loadData(); }} />}
    </div>
  );
};
