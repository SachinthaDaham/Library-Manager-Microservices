import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class NotificationLog extends Document {
  @Prop({ required: true })
  memberId: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: ['INFO', 'SUCCESS', 'ALERT', 'WARNING'], default: 'INFO' })
  type: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ required: true, default: false })
  read: boolean;
}
export const NotificationSchema = SchemaFactory.createForClass(NotificationLog);
