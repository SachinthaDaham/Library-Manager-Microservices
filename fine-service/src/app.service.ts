import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Fine } from './fine.schema';

@Injectable()
export class AppService {
  constructor(@InjectModel(Fine.name) private fineModel: Model<Fine>) {}

  async createFine(data: any): Promise<Fine> {
    // Check if fine already exists for this borrowId (compounding daily late fee)
    const existing = await this.fineModel.findOne({ borrowId: data.borrowId });
    if (existing) {
      if (!existing.paid) {
        existing.amount += 5; // standard daily addition
        return existing.save();
      }
      return existing;
    }
    
    // Initial penalty creation
    const newFine = new this.fineModel({
      memberId: data.memberId,
      borrowId: data.borrowId,
      amount: 10, // Initial late fee
      paid: false,
    });
    return newFine.save();
  }

  async getAllFines(): Promise<Fine[]> {
    return this.fineModel.find().exec();
  }

  async payFine(id: string): Promise<Fine> {
    const fine = await this.fineModel.findByIdAndUpdate(id, { paid: true }, { new: true });
    if (!fine) throw new NotFoundException('Fine not found');
    return fine;
  }

  async removeFine(id: string): Promise<void> {
    const result = await this.fineModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Fine not found');
  }
}
