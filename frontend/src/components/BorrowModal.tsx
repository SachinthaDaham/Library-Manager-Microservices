import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { CreateBorrowDto } from '../types';

interface BorrowModalProps { onClose: () => void; onSuccess: () => void; }

export const BorrowModal = ({ onClose, onSuccess }: BorrowModalProps) => {
  const [formData, setFormData] = useState<CreateBorrowDto>({ memberId: '', bookId: '', loanDurationDays: 14, notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [showBookDropdown, setShowBookDropdown] = useState(false);

  const filteredUsers = users.filter(u => u.role === 'MEMBER' && (u.name.toLowerCase().includes(memberSearch.toLowerCase()) || u._id.includes(memberSearch)));
  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(bookSearch.toLowerCase()) || b._id.includes(bookSearch));

  useEffect(() => {
    api.getUsers().then(setUsers).catch((e: any) => console.error(e));
    api.getBooks().then(setBooks).catch((e: any) => console.error(e));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    if (!formData.memberId || !formData.bookId) {
      setError('Please select a valid Member and Book from the dropdown list.');
      setLoading(false);
      return;
    }
    try { await api.createBorrow(formData); onSuccess(); }
    catch (err: any) { setError(err.message || 'An error occurred'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Borrow a Book</h2>
        {error && <div style={{ color: 'var(--status-overdue)', marginBottom: '1rem', padding: '0.75rem', background: 'var(--status-overdue-bg)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Search Member Name or ID</label>
            <input className="form-control" placeholder="Type to search..." value={memberSearch} onChange={e => { setMemberSearch(e.target.value); setShowMemberDropdown(true); setFormData({...formData, memberId: ''}); }} onFocus={() => setShowMemberDropdown(true)} onBlur={() => setTimeout(() => setShowMemberDropdown(false), 200)} />
            {showMemberDropdown && filteredUsers.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', zIndex: 10, maxHeight: 150, overflowY: 'auto', borderRadius: 'var(--radius-sm)' }}>
                {filteredUsers.map(u => (
                  <div key={u._id} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: formData.memberId === u._id ? 'rgba(139,92,246,0.3)' : 'transparent' }}
                    onMouseDown={e => { e.preventDefault(); setMemberSearch(`${u.name} (${u.email})`); setFormData({...formData, memberId: u._id}); setShowMemberDropdown(false); }}>
                    <strong style={{color:'var(--text-primary)'}}>{u.name}</strong> <span style={{fontSize:'0.8em', color:'var(--text-muted)'}}>{u.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Search Book Title or ID</label>
            <input className="form-control" placeholder="Type to search..." value={bookSearch} onChange={e => { setBookSearch(e.target.value); setShowBookDropdown(true); setFormData({...formData, bookId: ''}); }} onFocus={() => setShowBookDropdown(true)} onBlur={() => setTimeout(() => setShowBookDropdown(false), 200)} />
            {showBookDropdown && filteredBooks.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', zIndex: 10, maxHeight: 150, overflowY: 'auto', borderRadius: 'var(--radius-sm)' }}>
                {filteredBooks.map(b => (
                  <div key={b._id} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: formData.bookId === b._id ? 'rgba(139,92,246,0.3)' : 'transparent' }}
                    onMouseDown={e => { e.preventDefault(); setBookSearch(b.title); setFormData({...formData, bookId: b._id}); setShowBookDropdown(false); }}>
                    <strong style={{color:'var(--text-primary)'}}>{b.title}</strong> <span style={{fontSize:'0.8em', color:'var(--text-muted)'}}>by {b.author}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group"><label>Loan Duration (Days)</label><input type="number" className="form-control" min={1} max={90} value={formData.loanDurationDays} onChange={e => setFormData({...formData, loanDurationDays: parseInt(e.target.value)})} /></div>
          <div className="form-group"><label>Notes (Optional)</label><textarea className="form-control" rows={3} value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Any special notes..." /></div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>{loading ? 'Processing...' : 'Confirm Borrow'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
