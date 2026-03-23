import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Reservation } from '../types';

export function ReservationsList() {
  const [res, setRes] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResModal, setShowResModal] = useState(false);
  const [targetBookId, setTargetBookId] = useState('');

  const fetchRes = () => api.getReservations().then(setRes).finally(() => setLoading(false));

  useEffect(() => { fetchRes(); }, []);

  const handleCancel = async (id: string) => {
    try {
      await api.cancelReservation(id);
      fetchRes();
    } catch(e: any) { alert(e.message); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!targetBookId) return;
    try {
      const userStr = localStorage.getItem('library_user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) return alert('Session Error');
      await api.createReservation({ memberId: user.id, bookId: targetBookId });
      fetchRes();
      setShowResModal(false);
      setTargetBookId('');
    } catch(err: any) { alert(err.message); }
  };

  if (loading) return <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>Loading Hold Queue...</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title">Reservations Queue 🕒</h1>
          <p className="dashboard-subtitle">Monitoring RabbitMQ fulfillment events for book hold queues</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowResModal(true)}>+ Place Hold</button>
      </header>

      {showResModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Place Book Hold</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Target Book ID</label>
                <input className="form-input" required value={targetBookId} onChange={e => setTargetBookId(e.target.value)} placeholder="Paste the Book ID here..." />
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
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No active reservations found.
          </div>
      ) : (
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Res ID</th>
              <th>Member ID</th>
              <th>Target Book ID</th>
              <th>Placed On</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {res.map(r => (
              <tr key={r._id}>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{r._id.substring(0,8)}...</td>
                <td style={{ fontWeight: 500 }}>{r.memberId}</td>
                <td style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{r.bookId}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{new Date(r.createdAt).toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${r.status === 'FULFILLED' ? 'status-returned' : 'status-active'}`}>
                    {r.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-outline" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', borderColor: '#F43F5E', color: '#F43F5E' }} onClick={() => handleCancel(r._id)}>
                    Cancel
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
