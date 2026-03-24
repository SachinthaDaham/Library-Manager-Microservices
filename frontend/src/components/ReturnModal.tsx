import { useState } from 'react';
import { api } from '../services/api';
import type { BorrowRecord } from '../types';

interface ReturnModalProps {
  record: BorrowRecord;
  onClose: () => void;
  onSuccess: () => void;
}

const FINE_RATE_PER_DAY = 1.5;
const FINE_MINIMUM = 5;

function calcOverdueDays(dueDate: string): number {
  const now = new Date();
  const due = new Date(dueDate);
  return Math.max(0, Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
}

function calcFinePreview(overdueDays: number): number {
  return parseFloat(Math.max(overdueDays * FINE_RATE_PER_DAY, FINE_MINIMUM).toFixed(2));
}

export const ReturnModal = ({ record, onClose, onSuccess }: ReturnModalProps) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fineGenerated, setFineGenerated] = useState<number | null>(null);

  const isOverdue = record.status === 'OVERDUE' || new Date() > new Date(record.dueDate);
  const overdueDays = isOverdue ? calcOverdueDays(record.dueDate) : 0;
  const finePreview = isOverdue ? calcFinePreview(overdueDays) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.returnBook(record._id, { notes });
      if (isOverdue) {
        setFineGenerated(finePreview);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Post-return: show fine confirmation then close
  if (fineGenerated !== null) {
    return (
      <div className="modal-overlay" onClick={() => { onSuccess(); }}>
        <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: '#F43F5E', marginBottom: '0.5rem' }}>Book Returned — Fine Applied</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            This book was <strong style={{ color: '#F43F5E' }}>{overdueDays} day{overdueDays !== 1 ? 's' : ''} overdue</strong>.
            A fine of <strong style={{ color: '#F43F5E' }}>${fineGenerated.toFixed(2)}</strong> has been
            automatically added to the member's account.
          </p>
          <div style={{
            padding: '1rem',
            background: 'rgba(244,63,94,0.1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(244,63,94,0.3)',
            marginBottom: '1.5rem',
          }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <span>{overdueDays} days × ${FINE_RATE_PER_DAY}/day = </span>
              <strong style={{ color: '#F43F5E', fontSize: '1.1rem' }}>${fineGenerated.toFixed(2)}</strong>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => onSuccess()} style={{ width: '100%' }}>
            OK — View Fines
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--status-returned)' }}>Return Book</h2>

        {error && (
          <div style={{
            color: 'var(--status-overdue)', marginBottom: '1rem', padding: '0.75rem',
            background: 'var(--status-overdue-bg)', borderRadius: 'var(--radius-sm)',
          }}>
            {error}
          </div>
        )}

        {/* Overdue warning with fine preview */}
        {isOverdue && (
          <div style={{
            marginBottom: '1.5rem', padding: '1rem',
            background: 'rgba(244,63,94,0.08)',
            border: '1px solid rgba(244,63,94,0.4)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ fontWeight: 700, color: '#F43F5E', marginBottom: '0.4rem' }}>
              ⚠️ Overdue — {overdueDays} day{overdueDays !== 1 ? 's' : ''} late
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              A fine of <strong style={{ color: '#F43F5E' }}>${finePreview.toFixed(2)}</strong> will
              be automatically applied on return.
            </div>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Book ID: <span style={{ color: 'var(--text-primary)' }}>{record.bookId}</span>
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Member ID: <span style={{ color: 'var(--text-primary)' }}>{record.memberId}</span>
          </p>
          <p style={{ color: 'var(--text-secondary)' }}>
            Due: <span style={{ color: isOverdue ? '#F43F5E' : 'var(--text-primary)' }}>
              {new Date(record.dueDate).toLocaleDateString()}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Return Notes (Optional)</label>
            <textarea
              className="form-control"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Condition of book upon return..."
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                flex: 1,
                background: isOverdue ? '#F43F5E' : 'var(--status-returned)',
                boxShadow: isOverdue ? '0 4px 15px rgba(244,63,94,0.4)' : '0 4px 15px rgba(16,185,129,0.4)',
              }}
            >
              {loading ? 'Processing...' : isOverdue ? `Confirm Return + $${finePreview.toFixed(2)} Fine` : 'Confirm Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
