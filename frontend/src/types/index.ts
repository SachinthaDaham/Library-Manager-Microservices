export interface BorrowRecord {
  _id: string;
  memberId: string;
  bookId: string;
  borrowDate: string;
  dueDate: string;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  returnDate?: string;
  notes?: string;
}

export interface Book {
  _id: string;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  totalCopies: number;
  availableCopies: number;
}

export interface Fine {
  _id: string;
  memberId: string;
  borrowId: string;
  amount: number;
  overdueDays?: number;
  paid: boolean;
  paidAt?: string;
  createdAt: string;
}

export interface Reservation {
  _id: string;
  memberId: string;
  bookId: string;
  status: 'WAITING' | 'FULFILLED';
  expiresAt?: string;
  createdAt: string;
}

export interface NotificationLog {
  _id: string;
  memberId: string;
  message: string;
  type?: 'INFO' | 'SUCCESS' | 'ALERT' | 'WARNING';
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export type CreateBorrowDto = any;
export type ReturnBorrowDto = any;
