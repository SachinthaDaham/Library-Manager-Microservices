import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Reservation, Book } from '../types';

import { useAuth } from '../context/AuthContext';

export function ReservationsList() {
  const { user } = useAuth();
  const [res, setRes] = useState<Reservation[]>([]);
  const [allRes, setAllRes] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResModal, setShowResModal] = useState(false);
  const [targetBookId, setTargetBookId] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [bookMap, setBookMap] = useState<Record<string, string>>({});

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(bookSearch.toLowerCase()) || (b._id && b._id.includes(bookSearch)));

  const fetchRes = () => api.getReservations().then(data => {
    setAllRes(data);
    if (user?.role === 'MEMBER') {
      setRes(data.filter((r: any) => r.memberId === user.id));
    } else {
      setRes(data);
    }
  }).finally(() => setLoading(false));

  useEffect(() => {
    fetchRes();
    api.getBooks().then(d => {
      setBooks(d);
      const bMap: Record<string, string> = {};
      d.forEach((b: any) => { bMap[b._id] = b.title; });
      setBookMap(bMap);
    });
    api.getUsers().then(d => {
      const uMap: Record<string, string> = {};
      d.forEach((u: any) => { uMap[u._id] = u.name; });
      setUserMap(uMap);
    });
  }, [user]);

  const handleCancel = async (id: string) => {
    try {
      await api.cancelReservation(id);
      fetchRes();
    } catch (e: any) { alert(e.message); }
  };

  const handleFulfill = async (id: string) => {
    try {
      await api.fulfillReservation(id);
      fetchRes();
    } catch (e: any) { alert(e.message); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBookId) {
      alert('Please select a valid Book from the dropdown list.');
      return;
    }
    try {
      if (!user) return alert('Session Error');
      await api.createReservation({ memberId: user.id, bookId: targetBookId });
      fetchRes();
      setShowResModal(false);
      setTargetBookId('');
      setBookSearch('');
    } catch (err: any) { alert(err.message); }
  };

  const getCustomQueuePosition = (r: Reservation) => {
    if (r.status !== 'WAITING') return null;
    const waitingForBook = allRes
      .filter(x => x.bookId === r.bookId && x.status === 'WAITING')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const pos = waitingForBook.findIndex(x => x._id === r._id);
    return pos !== -1 ? pos + 1 : null;
  };

  if (loading) return <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>Loading Hold Queue...</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="dashboard-title">Reservations Queue 🕒</h1>
          <p className="dashboard-subtitle">Monitor available holds, queue positions, and pickup deadlines.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowResModal(true)}>+ Place Hold</button>
      </header>

      {showResModal && (
        <div className="modal-overlay" onClick={() => setShowResModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Place Book Hold</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Search Book Title</label>
                <input
                  className="form-control"
                  placeholder="Type to search..."
                  value={bookSearch}
                  onChange={e => { setBookSearch(e.target.value); setShowBookDropdown(true); setTargetBookId(''); }}
                  onFocus={() => setShowBookDropdown(true)}
                  onBlur={() => setTimeout(() => setShowBookDropdown(false), 200)}
                />
                {showBookDropdown && filteredBooks.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', zIndex: 10, maxHeight: 150, overflowY: 'auto', borderRadius: 'var(--radius-sm)' }}>
                    {filteredBooks.map(b => (
                      <div
                        key={b._id}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: targetBookId === b._id ? 'var(--primary-light)' : 'transparent', textAlign: 'left' }}
                        onMouseDown={e => { e.preventDefault(); setBookSearch(b.title); setTargetBookId(b._id || ''); setShowBookDropdown(false); }}
                      >
                        <strong style={{ color: 'var(--text-primary)' }}>{b.title}</strong>{' '}
                        <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>by {b.author}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowResModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm Hold</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {res.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '1rem' }}>🍃</div>
          <h3>No active reservations</h3>
          <p>Your reserved books will appear here.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Reservation</th>
                {user?.role !== 'MEMBER' && <th>Member</th>}
                <th>Status / Queue Info</th>
                <th>Placed On</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {res.map(r => {
                const bookTitle = bookMap[r.bookId] || 'Unknown Book';
                const isFulfilled = r.status === 'FULFILLED';
                const queuePos = getCustomQueuePosition(r);
                const isReady = isFulfilled && r.expiresAt;

                const expiryDate = r.expiresAt ? new Date(r.expiresAt) : null;
                const isExpired = expiryDate ? expiryDate < new Date() : false;

                return (
                  <tr key={r._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>{bookTitle}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {r._id.substring(0, 8)}...</div>
                    </td>
                    
                    {user?.role !== 'MEMBER' && (
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{userMap[r.memberId] || 'User'}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.memberId.substring(0, 8)}...</div>
                      </td>
                    )}

                    <td>
                      {isFulfilled ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                          <span className="status-badge status-returned">READY FOR PICKUP</span>
                          {expiryDate && (
                            <span style={{ fontSize: '0.8rem', color: isExpired ? 'var(--status-overdue)' : 'var(--text-secondary)' }}>
                              {isExpired ? '⚠️ Expired' : `Expires: ${expiryDate.toLocaleDateString()}`}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                          <span className="status-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>WAITING</span>
                          {queuePos && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              Queue Position: #{queuePos}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {new Date(r.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {(user?.role === 'ADMIN' || user?.role === 'LIBRARIAN') && !isFulfilled && (
                        <button 
                          className="btn" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--status-returned-bg)', color: 'var(--status-returned)', border: '1px solid rgba(16,185,129,0.2)', marginRight: '0.5rem' }} 
                          onClick={() => handleFulfill(r._id)}
                        >
                          Ready for Pickup
                        </button>
                      )}
                      {(user?.role === 'ADMIN' || user?.role === 'LIBRARIAN' || r.memberId === user?.id) && (
                        <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => handleCancel(r._id)}>
                          Cancel Hold
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
