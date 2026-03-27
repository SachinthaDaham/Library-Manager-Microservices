import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Fine } from '../types';
import { useAuth } from '../context/AuthContext';
import { PaymentModal } from './PaymentModal';
import { CircleDollarSign, AlertCircle, CheckCircle2, PartyPopper } from 'lucide-react';

export function FinesList() {
  const { user } = useAuth();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);

  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [bookMap, setBookMap] = useState<Record<string, string>>({});
  const [borrows, setBorrows] = useState<any[]>([]);

  const fetchFines = () => api.getFines().then(data => {
    if (user?.role === 'MEMBER') {
      setFines(data.filter((f: any) => f.memberId === user.id));
    } else {
      setFines(data);
    }
  }).finally(() => setLoading(false));

  useEffect(() => {
    fetchFines();
    if (user?.role !== 'MEMBER') {
      api.getUsers().then(d => {
        const uMap: Record<string, string> = {};
        d.forEach((u: any) => { uMap[u._id] = u.name; });
        setUserMap(uMap);
      });
      api.getBorrows().then(res => setBorrows(res.data));
    }
    api.getBooks().then(d => {
      const bMap: Record<string, string> = {};
      d.forEach((b: any) => { if (b._id) bMap[b._id] = b.title; });
      setBookMap(bMap);
    });
    api.getBorrows().then(res => setBorrows(res.data));
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this fine record?')) return;
    try {
      await api.deleteFine(id);
      fetchFines();
    } catch(e: any) { alert(e.message); }
  };

  const getBookTitleForFine = (borrowId: string) => {
    const borrow = borrows.find(b => b._id === borrowId);
    if (borrow && borrow.bookId) {
      return bookMap[borrow.bookId] || 'Unknown Book';
    }
    return 'Unknown Borrow Record';
  };

  if (loading) return (
    <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
      <CircleDollarSign size={64} style={{ opacity: 0.5, margin: '0 auto 1.5rem', animation: 'calmDrift 3s infinite alternate', color: 'var(--primary)' }} />
      <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading Account Records...</p>
    </div>
  );

  const isPrivileged = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';
  const pendingFines = fines.filter(f => f.paid === false);
  const totalPending = pendingFines.reduce((acc, curr) => acc + curr.amount, 0);
  const paidFines = fines.filter(f => f.paid === true);

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CircleDollarSign size={36} color="var(--primary)" />
            System <span className="gradient-text">Fines</span>
          </h1>
          <p className="dashboard-subtitle">All member fines — auto-generated on overdue returns</p>
        </div>
        {isPrivileged && (
          <button className="btn btn-primary" onClick={() => alert('Manual fine creation feature coming soon.')} style={{ padding: '0 1.5rem', height: '100%', minHeight: '3.5rem' }}>
            + Add Fine
          </button>
        )}
      </header>

      {/* Summary badges */}
      {fines.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', margin: 0 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-overdue)', lineHeight: 1 }}>{pendingFines.length}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Unpaid</div>
            </div>
          </div>
          
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', margin: 0 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircleDollarSign size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>${totalPending.toFixed(2)}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Outstanding</div>
            </div>
          </div>
          
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', margin: 0 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--status-returned-bg)', color: 'var(--status-returned)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-returned)', lineHeight: 1 }}>{paidFines.length}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Paid</div>
            </div>
          </div>
        </div>
      )}

      {fines.length === 0 ? (
        <div className="glass-card" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <PartyPopper size={64} style={{ opacity: 0.5, margin: '0 auto 1.5rem', color: 'var(--status-returned)' }} />
          <h3 style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{isPrivileged ? 'All Clear!' : 'You have no fines!'}</h3>
          <p style={{ fontSize: '1.1rem' }}>{isPrivileged ? 'No fines currently exist in the system.' : 'Keep returning books on time to stay fine-free.'}</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fine Info</th>
                  {/* Member column removed to save horizontal space. Stacked in Fine Info instead. */}
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fines.map(f => {
                  const bookTitle = getBookTitleForFine(f.borrowId);
                  
                  return (
                    <tr key={f._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Late Return: {bookTitle}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {f._id}</div>
                        {isPrivileged && (
                           <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Member: </span>
                             <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary-light)' }}>{userMap[f.memberId] || 'User'}</span>
                           </div>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: f.paid ? 'var(--status-returned)' : 'var(--status-overdue)' }}>
                          ${f.amount.toFixed(2)}
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${f.paid ? 'status-returned' : 'status-overdue'}`}>
                          {f.paid ? 'PAID' : 'UNPAID'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {!f.paid && (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '8px 16px', fontSize: '0.85rem' }} 
                            onClick={() => setSelectedFine(f)}
                          >
                            Pay Fine
                          </button>
                        )}
                        {f.paid && isPrivileged && (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '8px 16px', fontSize: '0.85rem', color: 'var(--status-overdue)', borderColor: 'var(--status-overdue-bg)' }} 
                            onClick={() => handleDelete(f._id)}
                          >
                            Delete Record
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedFine && (
        <PaymentModal
          fine={selectedFine}
          userMap={userMap}
          bookTitle={getBookTitleForFine(selectedFine.borrowId)}
          onClose={() => setSelectedFine(null)}
          onSuccess={() => { setSelectedFine(null); fetchFines(); }}
          apiPay={api.payFine}
        />
      )}
    </div>
  );
}
