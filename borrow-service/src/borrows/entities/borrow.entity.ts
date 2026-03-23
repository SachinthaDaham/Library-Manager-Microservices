export enum BorrowStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
}

export class BorrowRecord {
  id: string;
  memberId: string;
  bookId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: BorrowStatus;
  notes?: string;
}
