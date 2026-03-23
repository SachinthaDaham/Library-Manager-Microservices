export interface BorrowRecord {
  id: string;
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
  paid: boolean;
  createdAt: string;
}

export interface Reservation {
  _id: string;
  memberId: string;
  bookId: string;
  status: 'WAITING' | 'FULFILLED';
  createdAt: string;
}

export interface NotificationLog {
  _id: string;
  memberId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export type CreateBorrowDto = any;
export type ReturnBorrowDto = any;
