import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { BorrowRecord, BorrowStatus } from './entities/borrow.entity';
import { CreateBorrowDto } from './dto/create-borrow.dto';
import { ReturnBorrowDto } from './dto/return-borrow.dto';

@Injectable()
export class BorrowsService {
  constructor(
    private readonly httpService: HttpService,
    @Inject('FINE_SERVICE') private readonly fineClient: ClientProxy,
    @Inject('RESERVATION_SERVICE') private readonly reservationClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  // In-memory data store (replace with a database in production)
  private borrowRecords: BorrowRecord[] = [
    {
      id: 'sample-borrow-001',
      memberId: 'member-001',
      bookId: 'book-001',
      borrowDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-15'),
      status: BorrowStatus.RETURNED,
      returnDate: new Date('2026-03-14'),
      notes: 'Sample returned record',
    },
    {
      id: 'sample-borrow-002',
      memberId: 'member-002',
      bookId: 'book-003',
      borrowDate: new Date('2026-03-10'),
      dueDate: new Date('2026-03-20'),
      status: BorrowStatus.ACTIVE,
      notes: 'Sample active borrow',
    },
    {
      id: 'sample-borrow-003',
      memberId: 'member-001',
      bookId: 'book-005',
      borrowDate: new Date('2026-02-20'),
      dueDate: new Date('2026-03-05'),
      status: BorrowStatus.OVERDUE,
      notes: 'Overdue - member notified',
    },
  ];

  /**
   * Create a new borrow record (borrow a book)
   */
  async create(createBorrowDto: CreateBorrowDto): Promise<BorrowRecord> {
    const { memberId, bookId, loanDurationDays = 14, notes } = createBorrowDto;

    // Synchronous Call: Verify availability in Book Service
    try {
      await firstValueFrom(
        this.httpService.put(`http://localhost:3002/books/${bookId}/availability`, { action: 'borrow' })
      );
    } catch (error) {
      if (error?.response?.status === 404) {
        throw new NotFoundException(`Book with ID "${bookId}" not found in the Library Catalog.`);
      }
      throw new BadRequestException(error?.response?.data?.message || 'Failed to borrow book (Not available).');
    }

    // Check if this book is already borrowed (active borrow)
    const existingActiveBorrow = this.borrowRecords.find(
      (r) => r.bookId === bookId && r.status === BorrowStatus.ACTIVE,
    );
    if (existingActiveBorrow) {
      throw new BadRequestException(
        `Book "${bookId}" is already borrowed. It must be returned before it can be borrowed again.`,
      );
    }

    const borrowDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanDurationDays);

    const newRecord: BorrowRecord = {
      id: uuidv4(),
      memberId,
      bookId,
      borrowDate,
      dueDate,
      status: BorrowStatus.ACTIVE,
      notes,
    };

    this.borrowRecords.push(newRecord);
    return newRecord;
  }

  /**
   * Get all borrow records
   */
  findAll(): BorrowRecord[] {
    this.refreshOverdueStatuses();
    return this.borrowRecords;
  }

  /**
   * Get a single borrow record by ID
   */
  findOne(id: string): BorrowRecord {
    this.refreshOverdueStatuses();
    const record = this.borrowRecords.find((r) => r.id === id);
    if (!record) {
      throw new NotFoundException(`Borrow record with ID "${id}" not found.`);
    }
    return record;
  }

  /**
   * Get all borrow records for a specific member
   */
  findByMember(memberId: string): BorrowRecord[] {
    this.refreshOverdueStatuses();
    return this.borrowRecords.filter((r) => r.memberId === memberId);
  }

  /**
   * Get all borrow records for a specific book
   */
  findByBook(bookId: string): BorrowRecord[] {
    this.refreshOverdueStatuses();
    return this.borrowRecords.filter((r) => r.bookId === bookId);
  }

  /**
   * Return a book — marks the borrow record as RETURNED
   */
  async returnBook(id: string, returnBorrowDto: ReturnBorrowDto): Promise<BorrowRecord> {
    const record = this.findOne(id);

    if (record.status === BorrowStatus.RETURNED) {
      throw new BadRequestException(
        `Borrow record "${id}" has already been returned on ${record.returnDate?.toISOString()}.`,
      );
    }

    // Synchronous Call: Inform Book Service to increment availability
    try {
      await firstValueFrom(
        this.httpService.put(`http://localhost:3002/books/${record.bookId}/availability`, { action: 'return' })
      );
    } catch (error) {
      console.error(`Failed to sync book return with Book Service: ${error.message}`);
    }

    record.returnDate = new Date();
    record.status = BorrowStatus.RETURNED;
    if (returnBorrowDto.notes) {
      record.notes = returnBorrowDto.notes;
    }

    // Publish Asynchronous Event: book.returned
    const payload = {
      borrowId: record.id,
      bookId: record.bookId,
      memberId: record.memberId,
      timestamp: new Date().toISOString()
    };
    this.reservationClient.emit('book.returned', payload);
    this.notificationClient.emit('book.returned', payload);

    return record;
  }

  /**
   * Get borrow statistics summary
   */
  getStats(): {
    total: number;
    active: number;
    returned: number;
    overdue: number;
  } {
    this.refreshOverdueStatuses();
    return {
      total: this.borrowRecords.length,
      active: this.borrowRecords.filter((r) => r.status === BorrowStatus.ACTIVE).length,
      returned: this.borrowRecords.filter((r) => r.status === BorrowStatus.RETURNED).length,
      overdue: this.borrowRecords.filter((r) => r.status === BorrowStatus.OVERDUE).length,
    };
  }

  /**
   * Auto-update ACTIVE records to OVERDUE if past due date
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  refreshOverdueStatuses(): void {
    const now = new Date();
    this.borrowRecords.forEach((record) => {
      if (record.status === BorrowStatus.ACTIVE && record.dueDate < now) {
        record.status = BorrowStatus.OVERDUE;
        
        // Publish Asynchronous Event: book.overdue
        const payload = {
          borrowId: record.id,
          bookId: record.bookId,
          memberId: record.memberId,
          dueDate: record.dueDate.toISOString(),
          timestamp: new Date().toISOString()
        };
        this.fineClient.emit('book.overdue', payload);
        this.notificationClient.emit('book.overdue', payload);
      }
    });
  }
}
