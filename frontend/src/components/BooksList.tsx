import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Book } from '../types';

export function BooksList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', genre: '', isbn: '', totalCopies: 5 });

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
    try {
      const userStr = localStorage.getItem('library_user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) return alert('User Session Error');
      await api.createBorrow({ memberId: user.id, bookId: id, loanDurationDays: 14 });
      alert('Borrowed successfully!');
      fetchBooks();
    } catch(e: any) { alert(e.message); }
  };

  if (loading) return <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>Loading Library Catalog...</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="dashboard-title">Library Catalog 📖</h1>
          <p className="dashboard-subtitle">Browse all books and check real-time availability sync</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add New Book</button>
      </header>

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>Add New Book</h2>
            <form onSubmit={handleAddBook} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Book Title</label>
                <input className="form-input" required value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} placeholder="E.g. Clean Code" />
              </div>
              <div>
                <label className="form-label">Author</label>
                <input className="form-input" required value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} placeholder="E.g. Robert C. Martin" />
              </div>
              <div>
                <label className="form-label">Genre</label>
                <input className="form-input" required value={newBook.genre} onChange={e => setNewBook({...newBook, genre: e.target.value})} placeholder="E.g. Software Engineering" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">ISBN</label>
                  <input className="form-input" required value={newBook.isbn} onChange={e => setNewBook({...newBook, isbn: e.target.value})} placeholder="978-..." />
                </div>
                <div style={{ width: '100px' }}>
                  <label className="form-label">Copies</label>
                  <input className="form-input" type="number" min="1" required value={newBook.totalCopies} onChange={e => setNewBook({...newBook, totalCopies: parseInt(e.target.value) || 1})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {books.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No books found in the catalog.
          </div>
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {books.map(book => (
          <div key={book._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', transition: 'all 0.3s ease' }}>
            <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{book.title}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>by {book.author} • {book.genre}</div>
            <div style={{ marginTop: 'auto', display: 'flex', borderTop: '1px solid var(--border)', paddingTop: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ISBN: {book.isbn}</span>
              <span style={{ 
                padding: '0.35rem 0.85rem', 
                borderRadius: '100px', 
                fontSize: '0.75rem', 
                fontWeight: 700,
                letterSpacing: '0.05em',
                background: book.availableCopies > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: book.availableCopies > 0 ? 'var(--status-returned)' : 'var(--status-overdue)',
                border: `1px solid ${book.availableCopies > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}>
                {book.availableCopies} / {book.totalCopies} AVAIL
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-outline" 
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                onClick={() => handleBorrow(book._id)}
                disabled={book.availableCopies === 0}
              >
                Checkout
              </button>
              <button 
                className="btn" 
                style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#F43F5E', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '0.5rem 1rem' }}
                onClick={() => handleDeleteBook(book._id)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
