import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Reservation extends Document {
  @Prop({ required: true })
  memberId: string;

  @Prop({ required: true })
  bookId: string;

  @Prop({ required: true, default: 'WAITING' })
  status: string; // WAITING, FULFILLED

  @Prop({ default: null })
  expiresAt: Date;
}
export const ReservationSchema = SchemaFactory.createForClass(Reservation);
