import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Fine } from './fine.schema';

const FINE_RATE_PER_DAY = 1.5;
const FINE_MINIMUM = 5;

@Injectable()
export class AppService {
  constructor(@InjectModel(Fine.name) private fineModel: Model<Fine>) {}

  async createFine(data: any): Promise<Fine> {
    const borrowId = String(data.borrowId);

    // Duplicate guard — check if a fine already exists for this borrowId
    const existing = await this.fineModel.findOne({ borrowId });
    if (existing) {
      if (existing.paid) {
        // Fine was already paid — NEVER create another one
        throw new BadRequestException(
          'A fine for this borrow record has already been paid. No further charges will be applied.',
        );
      }
      // Fine exists but unpaid — add extra overdue days fee and update
      const extraDays = data.overdueDays ?? 1;
      existing.amount = parseFloat(
        (existing.amount + extraDays * FINE_RATE_PER_DAY).toFixed(2),
      );
      existing.overdueDays = (existing.overdueDays ?? 0) + extraDays;
      return existing.save();
    }

    // Calculate amount based on overdue days
    const overdueDays = data.overdueDays ?? 1;
    const calculated = parseFloat(
      Math.max(overdueDays * FINE_RATE_PER_DAY, FINE_MINIMUM).toFixed(2),
    );

    const newFine = new this.fineModel({
      memberId: data.memberId,
      borrowId: borrowId,
      amount: calculated,
      overdueDays: overdueDays,
      paid: false,
      paidAt: null,
    });
    const saved = await newFine.save();

    // Increment user penalty points in Auth Service
    try {
      if (data.memberId) {
        await fetch(`http://localhost:3001/auth/users/${data.memberId}/penalty`, { method: 'POST' });
      }
    } catch (e) {
      console.error('Failed to add penalty point to user', e);
    }

    return saved;
  }

  async getAllFines(): Promise<Fine[]> {
    return this.fineModel.find().sort({ createdAt: -1 }).exec();
  }

  async getFinesByMember(memberId: string): Promise<Fine[]> {
    return this.fineModel.find({ memberId }).sort({ createdAt: -1 }).exec();
  }

  async payFine(id: string): Promise<Fine> {
    const fine = await this.fineModel.findByIdAndUpdate(
      id,
      { paid: true, paidAt: new Date() },
      { new: true },
    );
    if (!fine) throw new NotFoundException('Fine not found');

    // Decrement user penalty points upon resolution
    try {
      if (fine.memberId) {
        await fetch(`http://localhost:3001/auth/users/${fine.memberId}/penalty`, { method: 'DELETE' });
      }
    } catch (e) {
      console.error('Failed to remove penalty point from user', e);
    }

    return fine;
  }

  async removeFine(id: string): Promise<void> {
    const result = await this.fineModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Fine not found');
  }
}
