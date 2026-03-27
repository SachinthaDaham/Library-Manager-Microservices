import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import type { Book } from '../types';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, BookOpen, Hash, User, Trash2, Library, Filter, Clock, Star, TrendingUp } from 'lucide-react';
import { BorrowModal } from './BorrowModal';

export function BooksList() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', genre: '', isbn: '', totalCopies: 5 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  
  const [showReviewModal, setShowReviewModal] = useState<Book | null>(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [adminCheckoutBook, setAdminCheckoutBook] = useState<Book | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await api.getBookSearch(searchQuery, selectedGenre);
      setBooks(data);
    } catch (err) {
      console.error('Failed to fetch books', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    const timeoutId = setTimeout(() => {
      fetchBooks();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedGenre]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBook(newBook);
      fetchBooks();
      setShowAddModal(false);
      setNewBook({ title: '', author: '', genre: '', isbn: '', totalCopies: 5 });
    } catch(err: any) { alert(err.message); }
  };

  const handleDeleteBook = async (id: string) => {
    if (!window.confirm('Delete this book from the catalog?')) return;
    try {
      await api.deleteBook(id);
      setBooks(books.filter(b => b._id !== id));
    } catch(e: any) { alert(e.message); }
  };

  const handleBorrow = async (book: Book) => {
    if (!user) return alert('🔒 Guest Access Restricted\n\nPlease Sign In or Create an Account to checkout library materials.');
    
    // Admins issuing a book physically to a user at the desk
    if (user.role === 'ADMIN' || user.role === 'LIBRARIAN') {
      setAdminCheckoutBook(book);
      return;
    }

    // Members checking out to themselves digitally
    try {
      await api.createBorrow({ memberId: user.id, bookId: book._id, loanDurationDays: 14 });
      alert('Borrowed successfully!');
      fetchBooks();
    } catch(e: any) { alert(e.message); }
  };

  const handleReserve = async (id: string) => {
    if (!user) return alert('🔒 Guest Access Restricted\\n\\nPlease Sign In or Create an Account to reserve materials.');
    try {
      await api.createReservation({ memberId: user.id, bookId: id });
      alert('Successfully joined the waitlist! You will be notified when a copy is available.');
    } catch(e: any) { alert(e.message); }
  };

  const allGenres = useMemo(() => {
    const genres = new Set(books.map(b => b.genre).filter(Boolean));
    return Array.from(genres);
  }, [books]);

  const trendingBooks = useMemo(() => {
    if (searchQuery || selectedGenre) return []; // Hide trending when filtering
    return [...books]
      .sort((a, b) => (b.totalCopies - b.availableCopies) - (a.totalCopies - a.availableCopies))
      .filter(b => (b.totalCopies - b.availableCopies) > 0)
      .slice(0, 3);
  }, [books, searchQuery, selectedGenre]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Please sign in to leave a review.');
    try {
      await api.addBookReview(showReviewModal!._id, { memberId: user.id, ...reviewForm });
      alert('Review submitted successfully!');
      setShowReviewModal(null);
      setReviewForm({ rating: 5, comment: '' });
      fetchBooks();
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Library size={36} color="var(--primary)" />
            Library <span className="gradient-text">Catalog</span>
          </h1>
          <p className="dashboard-subtitle">Browse digital shelves and monitor real-time availability</p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'LIBRARIAN') && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ padding: '0 1.5rem', height: '100%', minHeight: '3.5rem' }}>
            <Plus size={20} style={{ marginRight: '6px' }} /> Add Title
          </button>
        )}
      </div>

      {/* ─── Search & Filters ─── */}
      <div className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            style={{ paddingLeft: '48px', width: '100%', background: '#fff' }}
            placeholder="Search by title, author, or ISBN..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <Filter size={16} style={{ marginRight: '6px' }} /> Genres:
          </div>
          <button 
            className={`btn ${selectedGenre === '' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem', borderRadius: 'var(--radius-pill)', flexShrink: 0 }}
            onClick={() => setSelectedGenre('')}
          >
            All
          </button>
          {allGenres.map(g => (
            <button 
              key={g}
              className={`btn ${selectedGenre === g ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem', borderRadius: 'var(--radius-pill)', flexShrink: 0, background: selectedGenre === g ? '' : '#fff' }}
              onClick={() => setSelectedGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={64} style={{ opacity: 0.5, margin: '0 auto 1.5rem', animation: 'calmDrift 3s infinite alternate' }} />
          <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Searching the archives...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="glass-card" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Library size={64} style={{ opacity: 0.3, margin: '0 auto 1.5rem' }} />
          <p style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No books found</p>
          <p style={{ fontSize: '1rem' }}>Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <>
          {trendingBooks.length > 0 && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--primary)" /> Trending Now
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {trendingBooks.map(book => (
                  <div key={`trend-${book._id}`} className="glass-card stat-card-hover" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem', margin: 0, border: '1px solid rgba(67, 97, 238, 0.15)', background: 'linear-gradient(145deg, #ffffff, #f8faff)' }}>
                    <div style={{ width: '48px', height: '64px', background: 'var(--primary-light)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                      🔥
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{book.title}</h4>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{book.author}</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {book.totalCopies - book.availableCopies} checkouts this week
                      </div>
                    </div>
                    <button className="btn btn-outline" style={{ padding: '8px', borderRadius: '50%' }} onClick={() => setShowReviewModal(book)} title="Quick View & Reviews">
                      <Star size={16} color="var(--primary)" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {books.map(book => {
            const isAvail = book.availableCopies > 0;
            return (
              <div key={book._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', margin: 0 }}>
                {/* Decorative Header */}
                <div style={{ 
                  height: '130px', 
                  background: isAvail ? 'linear-gradient(135deg, var(--primary-light), #E2E8F0)' : 'linear-gradient(135deg, var(--status-overdue-bg), #FDE68A)',
                  padding: '1.5rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    position: 'absolute', right: '-20px', top: '-20px', width: '120px', height: '120px', 
                    borderRadius: '50%', background: isAvail ? 'var(--accent)' : 'var(--status-overdue)', 
                    filter: 'blur(40px)', opacity: 0.3 
                  }} />
                  
                  <div style={{ width: '48px', height: '64px', background: '#fff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', zIndex: 1 }}>
                    {isAvail ? '📘' : '📕'}
                  </div>
                  
                  <div className={`badge ${isAvail ? 'status-returned' : 'status-overdue'}`} style={{ zIndex: 1, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isAvail ? 'var(--status-returned)' : 'var(--status-overdue)', marginRight: '6px' }} />
                    {book.availableCopies} / {book.totalCopies} AVAIL
                  </div>
                </div>

                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
                    {book.title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                    <User size={14} style={{ marginRight: '6px' }} /> {book.author}
                  </div>

                  {/* Rating UI */}
                  <div 
                    style={{ display: 'flex', alignItems: 'center', gap: '2px', marginBottom: '1.2rem', cursor: 'pointer', opacity: 0.9, transition: 'opacity 0.2s' }} 
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
                    onClick={() => setShowReviewModal(book)}
                    title="Click to read or write reviews"
                  >
                    {[1, 2, 3, 4, 5].map(star => {
                        const isFilled = book.averageRating ? star <= Math.round(book.averageRating) : false;
                        return <Star key={star} size={14} fill={isFilled ? '#FBBF24' : 'transparent'} color={isFilled ? '#FBBF24' : '#CBD5E1'} />;
                    })}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 600 }}>
                      {book.averageRating ? book.averageRating.toFixed(1) : 'New'} ({book.reviewCount || 0})
                    </span>
                  </div>

                  {book.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.2rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {book.description}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', background: 'var(--bg-base)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, border: '1px solid var(--border)' }}>
                      <Hash size={12} style={{ marginRight: '4px', opacity: 0.6 }} /> {book.genre}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', background: 'var(--bg-base)', padding: '4px 8px', borderRadius: '4px' }}>
                      ISBN: {book.isbn || 'N/A'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button 
                      className={`btn ${isAvail ? 'btn-primary' : 'btn-outline'}`} 
                      style={{ flex: 1, padding: '12px', fontSize: '0.9rem', color: isAvail ? '' : 'var(--text-primary)', border: isAvail ? 'none' : '1px solid var(--border)', background: isAvail ? '' : '#f8f9fa' }}
                      onClick={() => isAvail ? handleBorrow(book) : handleReserve(book._id)}
                    >
                      {isAvail ? <><BookOpen size={16} /> Checkout Book</> : <><Clock size={16} /> Join Waitlist</>}
                    </button>
                    {(user?.role === 'ADMIN' || user?.role === 'LIBRARIAN') && (
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '0 1rem', borderColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)' }}
                        onClick={() => handleDeleteBook(book._id)}
                        title="Remove from Catalog"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <BookOpen size={24} color="var(--primary)" style={{ marginRight: '12px' }} />
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Add New Book</h2>
            </div>
            
            <form onSubmit={handleAddBook}>
              <div className="form-group">
                <label>Book Title</label>
                <input className="form-control" required value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} placeholder="E.g. Clean Code" />
              </div>
              
              <div className="form-group">
                <label>Author</label>
                <input className="form-control" required value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} placeholder="E.g. Robert C. Martin" />
              </div>
              
              <div className="form-group">
                <label>Genre</label>
                <input className="form-control" required value={newBook.genre} onChange={e => setNewBook({...newBook, genre: e.target.value})} placeholder="E.g. Software Engineering" />
              </div>
              
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Initial Copies</label>
                  <input className="form-control" type="number" min="1" required value={newBook.totalCopies} onChange={e => setNewBook({...newBook, totalCopies: parseInt(e.target.value) || 1})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>ISBN (Optional)</label>
                  <input className="form-control" value={newBook.isbn} onChange={e => setNewBook({...newBook, isbn: e.target.value})} placeholder="978-..." style={{ fontFamily: 'monospace' }} />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '12px' }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                  <Plus size={18} /> Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <Star size={24} color="#FBBF24" fill="#FBBF24" style={{ marginRight: '12px' }} />
              <div>
                <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>Review {showReviewModal.title}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, marginTop: '4px' }}>Share your thoughts on this book</p>
              </div>
            </div>
            
            <form onSubmit={handleSubmitReview}>
              <div className="form-group" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 700 }}>Your Rating</label>
                <div style={{ display: 'inline-flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star} 
                      size={36} 
                      style={{ cursor: 'pointer', transition: 'transform 0.1s' }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      fill={star <= reviewForm.rating ? '#FBBF24' : 'transparent'} 
                      color={star <= reviewForm.rating ? '#FBBF24' : '#CBD5E1'} 
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    />
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label>Written Review (Optional)</label>
                <textarea 
                  className="form-control" 
                  rows={4} 
                  value={reviewForm.comment} 
                  onChange={e => setReviewForm({...reviewForm, comment: e.target.value})} 
                  placeholder="What did you like or dislike about this book?" 
                  style={{ resize: 'vertical' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '12px' }} onClick={() => setShowReviewModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px', background: '#FBBF24', color: '#fff', border: 'none' }}>
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Quick Checkout Modal */}
      {adminCheckoutBook && (
        <BorrowModal 
          prefilledBookId={adminCheckoutBook._id}
          prefilledBookTitle={adminCheckoutBook.title}
          onClose={() => setAdminCheckoutBook(null)}
          onSuccess={() => { setAdminCheckoutBook(null); fetchBooks(); }}
        />
      )}
    </div>
  );
}
