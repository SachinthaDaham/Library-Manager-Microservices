import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Reservation, Book } from '../types';
import { useAuth } from '../context/AuthContext';
import { Clock, BookMarked, User, Search, Trash2, CheckCircle, Plus, BookOpen, AlertCircle } from 'lucide-react';

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

  const handleCancel = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.cancelReservation(id);
      fetchRes();
    } catch (e: any) { alert(e.message); }
  };

  const handleFulfill = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  if (loading) return (
    <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      <Clock size={64} style={{ opacity: 0.5, margin: '0 auto 1.5rem', animation: 'calmDrift 3s infinite alternate', color: 'var(--primary)' }} />
      <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading Queue...</p>
    </div>
  );

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={36} color="var(--primary)" />
            Hold <span className="gradient-text">Queue</span>
          </h1>
          <p className="dashboard-subtitle">Monitor available holds, queue positions, and pickup deadlines.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowResModal(true)} style={{ padding: '0 1.5rem', height: '100%', minHeight: '3.5rem' }}>
          <Plus size={20} style={{ marginRight: '6px' }} /> Place Hold
        </button>
      </div>

      {res.length === 0 ? (
        <div className="glass-card" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookMarked size={64} style={{ opacity: 0.5, margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Active Reservations</h3>
          <p style={{ fontSize: '1.1rem' }}>Books you reserve will appear here with their queue positions.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {res.map(r => {
            const bookTitle = bookMap[r.bookId] || 'Unknown Book';
            const isFulfilled = r.status === 'FULFILLED';
            const queuePos = getCustomQueuePosition(r);
            const expiryDate = r.expiresAt ? new Date(r.expiresAt) : null;
            const isExpired = expiryDate ? expiryDate < new Date() : false;

            return (
              <div key={r._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', margin: 0 }}>
                <div style={{ 
                  padding: '1.25rem 1.5rem', 
                  borderBottom: '1px solid var(--border)', 
                  background: isFulfilled ? 'var(--status-returned-bg)' : 'var(--primary-light)' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800,
                        background: isFulfilled ? '#fff' : '#fff',
                        color: isFulfilled ? 'var(--status-returned)' : 'var(--primary)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }}>
                        {isFulfilled ? <CheckCircle size={20} /> : `#${queuePos || '?'}`}
                      </div>
                      <div>
                        {isFulfilled ? (
                          <span className="badge status-returned">READY FOR PICKUP</span>
                        ) : (
                          <span className="badge status-active">WAITING IN QUEUE</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '4px' }} title={bookTitle}>
                    {bookTitle}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Ref: {r._id}</div>
                </div>

                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', flex: 1 }}>
                    {user?.role !== 'MEMBER' && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.9rem' }}>
                        <User size={16} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{userMap[r.memberId] || 'Unknown User'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ID: {r.memberId.substring(0,8)}...</div>
                        </div>
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.9rem' }}>
                      <Clock size={16} color="var(--text-muted)" style={{ marginTop: '2px' }} />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Placed On</div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          {new Date(r.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {isFulfilled && expiryDate && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.9rem' }}>
                        <AlertCircle size={16} color={isExpired ? 'var(--status-overdue)' : '#F59E0B'} style={{ marginTop: '2px' }} />
                        <div>
                          <div style={{ fontWeight: 600, color: isExpired ? 'var(--status-overdue)' : '#F59E0B' }}>
                            {isExpired ? 'Expired' : 'Expires On'}
                          </div>
                          <div style={{ fontWeight: 600, color: isExpired ? 'var(--status-overdue)' : 'var(--text-secondary)' }}>
                            {expiryDate.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.8rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    {(user?.role === 'ADMIN' || user?.role === 'LIBRARIAN') && !isFulfilled && (
                      <button 
                        className="btn" 
                        style={{ flex: 1, background: 'var(--status-returned-bg)', color: 'var(--status-returned)', border: '1px solid rgba(16,185,129,0.2)' }}
                        onClick={(e) => handleFulfill(r._id, e)}
                      >
                        <CheckCircle size={16} /> Fulfill
                      </button>
                    )}
                    {(user?.role === 'ADMIN' || user?.role === 'LIBRARIAN' || r.memberId === user?.id) && (
                      <button 
                        className="btn btn-outline" 
                        style={{ flex: 1, color: 'var(--text-secondary)' }}
                        onClick={(e) => handleCancel(r._id, e)}
                      >
                        <Trash2 size={16} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Place Hold Modal */}
      {showResModal && (
        <div className="modal-overlay" onClick={() => setShowResModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <BookMarked size={24} color="var(--primary)" style={{ marginRight: '12px' }} />
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Place Book Hold</h2>
            </div>
            
            <form onSubmit={handleCreate}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Search Catalog</label>
                <div style={{ position: 'relative' }}>
                  <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="form-control"
                    style={{ paddingLeft: '48px' }}
                    placeholder="Type book title..."
                    value={bookSearch}
                    onChange={e => { setBookSearch(e.target.value); setShowBookDropdown(true); setTargetBookId(''); }}
                    onFocus={() => setShowBookDropdown(true)}
                    onBlur={() => setTimeout(() => setShowBookDropdown(false), 200)}
                  />
                </div>
                
                {showBookDropdown && filteredBooks.length > 0 && (
                  <div style={{ position: 'absolute', top: '75px', left: 0, right: 0, background: '#fff', border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 20, maxHeight: '250px', overflowY: 'auto', borderRadius: 'var(--radius-sm)' }}>
                    {filteredBooks.map(b => (
                      <div
                        key={b._id}
                        style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--bg-base)', background: targetBookId === b._id ? 'var(--primary-light)' : '#fff', transition: 'background 0.2s' }}
                        onMouseDown={e => { e.preventDefault(); setBookSearch(b.title); setTargetBookId(b._id || ''); setShowBookDropdown(false); }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{b.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                          <User size={12} style={{ marginRight: '4px' }} /> {b.author}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '12px' }} onClick={() => setShowResModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }} disabled={!targetBookId}>
                  Confirm Hold
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
