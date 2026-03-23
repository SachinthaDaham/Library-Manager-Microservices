import { useState } from 'react';
import { api } from '../services/api';
import type { CreateBorrowDto } from '../types';

interface BorrowModalProps { onClose: () => void; onSuccess: () => void; }

export const BorrowModal = ({ onClose, onSuccess }: BorrowModalProps) => {
  const [formData, setFormData] = useState<CreateBorrowDto>({ memberId: '', bookId: '', loanDurationDays: 14, notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
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
          <div className="form-group"><label>Member ID</label><input className="form-control" required value={formData.memberId} onChange={e => setFormData({...formData, memberId: e.target.value})} placeholder="e.g. member-001" /></div>
          <div className="form-group"><label>Book ID</label><input className="form-control" required value={formData.bookId} onChange={e => setFormData({...formData, bookId: e.target.value})} placeholder="e.g. book-001" /></div>
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
