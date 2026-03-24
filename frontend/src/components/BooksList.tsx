import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Book } from '../types';

import { useAuth } from '../context/AuthContext';

export function BooksList() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', genre: '', isbn: '', totalCopies: 5 });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBooks = () => api.getBooks().then(setBooks).finally(() => setLoading(false));

  useEffect(() => { fetchBooks(); }, []);

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
    try {
      await api.deleteBook(id);
      setBooks(books.filter(b => b._id !== id));
    } catch(e: any) { alert(e.message); }
  };

  const handleBorrow = async (id: string) => {
    if (!user) return alert('🔒 Guest Access Restricted\n\nPlease Sign In or Create an Account to checkout library materials.');
    try {
      const userStr = localStorage.getItem('library_user');
      const parsedUser = userStr ? JSON.parse(userStr) : null;
      if (!parsedUser) return alert('User Session Error');
      await api.createBorrow({ memberId: parsedUser.id, bookId: id, loanDurationDays: 14 });
      alert('Borrowed successfully!');
      fetchBooks();
    } catch(e: any) { alert(e.message); }
  };

  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Library <span className="gradient-text">Catalog</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Browse digital shelves and monitor real-time availability</p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'LIBRARIAN') && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ padding: '0 1.5rem', height: '100%', minHeight: '3.5rem', fontSize: '0.95rem' }}>
            <span style={{ fontSize: '1.2rem', marginRight: '4px' }}>＋</span> Add Title
          </button>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Search by title, author, or genre..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: '400px', background: 'var(--bg-card)' }}
        />
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2rem', animation: 'float 2s infinite' }}>📚</div>
          <p style={{ marginTop: '1rem' }}>Loading digital catalog...</p>
        </div>
      ) : (
        <>
          {books.length === 0 ? (
            <div className="glass-card" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1.5rem', opacity: 0.5 }}>📭</div>
              <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No books found in the catalog.</p>
              <p style={{ fontSize: '0.95rem' }}>Add a new book to start building your library.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
              {books.filter(b => 
                b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                b.author.toLowerCase().includes(searchQuery.toLowerCase()) || 
                b.genre.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(book => {
                const isAvail = book.availableCopies > 0;
                return (
                  <div key={book._id} className="glass-card" style={{ 
                    display: 'flex', flexDirection: 'column', padding: 0, margin: 0, overflow: 'hidden', 
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                  }}>
                    {/* Decorative Book Header */}
                    <div style={{ 
                      height: '110px', 
                      background: isAvail ? 'linear-gradient(135deg, var(--primary-light), #E2E8F0)' : 'linear-gradient(135deg, var(--status-overdue-bg), #FDE68A)',
                      padding: '1.5rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}>
                      <div style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))', transform: 'translateY(10px)' }}>
                        {isAvail ? '📘' : '📕'}
                      </div>
                      <span style={{ 
                        padding: '6px 12px', 
                        borderRadius: 'var(--radius-pill)', 
                        fontSize: '0.75rem', 
                        fontWeight: 800,
                        letterSpacing: '0.05em',
                        background: '#FFF',
                        color: isAvail ? 'var(--status-returned)' : 'var(--status-overdue)',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                      }}>
                        {book.availableCopies} / {book.totalCopies} AVAIL
                      </span>
                    </div>

                    <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem', lineHeight: 1.3 }}>
                        {book.title}
                      </h3>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 500 }}>
                        by {book.author}
                      </p>

                      <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'var(--bg-base)', borderRadius: '6px', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {book.genre}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          ID: {book.isbn}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button 
                          className="btn btn-primary" 
                          style={{ flex: 1, padding: '12px', fontSize: '0.9rem', boxShadow: isAvail ? '0 4px 12px var(--primary-glow)' : 'none' }}
                          onClick={() => handleBorrow(book._id)}
                          disabled={!isAvail}
                        >
                          {isAvail ? '🛒 Checkout' : 'Waitlist'}
                        </button>
                        {(user?.role === 'ADMIN' || user?.role === 'LIBRARIAN') && (
                          <button 
                            className="btn btn-outline" 
                            style={{ padding: '0 1rem', borderColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)' }}
                            onClick={() => handleDeleteBook(book._id)}
                            title="Delete Book"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 800 }}>Add New Book</h2>
            <form onSubmit={handleAddBook} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Initial Copies</label>
                  <input className="form-control" type="number" min="1" required value={newBook.totalCopies} onChange={e => setNewBook({...newBook, totalCopies: parseInt(e.target.value) || 1})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>ISBN (Optional)</label>
                  <input className="form-control" value={newBook.isbn} onChange={e => setNewBook({...newBook, isbn: e.target.value})} placeholder="978-..." />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>+ Save to Catalog</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
