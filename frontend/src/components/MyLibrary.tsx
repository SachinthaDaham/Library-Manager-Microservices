import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { BorrowRecord, Fine } from '../types';
import { useAuth } from '../context/AuthContext';
import { ReturnModal } from './ReturnModal';
import { PaymentModal } from './PaymentModal';
import { BookOpen, RefreshCw, Clock, CheckCircle2, AlertTriangle, CircleDollarSign, Calendar, BarChart3 } from 'lucide-react';

const STATUS_CONFIG = {
  ACTIVE:   { color: '#3B82F6', bg: '#EFF6FF', label: 'Active',   icon: '📗' },
  OVERDUE:  { color: '#EF4444', bg: '#FEF2F2', label: 'Overdue',  icon: '📕' },
  RETURNED: { color: '#10B981', bg: '#F0FDF4', label: 'Returned', icon: '📘' },
};

type StatusFilter = 'ALL' | 'ACTIVE' | 'OVERDUE' | 'RETURNED';

export function MyLibrary() {
  const { user } = useAuth();
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [bookMap, setBookMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [returnTarget, setReturnTarget] = useState<BorrowRecord | null>(null);
  const [payTarget, setPayTarget] = useState<Fine | null>(null);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allBorrows, allFines, allBooks] = await Promise.all([
        api.getBorrows(1, 200),
        api.getFines(),
        api.getBooks(),
      ]);
      const myBorrows = (allBorrows.data || []).filter((b: BorrowRecord) => b.memberId === user.id);
      const myFines  = allFines.filter((f: any) => f.memberId === user.id);
      const bMap: Record<string, string> = {};
      allBooks.forEach((b: any) => { if (b._id) bMap[b._id] = b.title; });
      setBorrows(myBorrows);
      setFines(myFines);
      setBookMap(bMap);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [user]);

  const handleRenew = async (id: string) => {
    try { await api.renewBorrow(id); alert('Loan renewed for 7 more days!'); fetchAll(); }
    catch (e: any) { alert(e.message); }
  };

  const totalActive  = borrows.filter(b => b.status === 'ACTIVE').length;
  const totalOverdue = borrows.filter(b => b.status === 'OVERDUE').length;
  const unpaidFines  = fines.filter(f => !f.paid);
  const totalOwed    = unpaidFines.reduce((s, f) => s + (f.amount || 0), 0);

  const getDaysUntilDue = (dueDate: string) => {
    const ms = new Date(dueDate).getTime() - Date.now();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  };

  const filteredBorrows = useMemo(
    () => filter === 'ALL' ? borrows : borrows.filter(b => b.status === filter),
    [borrows, filter]
  );

  if (loading) return (
    <div className="glass-card" style={{ padding: '5rem', textAlign: 'center' }}>
      <BookOpen size={48} style={{ opacity: 0.4, margin: '0 auto 1rem', animation: 'calmDrift 2s infinite alternate' }} />
      <p style={{ color: 'var(--text-muted)' }}>Loading your library...</p>
    </div>
  );

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookOpen size={36} color="var(--primary)" />
          My <span className="gradient-text">Library</span>
        </h1>
        <p className="dashboard-subtitle">Track your checkouts, due dates, and outstanding fines</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.2rem', marginBottom: '2.5rem' }}>
        <div className="glass-card stat-card-hover" style={{ padding: '1.25rem', margin: 0, borderLeft: '4px solid #3B82F6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Active</p>
              <p className="stat-number" style={{ color: '#3B82F6', fontSize: '2.5rem' }}>{totalActive}</p>
            </div>
            <BookOpen size={28} color="#3B82F6" style={{ opacity: 0.5 }} />
          </div>
        </div>
        <div className="glass-card stat-card-hover" style={{ padding: '1.25rem', margin: 0, borderLeft: '4px solid #EF4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Overdue</p>
              <p className="stat-number" style={{ color: '#EF4444', fontSize: '2.5rem' }}>{totalOverdue}</p>
            </div>
            <AlertTriangle size={28} color="#EF4444" style={{ opacity: 0.5 }} />
          </div>
        </div>
        <div className="glass-card stat-card-hover" style={{ padding: '1.25rem', margin: 0, borderLeft: '4px solid #10B981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Returned</p>
              <p className="stat-number" style={{ color: '#10B981', fontSize: '2.5rem' }}>{borrows.filter(b => b.status === 'RETURNED').length}</p>
            </div>
            <CheckCircle2 size={28} color="#10B981" style={{ opacity: 0.5 }} />
          </div>
        </div>
        <div className="glass-card stat-card-hover" style={{ padding: '1.25rem', margin: 0, borderLeft: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Fines Owed</p>
              <p className="stat-number" style={{ color: '#F59E0B', fontSize: '2rem' }}>${totalOwed.toFixed(2)}</p>
            </div>
            <CircleDollarSign size={28} color="#F59E0B" style={{ opacity: 0.5 }} />
          </div>
        </div>
        <div className="glass-card stat-card-hover" style={{ padding: '1.25rem', margin: 0, borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>Total Borrows</p>
              <p className="stat-number" style={{ color: 'var(--primary)', fontSize: '2.5rem' }}>{borrows.length}</p>
            </div>
            <BarChart3 size={28} color="var(--primary)" style={{ opacity: 0.5 }} />
          </div>
        </div>
      </div>

      {/* Unpaid Fines Banner */}
      {unpaidFines.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', border: '1px solid #FCD34D', borderRadius: 'var(--radius-lg)', padding: '1.2rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="#D97706" />
            <div>
              <p style={{ fontWeight: 800, color: '#92400E', margin: 0 }}>You have {unpaidFines.length} unpaid fine{unpaidFines.length > 1 ? 's' : ''}</p>
              <p style={{ fontSize: '0.85rem', color: '#78350F', margin: 0 }}>Total outstanding: <strong>${totalOwed.toFixed(2)}</strong> — Pay to restore full borrowing privileges</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.7rem' }}>
            {unpaidFines.slice(0, 3).map(fine => (
              <button key={fine._id} className="btn" onClick={() => setPayTarget(fine)}
                style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700, background: '#D97706', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Pay ${fine.amount?.toFixed(2)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {(['ALL', 'ACTIVE', 'OVERDUE', 'RETURNED'] as StatusFilter[]).map(f => (
          <button key={f}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.4rem 1.2rem', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', fontWeight: 700, background: filter === f ? '' : '#fff', minWidth: '90px' }}
            onClick={() => setFilter(f)}>
            {f === 'ALL' ? `All (${borrows.length})` :
             f === 'ACTIVE' ? `📗 Active (${totalActive})` :
             f === 'OVERDUE' ? `📕 Overdue (${totalOverdue})` :
             `📘 Returned (${borrows.filter(b => b.status === 'RETURNED').length})`}
          </button>
        ))}
      </div>

      {/* Borrows List */}
      {filteredBorrows.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
          <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>No {filter !== 'ALL' ? filter.toLowerCase() : ''} books</p>
          <p style={{ fontSize: '0.9rem' }}>Head to the Library Catalog to checkout a book!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredBorrows.map(borrow => {
            const cfg = STATUS_CONFIG[borrow.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.ACTIVE;
            const daysLeft = getDaysUntilDue(borrow.dueDate);
            const isUrgent = borrow.status === 'ACTIVE' && daysLeft <= 3 && daysLeft > 0;
            return (
              <div key={borrow._id} className="glass-card" style={{ margin: 0, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', borderLeft: `4px solid ${cfg.color}`, transition: 'transform 0.15s', cursor: 'default' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateX(4px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateX(0)')}>

                {/* Emoji Icon */}
                <div style={{ fontSize: '2rem', flexShrink: 0 }}>{cfg.icon}</div>

                {/* Book Info */}
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <p style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0, marginBottom: '4px' }}>
                    {bookMap[borrow.bookId] || 'Unknown Title'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', padding: '2px 10px', borderRadius: '100px', background: cfg.bg, color: cfg.color, fontWeight: 700 }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      Borrowed: {new Date(borrow.borrowDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Due Date */}
                <div style={{ textAlign: 'center', minWidth: '120px' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', margin: 0, marginBottom: '4px' }}>
                    {borrow.status === 'RETURNED' ? 'Returned' : 'Due Date'}
                  </p>
                  <p style={{ fontWeight: 800, fontSize: '0.95rem', color: borrow.status === 'OVERDUE' ? '#EF4444' : isUrgent ? '#F59E0B' : 'var(--text-primary)', margin: 0 }}>
                    {borrow.status === 'RETURNED' && borrow.returnDate
                      ? new Date(borrow.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : new Date(borrow.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {borrow.status === 'ACTIVE' && (
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: 0, marginTop: '2px', color: daysLeft < 0 ? '#EF4444' : isUrgent ? '#F59E0B' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                      <Clock size={11} />
                      {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today!' : `${daysLeft}d left`}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
                  {borrow.status === 'ACTIVE' && (
                    <>
                      <button className="btn btn-outline"
                        style={{ padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => handleRenew(borrow._id)}>
                        <RefreshCw size={14} /> Renew
                      </button>
                      <button className="btn btn-primary"
                        style={{ padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => setReturnTarget(borrow)}>
                        <CheckCircle2 size={14} /> Return
                      </button>
                    </>
                  )}
                  {borrow.status === 'OVERDUE' && (
                    <button className="btn"
                      style={{ padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700, background: '#EF4444', color: '#fff', border: 'none', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => setReturnTarget(borrow)}>
                      <CheckCircle2 size={14} /> Return Now
                    </button>
                  )}
                  {borrow.status === 'RETURNED' && (
                    <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={14} /> Done
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {returnTarget && <ReturnModal borrow={returnTarget} onClose={() => { setReturnTarget(null); fetchAll(); }} />}
      {payTarget && <PaymentModal fine={payTarget} onClose={() => { setPayTarget(null); fetchAll(); }} />}
    </div>
  );
}
