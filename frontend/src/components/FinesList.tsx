import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Fine } from '../types';

export function FinesList() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFines = () => api.getFines().then(setFines).finally(() => setLoading(false));

  useEffect(() => { fetchFines(); }, []);

  const handlePay = async (id: string) => {
    try {
      await api.payFine(id);
      fetchFines();
    } catch(e: any) { alert(e.message); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteFine(id);
      fetchFines();
    } catch(e: any) { alert(e.message); }
  };

  if (loading) return <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>Loading Fines Database...</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="dashboard-title">System Fines 💰</h1>
          <p className="dashboard-subtitle">Auditing RabbitMQ late-fee penalties emitted from the Event Bus</p>
        </div>
      </header>

      {fines.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎉</div>
            No fines found in the system!
          </div>
      ) : (
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Fine ID / Date</th>
              <th>Member ID</th>
              <th>Borrow Link</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fines.map(fine => (
              <tr key={fine._id}>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{fine._id.substring(0,8)}...</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(fine.createdAt).toLocaleDateString()}</div>
                </td>
                <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{fine.memberId}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{fine.borrowId}</td>
                <td>
                  <span className={`status-badge ${fine.paid ? 'status-returned' : 'status-overdue'}`}>
                    {fine.paid ? 'PAID' : 'UNPAID'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.2rem', color: fine.paid ? 'var(--text-muted)' : '#F43F5E' }}>
                  ${fine.amount.toFixed(2)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {!fine.paid && (
                    <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--status-returned)', color: '#fff', marginRight: '0.5rem' }} onClick={() => handlePay(fine._id)}>
                      Pay Now
                    </button>
                  )}
                  <button className="btn btn-outline" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', borderColor: '#F43F5E', color: '#F43F5E' }} onClick={() => handleDelete(fine._id)}>
                    Del
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
