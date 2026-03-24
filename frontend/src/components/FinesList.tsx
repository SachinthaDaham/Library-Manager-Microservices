import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Fine } from '../types';
import { useAuth } from '../context/AuthContext';
import { PaymentModal } from './PaymentModal';

export function FinesList() {
  const { user } = useAuth();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFine, setNewFine] = useState({ memberId: '', borrowId: '' });
  const [selectedFineToPay, setSelectedFineToPay] = useState<Fine | null>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [borrows, setBorrows] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [bookMap, setBookMap] = useState<Record<string, string>>({});

  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [borrowSearch, setBorrowSearch] = useState('');
  const [showBorrowDropdown, setShowBorrowDropdown] = useState(false);

  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(memberSearch.toLowerCase()) || (u._id && String(u._id).includes(memberSearch))
  );
  // Only OVERDUE borrows eligible for manual fine (returned borrows already handled automatically)
  const memberBorrows = borrows.filter(b => b.memberId === newFine.memberId && b.status === 'OVERDUE');
  const filteredBorrows = memberBorrows.filter(b => {
    const bookTitle = bookMap[b.bookId] || '';
    return bookTitle.toLowerCase().includes(borrowSearch.toLowerCase()) || (b._id && String(b._id).includes(borrowSearch));
  });

  const fetchFines = async () => {
    setLoading(true);
    try {
      // MEMBERS: fetch only their own fines via dedicated endpoint
      // ADMIN/LIBRARIAN: fetch all fines
      const data = (!isPrivileged && user?.id)
        ? await api.getFinesByMember(user.id)
        : await api.getFines();
      setFines(data);
    } catch (e) {
      console.error('Failed to load fines', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
    // Only load users/borrows/books for privileged roles (members don't need admin lookups)
    if (isPrivileged) {
      api.getUsers().then(d => {
        setUsers(d);
        const uMap: Record<string, string> = {};
        d.forEach((u: any) => { uMap[u._id] = u.name; });
        setUserMap(uMap);
      });
      api.getBorrows().then(setBorrows);
    }
    api.getBooks().then(d => {
      const bMap: Record<string, string> = {};
      d.forEach((b: any) => { if (b._id) bMap[b._id] = b.title; });
      setBookMap(bMap);
    });
    api.getBorrows().then(setBorrows);
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this fine record permanently?')) return;
    try {
      await api.deleteFine(id);
      fetchFines();
    } catch (e: any) { alert(e.message); }
  };

  const handleAddFine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFine(newFine);
      fetchFines();
      setShowAddModal(false);
      setNewFine({ memberId: '', borrowId: '' });
      setMemberSearch('');
      setBorrowSearch('');
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return (
    <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
      Loading Fines...
    </div>
  );

  const pendingFines = fines.filter(f => !f.paid);
  const paidFines = fines.filter(f => f.paid);
  const totalPending = pendingFines.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="dashboard">
      <header className="dashboard-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title">
            {isPrivileged ? 'System Fines 💰' : 'My Fines 💰'}
          </h1>
          <p className="dashboard-subtitle">
            {isPrivileged
              ? 'All member fines — auto-generated on overdue returns'
              : 'Your outstanding and paid fines'}
          </p>
        </div>
        {isPrivileged && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add Fine</button>
        )}
      </header>

      {/* Summary badges */}
      {fines.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div className="glass-card" style={{ padding: '0.8rem 1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: '#F43F5E', fontWeight: 700, fontSize: '1.3rem' }}>{pendingFines.length}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Unpaid</span>
          </div>
          <div className="glass-card" style={{ padding: '0.8rem 1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: '#F43F5E', fontWeight: 700, fontSize: '1.3rem' }}>${totalPending.toFixed(2)}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Outstanding</span>
          </div>
          <div className="glass-card" style={{ padding: '0.8rem 1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--status-returned)', fontWeight: 700, fontSize: '1.3rem' }}>{paidFines.length}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Paid</span>
          </div>
        </div>
      )}

      {fines.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎉</div>
          {isPrivileged ? 'No fines in the system!' : 'You have no fines!'}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Fine ID / Date</th>
                {isPrivileged && <th>Member</th>}
                <th>Borrow Details</th>
                <th>Overdue</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fines.map(fine => {
                const b = borrows.find(x => x._id === fine.borrowId);
                const bookTitle = b ? (bookMap[b.bookId] || 'Book') : 'Unknown Book';
                const overdueDays = fine.overdueDays ?? 0;

                return (
                  <tr key={fine._id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {fine._id ? String(fine._id).substring(0, 8) : 'Unknown'}...
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {fine.createdAt ? new Date(fine.createdAt).toLocaleDateString() : 'Unknown'}
                      </div>
                    </td>

                    {isPrivileged && (
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {fine.memberId ? (userMap[fine.memberId] || String(fine.memberId).substring(0, 8) + '...') : 'Unknown'}
                        </div>
                      </td>
                    )}

                    <td>
                      <div style={{ color: 'var(--primary)', fontWeight: 500 }}>{bookTitle}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Borrow: {fine.borrowId ? String(fine.borrowId).substring(0, 8) : 'None'}...
                      </div>
                      {overdueDays > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          🤖 Auto-generated on return
                        </div>
                      )}
                    </td>

                    <td>
                      {overdueDays > 0 ? (
                        <div>
                          <span style={{ color: '#F43F5E', fontWeight: 600 }}>{overdueDays} day{overdueDays !== 1 ? 's' : ''}</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>× $1.50/day</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Manual</span>
                      )}
                    </td>

                    <td>
                      <span className={`status-badge ${fine.paid ? 'status-returned' : 'status-overdue'}`}>
                        {fine.paid ? 'PAID' : 'UNPAID'}
                      </span>
                      {fine.paid && fine.paidAt && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {new Date(fine.paidAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.2rem', color: fine.paid ? 'var(--text-muted)' : '#F43F5E' }}>
                      ${fine.amount.toFixed(2)}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {!fine.paid && (
                        <button
                          className="btn"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--status-returned)', color: '#fff', marginRight: '0.5rem' }}
                          onClick={() => setSelectedFineToPay(fine)}
                        >
                          Pay Now
                        </button>
                      )}
                      {isPrivileged && (
                        <button
                          className="btn btn-outline"
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', borderColor: '#F43F5E', color: '#F43F5E' }}
                          onClick={() => handleDelete(fine._id)}
                        >
                          Del
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

      {/* Add Fine Modal (Admin/Librarian only) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Add Manual Fine</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Note: Fines are automatically created when an overdue book is returned.
              Only use this for exceptional cases.
            </p>
            <form onSubmit={handleAddFine}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label>Select Member</label>
                <input
                  className="form-control"
                  placeholder="Search member by name..."
                  value={memberSearch}
                  onChange={e => { setMemberSearch(e.target.value); setShowMemberDropdown(true); setNewFine({ ...newFine, memberId: '' }); setBorrowSearch(''); }}
                  onFocus={() => setShowMemberDropdown(true)}
                  onBlur={() => setTimeout(() => setShowMemberDropdown(false), 200)}
                />
                {showMemberDropdown && filteredUsers.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', zIndex: 10, maxHeight: 150, overflowY: 'auto', borderRadius: 'var(--radius-sm)' }}>
                    {filteredUsers.map(u => (
                      <div
                        key={u._id}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: newFine.memberId === u._id ? 'var(--primary-light)' : 'transparent' }}
                        onMouseDown={() => { setMemberSearch(u.name); setNewFine({ ...newFine, memberId: u._id, borrowId: '' }); setBorrowSearch(''); setShowMemberDropdown(false); }}
                      >
                        <strong style={{ color: 'var(--text-primary)' }}>{u.name}</strong>{' '}
                        <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{u.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label>Select Overdue Borrow Record</label>
                <input
                  className="form-control"
                  placeholder={newFine.memberId ? "Search member's overdue borrows..." : 'Select a member first...'}
                  value={borrowSearch}
                  disabled={!newFine.memberId}
                  onChange={e => { setBorrowSearch(e.target.value); setShowBorrowDropdown(true); setNewFine({ ...newFine, borrowId: '' }); }}
                  onFocus={() => setShowBorrowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowBorrowDropdown(false), 200)}
                />
                {showBorrowDropdown && filteredBorrows.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', zIndex: 10, maxHeight: 150, overflowY: 'auto', borderRadius: 'var(--radius-sm)' }}>
                    {filteredBorrows.map(b => {
                      const dueDateStr = b.dueDate ? new Date(b.dueDate).toLocaleDateString() : 'Unknown';
                      return (
                        <div
                          key={b._id}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: newFine.borrowId === b._id ? 'var(--primary-light)' : 'transparent' }}
                          onMouseDown={() => { setBorrowSearch(`${bookMap[b.bookId] || 'Book'} (due ${dueDateStr})`); setNewFine({ ...newFine, borrowId: b._id }); setShowBorrowDropdown(false); }}
                        >
                          <span className="status-badge status-overdue" style={{ padding: '2px 4px', fontSize: '0.6rem', marginRight: '6px' }}>OVERDUE</span>
                          <strong style={{ color: 'var(--text-primary)' }}>{bookMap[b.bookId] || b.bookId}</strong><br />
                          <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>Due: {dueDateStr}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {newFine.memberId && memberBorrows.length === 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--status-overdue)', marginTop: '0.5rem' }}>
                    This member has no overdue borrow records.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={!newFine.memberId || !newFine.borrowId} style={{ flex: 1 }}>
                  Apply Fine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {selectedFineToPay && (() => {
        const b = borrows.find(x => x._id === selectedFineToPay.borrowId);
        const bookTitle = b ? (bookMap[b.bookId] || 'Book') : 'Unknown Book';
        return (
          <PaymentModal
            fine={selectedFineToPay}
            userMap={userMap}
            bookTitle={bookTitle}
            onClose={() => setSelectedFineToPay(null)}
            onSuccess={() => { setSelectedFineToPay(null); fetchFines(); }}
            apiPay={api.payFine}
          />
        );
      })()}
    </div>
  );
}
