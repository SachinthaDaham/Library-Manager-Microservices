import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum BorrowStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
}

@Schema({ timestamps: true })
export class Borrow extends Document {
  @Prop({ required: true })
  memberId: string;

  @Prop({ required: true })
  bookId: string;

  @Prop({ required: true, default: Date.now })
  borrowDate: Date;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ required: true, enum: BorrowStatus, default: BorrowStatus.ACTIVE })
  status: BorrowStatus;

  @Prop()
  returnDate: Date;

  @Prop()
  notes: string;
}

export const BorrowSchema = SchemaFactory.createForClass(Borrow);
