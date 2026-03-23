import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Fine extends Document {
  @Prop({ required: true })
  memberId: string;

  @Prop({ required: true })
  borrowId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: false })
  paid: boolean;
}

export const FineSchema = SchemaFactory.createForClass(Fine);
