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

    // 1. Double Checkout Check
    const existingActiveBorrow = await this.borrowModel.findOne({ bookId, memberId, status: BorrowStatus.ACTIVE });
    if (existingActiveBorrow) {
      throw new BadRequestException(`You are already currently borrowing this book.`);
    }

    // 2. Penalty Point check via Auth Service
    try {
      const userRes = await firstValueFrom(this.httpService.get(`http://auth-service:3007/auth/users/${memberId}/penalty-status`));
      const penaltyPoints = userRes.data.penaltyPoints;
      if (penaltyPoints >= 3) {
        throw new BadRequestException('Account restricted: You have reached the maximum penalty points (3). Please pay your outstanding fines to restore borrowing privileges.');
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      console.error(`Failed to verify user penalty status: ${e.message}`);
    }

    // 3. Enterprise Reservation & Inventory Check
    try {
      const bookRes = await firstValueFrom(this.httpService.get(`http://book-service:3002/books/${bookId}`));
      const book = bookRes.data;

      if (book.availableCopies <= 0) {
        throw new BadRequestException('No copies available. Please reserve the book to join the Hold Queue.');
      }

      // Check active fulfilled holds for this book
      const holdsRes = await firstValueFrom(this.httpService.get(`http://reservation-service:3005/reservations/book/${bookId}/holds`));
      const activeHolds = holdsRes.data || [];
      const userHasHold = activeHolds.some((h: any) => h.memberId === memberId);

      if (userHasHold) {
        // Automatically consume their hold ticket since they are checking it out
        await firstValueFrom(this.httpService.delete(`http://reservation-service:3005/reservations/book/${bookId}/member/${memberId}/consume`));
      } else {
        // They don't have a hold. Are there enough unreserved copies floating around?
        const totalReservedCopies = activeHolds.length;
        if (book.availableCopies <= totalReservedCopies) {
          throw new BadRequestException('All currently available copies are reserved for members in the Hold Queue.');
        }
      }

      // 4. Physically checkout the copy from Catalog
      await firstValueFrom(this.httpService.put(`http://book-service:3002/books/${bookId}/availability`, { action: 'borrow' }));
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      if (e?.response?.status === 404) throw new NotFoundException('Book not found in Catalog.');
      if (e?.response?.data?.message) throw new BadRequestException(e.response.data.message);
      throw new BadRequestException('Failed to process checkout logic via microservices');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + loanDurationDays);

    const newRecord = new this.borrowModel({ memberId, bookId, dueDate, notes });
    return newRecord.save();
  }

  /**
   * Get all borrow records (Paginated)
   */
  async findAll(page: number = 1, limit: number = 20) {
    this.refreshOverdueStatuses();
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.borrowModel.find().sort({ dueDate: 1 }).skip(skip).limit(limit).exec(),
      this.borrowModel.countDocuments()
    ]);
    
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
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

    // Sync return with Book Service and get Book Title for event logs
    let bookTitle = record.bookId;
    try {
      const bookRes = await firstValueFrom(this.httpService.get(`http://book-service:3002/books/${record.bookId}`));
      if (bookRes.data?.title) bookTitle = bookRes.data.title;
      
      await firstValueFrom(this.httpService.put(`http://book-service:3002/books/${record.bookId}/availability`, { action: 'return' }));
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
        
        await firstValueFrom(
          this.httpService.post('http://fine-service:3004/fines', {
            memberId: record.memberId,
            borrowId: String(record._id),
            overdueDays,
          })
        );
        console.log(`Auto-fine created for borrow ${record._id} (${overdueDays} days overdue)`);
      } catch (err: any) {
        console.error('Failed to auto-generate fine on return', err?.response?.data || err.message);
      }
    }

    // Event Publish
    const payload = { borrowId: record._id, bookId: record.bookId, bookTitle, memberId: record.memberId, timestamp: new Date().toISOString() };
    this.reservationClient.emit('book.returned', payload);
    this.notificationClient.emit('book.returned', payload);

    return record;
  }

  /**
   * Enterprise Renewal
   */
  async renewLoan(id: string): Promise<Borrow> {
    const record = await this.findOne(id);
    if (record.status !== BorrowStatus.ACTIVE) {
      throw new BadRequestException('Only active loans can be renewed.');
    }

    // Is there a waitlist?
    try {
      const queueRes = await firstValueFrom(this.httpService.get(`http://reservation-service:3005/reservations/book/${record.bookId}/queue`));
      if (queueRes.data && queueRes.data.length > 0) {
        throw new BadRequestException('Renewal denied: Another member is currently waiting in the reserve queue for this item.');
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      console.error('Failed to verify reservation queue for renewal');
    }

    // Add 7 days to due date
    record.dueDate = new Date(record.dueDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    return record.save();
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
