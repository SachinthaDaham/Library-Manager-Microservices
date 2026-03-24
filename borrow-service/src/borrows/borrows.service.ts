import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Borrow, BorrowStatus } from './borrow.schema';
import { CreateBorrowDto } from './dto/create-borrow.dto';
import { ReturnBorrowDto } from './dto/return-borrow.dto';

@Injectable()
export class BorrowsService {
  constructor(
    @InjectModel(Borrow.name) private borrowModel: Model<Borrow>,
    private readonly httpService: HttpService,
    @Inject('FINE_SERVICE') private readonly fineClient: ClientProxy,
    @Inject('RESERVATION_SERVICE') private readonly reservationClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  // Removed in-memory data store

  /**
   * Create a new borrow record (borrow a book)
   */
  async create(createBorrowDto: CreateBorrowDto): Promise<Borrow> {
    const { memberId, bookId, loanDurationDays = 14, notes } = createBorrowDto;

    // Check availability
    try {
      await firstValueFrom(this.httpService.put(`http://localhost:3002/books/${bookId}/availability`, { action: 'borrow' }));
    } catch (e: any) {
      if (e?.response?.status === 404) throw new NotFoundException('Book not found in Catalog.');
      throw new BadRequestException(e?.response?.data?.message || 'Failed to borrow');
    }

    const existingActiveBorrow = await this.borrowModel.findOne({ bookId, status: BorrowStatus.ACTIVE });
    if (existingActiveBorrow) {
      throw new BadRequestException(`Book "${bookId}" is already borrowed.`);
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanDurationDays);

    const newRecord = new this.borrowModel({ memberId, bookId, dueDate, notes });
    return newRecord.save();
  }

  /**
   * Get all borrow records
   */
  async findAll(): Promise<Borrow[]> {
    this.refreshOverdueStatuses();
    return this.borrowModel.find().exec();
  }

  async findOne(id: string): Promise<Borrow> {
    const record = await this.borrowModel.findById(id);
    if (!record) throw new NotFoundException(`Record ${id} not found.`);
    return record;
  }

  async findByMember(memberId: string): Promise<Borrow[]> {
    return this.borrowModel.find({ memberId }).exec();
  }

  async findByBook(bookId: string): Promise<Borrow[]> {
    return this.borrowModel.find({ bookId }).exec();
  }

  /**
   * Return a book — marks the borrow record as RETURNED
   */
  async returnBook(id: string, returnBorrowDto: ReturnBorrowDto): Promise<Borrow> {
    const record = await this.findOne(id);

    if (record.status === BorrowStatus.RETURNED) {
      throw new BadRequestException(`Borrow record has already been returned.`);
    }

    // Sync return with Book Service
    try {
      await firstValueFrom(this.httpService.put(`http://localhost:3002/books/${record.bookId}/availability`, { action: 'return' }));
    } catch (error: any) {
      console.error(`Failed to sync book return: ${error.message}`);
    }

    const wasOverdue = record.status === BorrowStatus.OVERDUE || new Date() > record.dueDate;

    record.returnDate = new Date();
    record.status = BorrowStatus.RETURNED;
    if (returnBorrowDto.notes) record.notes = returnBorrowDto.notes;
    
    await record.save();

    // Auto-generate a fine if the returned book was overdue
    if (wasOverdue) {
      try {
        const now = new Date();
        const overdueDays = Math.max(
          1,
          Math.ceil((now.getTime() - record.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
        );
        const fineRes = await fetch('http://localhost:3004/fines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: record.memberId,
            borrowId: String(record._id),
            overdueDays,
          }),
        });
        if (!fineRes.ok) {
          const errBody = await fineRes.json().catch(() => ({}));
          console.warn(`Fine-service rejected auto-fine: ${errBody?.message}`);
        } else {
          console.log(`Auto-fine created for borrow ${record._id} (${overdueDays} days overdue)`);
        }
      } catch (err) {
        console.error('Failed to auto-generate fine on return', err);
      }
    }

    // Event Publish
    const payload = { borrowId: record._id, bookId: record.bookId, memberId: record.memberId, timestamp: new Date().toISOString() };
    this.reservationClient.emit('book.returned', payload);
    this.notificationClient.emit('book.returned', payload);

    return record;
  }

  /**
   * Get borrow statistics summary
   */
  async getStats() {
    this.refreshOverdueStatuses();
    const [total, active, returned, overdue] = await Promise.all([
      this.borrowModel.countDocuments(),
      this.borrowModel.countDocuments({ status: BorrowStatus.ACTIVE }),
      this.borrowModel.countDocuments({ status: BorrowStatus.RETURNED }),
      this.borrowModel.countDocuments({ status: BorrowStatus.OVERDUE }),
    ]);

    return { total, active, returned, overdue };
  }

  /**
   * Auto-update ACTIVE records to OVERDUE if past due date
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async refreshOverdueStatuses(): Promise<void> {
    const now = new Date();
    const overdueRecords = await this.borrowModel.find({ status: BorrowStatus.ACTIVE, dueDate: { $lt: now } });
    
    for (const record of overdueRecords) {
        record.status = BorrowStatus.OVERDUE;
        await record.save();

        const payload = { borrowId: record._id, bookId: record.bookId, memberId: record.memberId, dueDate: record.dueDate.toISOString(), timestamp: new Date().toISOString() };
        this.fineClient.emit('book.overdue', payload);
        this.notificationClient.emit('book.overdue', payload);
    }
  }
}
