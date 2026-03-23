import { useState } from 'react';
import { api } from '../services/api';
import type { BorrowRecord } from '../types';

interface ReturnModalProps { record: BorrowRecord; onClose: () => void; onSuccess: () => void; }

export const ReturnModal = ({ record, onClose, onSuccess }: ReturnModalProps) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await api.returnBook(record.id, { notes }); onSuccess(); }
    catch (err: any) { setError(err.message || 'An error occurred'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--status-returned)' }}>Return Book</h2>
        {error && <div style={{ color: 'var(--status-overdue)', marginBottom: '1rem', padding: '0.75rem', background: 'var(--status-overdue-bg)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
        <div style={{ marginBottom: '2rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Book ID: <span style={{ color: 'var(--text-primary)' }}>{record.bookId}</span></p>
          <p style={{ color: 'var(--text-secondary)' }}>Member ID: <span style={{ color: 'var(--text-primary)' }}>{record.memberId}</span></p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Return Notes (Optional)</label><textarea className="form-control" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Condition of book upon return..." /></div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1, background: 'var(--status-returned)', boxShadow: '0 4px 15px rgba(16,185,129,0.4)' }}>{loading ? 'Processing...' : 'Confirm Return'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
