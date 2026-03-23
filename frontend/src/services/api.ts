import type { BorrowRecord, CreateBorrowDto, ReturnBorrowDto, Book, Fine, Reservation, NotificationLog } from '../types';

const GATEWAY_URL = 'http://localhost:3000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('library_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // --- BORROWS ---
  async getBorrows(): Promise<BorrowRecord[]> {
    const res = await fetch(`${GATEWAY_URL}/borrows`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch borrows');
    return res.json();
  },

  async getStats(): Promise<{ total: number; active: number; returned: number; overdue: number }> {
    const res = await fetch(`${GATEWAY_URL}/borrows/stats`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async createBorrow(data: CreateBorrowDto): Promise<BorrowRecord> {
    const res = await fetch(`${GATEWAY_URL}/borrows`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to borrow book');
    }
    return res.json();
  },

  async returnBook(id: string, data: ReturnBorrowDto): Promise<BorrowRecord> {
    const res = await fetch(`${GATEWAY_URL}/borrows/${id}/return`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to return book');
    }
    return res.json();
  },

  // --- BOOKS ---
  async getBooks(): Promise<Book[]> {
    const res = await fetch(`${GATEWAY_URL}/books`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch books');
    return res.json();
  },

  async createBook(data: Partial<Book>): Promise<Book> {
    const res = await fetch(`${GATEWAY_URL}/books`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create book');
    return res.json();
  },

  async updateBook(id: string, data: Partial<Book>): Promise<Book> {
    const res = await fetch(`${GATEWAY_URL}/books/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update book');
    return res.json();
  },

  async deleteBook(id: string): Promise<void> {
    const res = await fetch(`${GATEWAY_URL}/books/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to delete book');
  },

  // --- FINES ---
  async getFines(): Promise<Fine[]> {
    const res = await fetch(`${GATEWAY_URL}/fines`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch fines');
    return res.json();
  },

  async payFine(id: string): Promise<Fine> {
    const res = await fetch(`${GATEWAY_URL}/fines/${id}/pay`, { method: 'PUT', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to pay fine');
    return res.json();
  },

  async deleteFine(id: string): Promise<void> {
    const res = await fetch(`${GATEWAY_URL}/fines/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to delete fine');
  },

  // --- RESERVATIONS ---
  async getReservations(): Promise<Reservation[]> {
    const res = await fetch(`${GATEWAY_URL}/reservations`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch reservations');
    return res.json();
  },

  async createReservation(data: { memberId: string; bookId: string }): Promise<Reservation> {
    const res = await fetch(`${GATEWAY_URL}/reservations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to reserve book');
    return res.json();
  },

  async cancelReservation(id: string): Promise<void> {
    const res = await fetch(`${GATEWAY_URL}/reservations/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to cancel reservation');
  },

  // --- NOTIFICATIONS ---
  async getNotifications(): Promise<NotificationLog[]> {
    const res = await fetch(`${GATEWAY_URL}/notifications`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<NotificationLog> {
    const res = await fetch(`${GATEWAY_URL}/notifications/${id}/read`, { method: 'PUT', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to mark read');
    return res.json();
  },

  async deleteNotification(id: string): Promise<void> {
    const res = await fetch(`${GATEWAY_URL}/notifications/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to delete notification');
  },
};
