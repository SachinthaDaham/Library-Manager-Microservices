import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Review extends Document {
  @Prop({ required: true })
  memberId: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}
export const ReviewSchema = SchemaFactory.createForClass(Review);

@Schema({ timestamps: true })
export class Book extends Document {
  @Prop({ required: true, unique: true })
  isbn: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  author: string;

  @Prop({ required: true })
  genre: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true, default: 1 })
  totalCopies: number;

  @Prop({ required: true, default: 1 })
  availableCopies: number;

  @Prop({ type: [ReviewSchema], default: [] })
  reviews: Review[];

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  reviewCount: number;
}

export const BookSchema = SchemaFactory.createForClass(Book);
