import { useState } from 'react';
import type { Fine } from '../types';

interface PaymentModalProps {
  fine: Fine;
  userMap: Record<string, string>;
  bookTitle: string;
  onClose: () => void;
  onSuccess: () => void;
  apiPay: (id: string) => Promise<any>;
}

export const PaymentModal = ({ fine, userMap, bookTitle, onClose, onSuccess, apiPay }: PaymentModalProps) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      // Simulate payment gateway delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      await apiPay(fine._id);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    } finally {
      if (document.body.contains(e.target as Node)) {
        setProcessing(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={!processing ? onClose : undefined}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
        <h2 style={{ marginBottom: '0.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💳</span> Settle Fine
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Securely process your payment to clear this penalty.
        </p>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Member</span>
            <span style={{ fontWeight: 600 }}>{userMap[fine.memberId] || fine.memberId.substring(0,8)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Book</span>
            <span style={{ color: 'var(--primary)', textAlign: 'right', maxWidth: '60%' }}>{bookTitle}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontWeight: 700 }}>Total Amount Due</span>
            <span style={{ color: '#F43F5E', fontWeight: 800, fontSize: '1.2rem' }}>${fine.amount.toFixed(2)}</span>
          </div>
        </div>

        {error && <div style={{ color: '#F43F5E', fontSize: '0.85rem', marginBottom: '1rem', background: 'rgba(244,63,94,0.1)', padding: '8px', borderRadius: '4px' }}>{error}</div>}

        <form onSubmit={handleSettle}>
          <div className="form-group">
            <label>Card Number (Mock)</label>
            <input className="form-control" type="text" placeholder="•••• •••• •••• 4242" 
                   defaultValue="4242 4242 4242 4242" disabled={processing} required />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Expiry</label>
              <input className="form-control" type="text" placeholder="12/26" defaultValue="12/26" disabled={processing} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>CVC</label>
              <input className="form-control" type="text" placeholder="123" defaultValue="123" disabled={processing} required />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={processing} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={processing} style={{ flex: 1, position: 'relative' }}>
              {processing ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
