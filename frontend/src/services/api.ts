import type { BorrowRecord, CreateBorrowDto, ReturnBorrowDto, Book, Fine, Reservation, NotificationLog } from '../types';

const GATEWAY_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('library_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const logActivity = async (message: string, type: 'INFO' | 'SUCCESS' | 'ALERT' | 'WARNING' = 'INFO', metadata: any = {}) => {
  try {
    const userStr = localStorage.getItem('library_user');
    const user = userStr ? JSON.parse(userStr) : null;
    await fetch(`${GATEWAY_URL}/notifications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ memberId: user?.id || 'SYSTEM', message, type, metadata }),
    });
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
};

export const api = {
  // --- USERS ---
  async getUsers(): Promise<any[]> {
    const res = await fetch(`${GATEWAY_URL}/auth/users`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async getUserById(id: string): Promise<any> {
    const res = await fetch(`${GATEWAY_URL}/auth/users/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  async updateUser(id: string, data: { name?: string; role?: string; penaltyPoints?: number }): Promise<any> {
    const res = await fetch(`${GATEWAY_URL}/auth/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update user');
    return res.json();
  },

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`${GATEWAY_URL}/auth/users/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to delete user');
  },

  // --- BORROWS ---
  async getBorrows(page: number = 1, limit: number = 20): Promise<{ data: BorrowRecord[], meta: any }> {
    const res = await fetch(`${GATEWAY_URL}/borrows?page=${page}&limit=${limit}`, { headers: getAuthHeaders() });
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
    const result = await res.json();
    logActivity(`A new checkout was processed for Book ${data.bookId}.`, 'INFO', { bookId: data.bookId, memberId: data.memberId });
    return result;
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

  async renewBorrow(id: string): Promise<BorrowRecord> {
    const res = await fetch(`${GATEWAY_URL}/borrows/${id}/renew`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Renewal Failed');
    }
    const result = await res.json();
    logActivity(`A 7-day loan extension was successfully processed.`, 'SUCCESS', { borrowId: id });
    return result;
  },

  // --- BOOKS ---
  async getBooks(): Promise<Book[]> {
    const res = await fetch(`${GATEWAY_URL}/books`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch books');
    return res.json();
  },

  async getBookSearch(q?: string, genre?: string): Promise<Book[]> {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (genre) params.append('genre', genre);
    const res = await fetch(`${GATEWAY_URL}/books/search?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to search books');
    return res.json();
  },

  async createBook(data: Partial<Book>): Promise<Book> {
    const res = await fetch(`${GATEWAY_URL}/books`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create book');
    const result = await res.json();
    logActivity(`A new book "${data.title}" was added to the library catalog.`, 'SUCCESS', { bookId: result._id });
    return result;
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
    logActivity(`Book with ID ${id} was permanently removed from the catalog.`, 'WARNING', { bookId: id });
  },

  // --- FINES ---
  async createFine(data: { memberId: string; borrowId: string }): Promise<Fine> {
    const res = await fetch(`${GATEWAY_URL}/fines`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create fine');
    const result = await res.json();
    logActivity(`A manual system fine was applied.`, 'ALERT', { borrowId: data.borrowId, memberId: data.memberId });
    return result;
  },

  async getFines(): Promise<Fine[]> {
    const res = await fetch(`${GATEWAY_URL}/fines`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch fines');
    return res.json();
  },

  async getFinesByMember(memberId: string): Promise<Fine[]> {
    const res = await fetch(`${GATEWAY_URL}/fines/member/${memberId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch fines');
    return res.json();
  },

  async getFineStats(): Promise<{ totalUnpaid: number, totalPaid: number, outstandingBalance: number }> {
    const res = await fetch(`${GATEWAY_URL}/fines/stats`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch fine stats');
    return res.json();
  },

  async payFine(id: string): Promise<Fine> {
    const res = await fetch(`${GATEWAY_URL}/fines/${id}/pay`, { method: 'PUT', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to pay fine');
    const result = await res.json();
    logActivity(`System fine was successfully paid off.`, 'SUCCESS', { memberId: result.memberId });
    return result;
  },

  async deleteFine(id: string): Promise<void> {
    const res = await fetch(`${GATEWAY_URL}/fines/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to delete fine');
    logActivity(`A manual system fine record was deleted.`, 'WARNING');
  },

  // --- RESERVATIONS ---
  async getReservations(): Promise<Reservation[]> {
    const res = await fetch(`${GATEWAY_URL}/reservations`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch reservations');
    return res.json();
  },

  async getQueueForBook(bookId: string): Promise<Reservation[]> {
    const res = await fetch(`${GATEWAY_URL}/reservations/book/${bookId}/queue`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch reservation queue');
    return res.json();
  },

  async createReservation(data: { memberId: string; bookId: string }): Promise<Reservation> {
    const res = await fetch(`${GATEWAY_URL}/reservations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to reserve book');
    const result = await res.json();
    logActivity(`A hold was successfully placed for Book ${data.bookId}.`, 'INFO', { bookId: data.bookId, memberId: data.memberId });
    return result;
  },

  async fulfillReservation(id: string): Promise<Reservation> {
    const res = await fetch(`${GATEWAY_URL}/reservations/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: 'FULFILLED' }),
    });
    if (!res.ok) throw new Error('Failed to fulfill reservation');
    const result = await res.json();
    logActivity(`Hold Queue reservation was manually fulfilled. Ready for pickup!`, 'SUCCESS', { bookId: result.bookId, memberId: result.memberId });
    return result;
  },

  async cancelReservation(id: string): Promise<void> {
    const res = await fetch(`${GATEWAY_URL}/reservations/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to cancel reservation');
    logActivity(`A hold reservation in the queue was cancelled.`, 'WARNING');
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

