import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { BorrowRecord } from '../types';
import { BorrowModal } from './BorrowModal';
import { ReturnModal } from './ReturnModal';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Activity, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw, Calendar, Clock, ChevronRight, Inbox, Download, ChevronDown } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, returned: 0, overdue: 0 });
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<BorrowRecord | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [bookMap, setBookMap] = useState<Record<string, string>>({});
  const [myPenaltyPoints, setMyPenaltyPoints] = useState<number>(0);
  const [showCSVPreview, setShowCSVPreview] = useState(false);

  const loadData = async (pageNum = 1, isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else setLoading(true);

    try {
      const [statsData, borrowsRes, usersData, booksData] = await Promise.all([
        api.getStats(), api.getBorrows(pageNum, 20), api.getUsers(), api.getBooks()
      ]);

      const borrowsData = borrowsRes.data || [];
      if (borrowsRes.meta) setTotalPages(borrowsRes.meta.totalPages || 1);

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

      const sorted = filteredBorrows.sort((a: any, b: any) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
      
      if (isLoadMore) setBorrows(prev => [...prev, ...sorted]);
      else setBorrows(sorted);

      setStats(statsData);
      setPage(pageNum);
    } catch (err) { console.error('Dashboard Data Error:', err); }
    finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleLoadMore = () => {
    if (page < totalPages) {
      loadData(page + 1, true);
    }
  };

  const exportCSV = () => {
    const headers = ['Borrow ID', 'Member', 'Book', 'Borrow Date', 'Due Date', 'Status'];
    const csvRows = [headers.join(',')];
    
    borrows.forEach(r => {
      const member = userMap[r.memberId] || r.memberId;
      const book = bookMap[r.bookId] || r.bookId;
      csvRows.push([`"${r._id}"`, `"${member}"`, `"${book}"`, `"${formatDate(r.borrowDate)}"`, `"${formatDate(r.dueDate)}"`, `"${r.status}"`].join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library_borrow_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowCSVPreview(false);
  };

  const formatDate = (d?: string) => d
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))
    : '—';

  const isOverdueSoon = (dueDate?: string) => {
    if (!dueDate) return false;
    const diff = new Date(dueDate).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  return (
    <div style={{ paddingBottom: '3rem', animation: 'fadeIn 0.6s ease-out' }}>
      {/* ─── Premium Header ─── */}
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(67, 97, 238, 0.3)' }}>
              <ShieldCheck size={28} />
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>
              Command <span className="gradient-text">Center</span>
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginLeft: '60px', fontWeight: 500 }}>
            Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{user?.name || user?.role}</strong>. Here's what's happening today.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user?.role === 'MEMBER' && (
            <div className="glass-card" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', background: myPenaltyPoints >= 3 ? 'var(--status-overdue)' : myPenaltyPoints > 0 ? 'var(--status-overdue-bg)' : 'var(--status-returned-bg)', border: 'none', margin: 0, borderRadius: 'var(--radius-pill)', boxShadow: myPenaltyPoints >= 3 ? '0 4px 15px rgba(239,71,111,0.3)' : 'none' }}>
              {myPenaltyPoints >= 3 ? <AlertTriangle size={20} color="#fff" /> : myPenaltyPoints > 0 ? <AlertTriangle size={20} color="var(--status-overdue)" /> : <CheckCircle size={20} color="var(--status-returned)" />}
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, color: myPenaltyPoints >= 3 ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)', letterSpacing: '0.05em' }}>Penalty Status</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: myPenaltyPoints >= 3 ? '#fff' : myPenaltyPoints > 0 ? 'var(--status-overdue)' : 'var(--status-returned)', lineHeight: 1 }}>
                  {myPenaltyPoints >= 3 ? 'ACCOUNT RESTRICTED' : `${myPenaltyPoints} Points`}
                </div>
              </div>
            </div>
          )}
          {isPrivileged && (
            <button className="btn btn-primary" onClick={() => setShowBorrowModal(true)} style={{ padding: '0 1.5rem', height: '48px', fontSize: '0.95rem', borderRadius: 'var(--radius-pill)', boxShadow: '0 4px 15px rgba(67, 97, 238, 0.25)' }}>
              <BookOpen size={18} style={{ marginRight: '8px' }} /> Issue Book
            </button>
          )}
        </div>
      </header>

      {/* ─── Immersive Stats Grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { key: 'total', label: 'Lifetime Borrows', icon: <BookOpen size={24} />, color: 'var(--primary)', bg: 'var(--primary-light)' },
          { key: 'active', label: 'Currently Active', icon: <Activity size={24} />, color: 'var(--status-active)', bg: 'var(--status-active-bg)' },
          { key: 'returned', label: 'Successfully Returned', icon: <CheckCircle size={24} />, color: 'var(--status-returned)', bg: 'var(--status-returned-bg)' },
          { key: 'overdue', label: 'Overdue Fines', icon: <AlertTriangle size={24} />, color: 'var(--status-overdue)', bg: 'var(--status-overdue-bg)' }
        ].map((card, i) => (
          <div key={card.key} className="glass-card stat-card-hover" style={{ padding: '1.8rem', margin: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', border: 'none', background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', transition: 'transform 0.3s ease, box-shadow 0.3s ease', animationDelay: `${i * 0.1}s` }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, ${card.color}, transparent)` }} />
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: card.color, borderRadius: '50%', filter: 'blur(50px)', opacity: 0.15, zIndex: 0 }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  {card.label}
                </div>
                <div style={{ color: card.color, background: card.bg, width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px' }}>
                  {card.icon}
                </div>
              </div>
              <div style={{ fontSize: '3.5rem', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {loading ? <span style={{ opacity: 0.3 }}>-</span> : (stats as any)[card.key]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Recent Transactions ─── */}
      <div className="glass-card" style={{ overflow: 'hidden', margin: 0, padding: 0, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="var(--primary)" /> Live Activity Log
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Displaying {borrows.length} architectural events</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-outline" onClick={() => setShowCSVPreview(true)} title="Export CSV Report" style={{ padding: '8px 12px', fontSize: '0.85rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)', background: 'rgba(16,185,129,0.05)', color: 'var(--status-returned)' }}>
              <Download size={14} /> 
            </button>
            <button className="btn btn-outline" onClick={() => loadData(1)} style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border)' }}>
              <RefreshCw size={14} style={{ marginRight: '6px' }} /> Sync Details
            </button>
          </div>
        </div>

        <div className="table-container" style={{ background: '#fafbfc' }}>
          <table className="data-table">
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '1rem 2rem' }}>Borrower Info</th>
                <th>Target Asset</th>
                <th>Checkout Date</th>
                <th>Return Deadline</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Manage</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '4rem', color: 'var(--primary)' }}>
                    <RefreshCw size={32} className="spin" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <div style={{ fontWeight: 600 }}>Syncing Ledger...</div>
                  </td>
                </tr>
              ) : borrows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '6rem 2rem', background: '#fff' }}>
                    <div style={{ width: '80px', height: '80px', background: 'var(--bg-base)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--text-muted)' }}>
                      <Inbox size={40} />
                    </div>
                    <p style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>The ledger is empty</p>
                    <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>No transactional data found. Start checking out books to populate this view.</p>
                  </td>
                </tr>
              ) : (
                borrows.map(r => (
                  <tr key={r._id} style={{ background: '#fff', transition: 'background 0.2s', borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem 2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, flexShrink: 0 }}>
                          {(userMap[r.memberId] || r.memberId).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{userMap[r.memberId] || 'System User'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>UUID: {r.memberId.substring(0,8)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '8px', background: 'var(--bg-base)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                          <BookOpen size={16} />
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{bookMap[r.bookId] || 'Unknown Artifact'}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                        <Calendar size={14} opacity={0.6} /> {formatDate(r.borrowDate)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: isOverdueSoon(r.dueDate) ? 'var(--status-overdue)' : 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: isOverdueSoon(r.dueDate) ? 700 : 500, padding: isOverdueSoon(r.dueDate) ? '4px 10px' : '0', background: isOverdueSoon(r.dueDate) ? 'var(--status-overdue-bg)' : 'transparent', borderRadius: '6px' }}>
                        <Clock size={14} opacity={0.6} /> {formatDate(r.dueDate)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge status-${r.status.toLowerCase()}`} style={{ fontWeight: 800, letterSpacing: '0.05em' }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '2rem' }}>
                        {isPrivileged && r.status !== 'RETURNED' && (
                          <button
                            className="btn"
                            style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'var(--status-returned)', color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}
                            onClick={() => setSelectedReturn(r)}
                          >
                            Process Return <ChevronRight size={14} />
                          </button>
                        )}
                        {!isPrivileged && r.status === 'ACTIVE' && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-pill)', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                            onClick={async () => {
                              try {
                                await api.renewBorrow(r._id);
                                alert('Success! Your loan has been extended by 7 days.');
                                loadData(page, true);
                              } catch(e: any) { alert(e.message); }
                            }}
                          >
                            <Calendar size={14} style={{ marginRight: '6px' }} /> Renew
                          </button>
                        )}
                        {(r.status === 'RETURNED' || (!isPrivileged && r.status === 'OVERDUE')) && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Archived</span>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {/* Pagination Footer */}
          {!loading && page < totalPages && (
            <div style={{ padding: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--border)', background: '#fff' }}>
              <button 
                className="btn btn-outline" 
                onClick={handleLoadMore} 
                disabled={loadingMore}
                style={{ padding: '10px 24px', borderRadius: 'var(--radius-pill)', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                {loadingMore ? <RefreshCw size={16} className="spin" /> : <ChevronDown size={16} />}
                Load More Records
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .stat-card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 30px rgba(0,0,0,0.08) !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      {showBorrowModal && <BorrowModal onClose={() => setShowBorrowModal(false)} onSuccess={() => { setShowBorrowModal(false); loadData(); }} />}
      {selectedReturn && <ReturnModal record={selectedReturn} onClose={() => setSelectedReturn(null)} onSuccess={() => { setSelectedReturn(null); loadData(); }} />}

      {/* CSV Preview Modal */}
      {showCSVPreview && (
        <div className="modal-overlay" onClick={() => setShowCSVPreview(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Download size={20} color="var(--primary)" /> CSV Report Preview
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{borrows.length} records ready for export</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-outline" onClick={() => setShowCSVPreview(false)} style={{ padding: '8px 16px' }}>Close</button>
                <button className="btn btn-primary" onClick={exportCSV} style={{ padding: '8px 20px' }}>
                  <Download size={14} style={{ marginRight: '6px' }} /> Download CSV
                </button>
              </div>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <table className="data-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '10px 12px' }}>Borrow ID</th>
                    <th>Member</th>
                    <th>Book</th>
                    <th>Borrow Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {borrows.map(r => (
                    <tr key={r._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r._id.substring(0, 12)}...</td>
                      <td style={{ fontWeight: 600 }}>{userMap[r.memberId] || r.memberId.substring(0, 8)}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>{bookMap[r.bookId] || 'Unknown'}</td>
                      <td>{formatDate(r.borrowDate)}</td>
                      <td>{formatDate(r.dueDate)}</td>
                      <td><span className={`badge status-${r.status.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
