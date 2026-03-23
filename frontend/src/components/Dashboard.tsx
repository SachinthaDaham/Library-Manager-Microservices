import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { BorrowRecord } from '../types';
import { BorrowModal } from './BorrowModal';
import { ReturnModal } from './ReturnModal';

const STAT_CARDS = [
  { key: 'total',    label: 'Total Borrows',   icon: '📚', gradient: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(109,40,217,0.05))', iconColor: '#A78BFA', valueColor: 'var(--text-primary)' },
  { key: 'active',   label: 'Active Loans',    icon: '📖', gradient: 'linear-gradient(135deg,rgba(56,189,248,0.15),rgba(14,165,233,0.05))',  iconColor: 'var(--status-active)',   valueColor: 'var(--status-active)' },
  { key: 'returned', label: 'Returned Books',  icon: '✅', gradient: 'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(5,150,105,0.05))',   iconColor: 'var(--status-returned)', valueColor: 'var(--status-returned)' },
  { key: 'overdue',  label: 'Overdue',         icon: '⚠️', gradient: 'linear-gradient(135deg,rgba(244,63,94,0.15),rgba(225,29,72,0.05))',    iconColor: 'var(--status-overdue)',  valueColor: 'var(--status-overdue)' },
];

export const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, returned: 0, overdue: 0 });
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<BorrowRecord | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, borrowsData] = await Promise.all([api.getStats(), api.getBorrows()]);
      setStats(statsData);
      setBorrows(borrowsData.sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime()));
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
    <>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontFamily: 'Playfair Display, serif', fontWeight: 700, marginBottom: '0.4rem' }}>
            Library <span className="gradient-text">Overview</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>📊 Live borrow statistics & recent transactions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowBorrowModal(true)} style={{ padding: '12px 22px' }}>
          <span style={{ fontSize: '1.1rem' }}>＋</span> New Borrow
        </button>
      </div>

      {/* ─── Stats Grid ─── */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        {STAT_CARDS.map(card => (
          <div key={card.key} className="glass-panel" style={{ padding: 'var(--space-xl) var(--space-lg)', position: 'relative', overflow: 'hidden', background: card.gradient, transition: 'transform 0.25s, box-shadow 0.25s', cursor: 'default' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-5px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
          >
            <div style={{ fontSize: '2.2rem', position: 'absolute', right: '1.25rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.2 }}>{card.icon}</div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: card.iconColor, marginBottom: '0.6rem' }}>{card.label}</div>
            <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', lineHeight: 1, color: card.valueColor }}>
              {loading ? '—' : (stats as any)[card.key]}
            </div>
          </div>
        ))}
      </div>

      {/* ─── Recent Transactions ─── */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ padding: '1.5rem var(--space-xl)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '2px' }}>📋 Recent Transactions</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{borrows.length} records found</p>
          </div>
          <button className="btn btn-outline" onClick={loadData} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
            🔄 Refresh
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>MEMBER ID</th>
                <th>BOOK ID</th>
                <th>BORROW DATE</th>
                <th>DUE DATE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {borrows.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                        {r.memberId.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500 }}>{r.memberId}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>📕</span>
                      {r.bookId}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{formatDate(r.borrowDate)}</td>
                  <td>
                    <span style={{ color: isOverdueSoon(r.dueDate) ? 'var(--accent)' : 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: isOverdueSoon(r.dueDate) ? 600 : 400 }}>
                      {isOverdueSoon(r.dueDate) ? '⚠️ ' : ''}{formatDate(r.dueDate)}
                    </span>
                  </td>
                  <td><span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span></td>
                  <td>
                    {r.status !== 'RETURNED' && (
                      <button
                        className="btn"
                        style={{ padding: '6px 14px', fontSize: '0.8rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.15),rgba(5,150,105,0.08))', color: 'var(--status-returned)', border: '1px solid rgba(16,185,129,0.25)' }}
                        onClick={() => setSelectedReturn(r)}
                      >
                        ↩ Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && borrows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No borrow records yet</p>
                    <p style={{ fontSize: '0.875rem' }}>Click "New Borrow" to create the first one</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showBorrowModal && <BorrowModal onClose={() => setShowBorrowModal(false)} onSuccess={() => { setShowBorrowModal(false); loadData(); }} />}
      {selectedReturn && <ReturnModal record={selectedReturn} onClose={() => setSelectedReturn(null)} onSuccess={() => { setSelectedReturn(null); loadData(); }} />}
    </>
  );
};
