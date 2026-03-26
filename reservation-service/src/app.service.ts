import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Reservation } from './reservation.schema';

@Injectable()
export class AppService {
  constructor(@InjectModel(Reservation.name) private resModel: Model<Reservation>) {}

  async createReservation(data: any): Promise<Reservation> {
    const res = new this.resModel({ memberId: data.memberId, bookId: data.bookId, status: 'WAITING' });
    return res.save();
  }

  async handleBookReturned(data: { bookId: string }): Promise<void> {
    const nextInLine = await this.resModel.findOne({ bookId: data.bookId, status: 'WAITING' }).sort({ createdAt: 1 });
    if (nextInLine) {
      nextInLine.status = 'FULFILLED';
      // Set expiration strictly to 3 days from now
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 3);
      nextInLine.expiresAt = expiry;
      
      await nextInLine.save();
      console.log(`[Reservation Fulfilled] Member ${nextInLine.memberId} can now borrow Book ${data.bookId} (Expires: ${expiry.toISOString()})`);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processExpiredHolds() {
    const now = new Date();
    const expiredHolds = await this.resModel.find({ status: 'FULFILLED', expiresAt: { $lt: now } });
    
    for (const hold of expiredHolds) {
      console.log(`[Hold Expired] Revoking access for member ${hold.memberId} on book ${hold.bookId}`);
      await this.resModel.findByIdAndDelete(hold._id);
      
      // Automatically allocate the freed copy to the next person in line
      await this.handleBookReturned({ bookId: hold.bookId });
    }
  }

  async getAll(): Promise<Reservation[]> {
    return this.resModel.find().sort({ createdAt: -1 }).exec();
  }

  async getByMember(memberId: string): Promise<Reservation[]> {
    return this.resModel.find({ memberId }).sort({ createdAt: -1 }).exec();
  }

  async getQueueForBook(bookId: string): Promise<Reservation[]> {
    return this.resModel.find({ bookId, status: 'WAITING' }).sort({ createdAt: 1 }).exec();
  }

  async getHoldsForBook(bookId: string): Promise<Reservation[]> {
    // Return all fulfilled reservations (i.e. copies held for specific members)
    return this.resModel.find({ bookId, status: 'FULFILLED' }).exec();
  }

  async consumeHold(bookId: string, memberId: string): Promise<void> {
    await this.resModel.findOneAndDelete({ bookId, memberId, status: 'FULFILLED' });
  }

  async updateStatus(id: string, status: string): Promise<Reservation> {
    const updateData: any = { status };
    if (status === 'FULFILLED') {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 3);
      updateData.expiresAt = expiry;
    }
    const res = await this.resModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!res) throw new NotFoundException('Reservation not found');
    return res;
  }

  async remove(id: string): Promise<void> {
    const result = await this.resModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Reservation not found');
  }
}
