import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async getAll(): Promise<Reservation[]> { return this.resModel.find().exec(); }

  async getQueueForBook(bookId: string): Promise<Reservation[]> {
    return this.resModel.find({ bookId, status: 'WAITING' }).sort({ createdAt: 1 }).exec();
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
