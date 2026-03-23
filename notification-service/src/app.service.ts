import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationLog } from './notification.schema';

@Injectable()
export class AppService {
  constructor(@InjectModel(NotificationLog.name) private notifModel: Model<NotificationLog>) {}

  async notifyOverdue(data: any): Promise<NotificationLog> {
    const msg = `Your borrow ID ${data.borrowId} is OVERDUE! Please return Book ${data.bookId} immediately.`;
    const notif = new this.notifModel({ memberId: data.memberId, message: msg });
    return notif.save();
  }

  async notifyReturn(data: any): Promise<NotificationLog> {
    const msg = `Thank you for returning Book ${data.bookId}. Borrow ID ${data.borrowId} is resolved.`;
    const notif = new this.notifModel({ memberId: data.memberId, message: msg });
    return notif.save();
  }

  async getAll(): Promise<NotificationLog[]> { return this.notifModel.find().exec(); }

  async markAsRead(id: string): Promise<NotificationLog> {
    const notif = await this.notifModel.findByIdAndUpdate(id, { read: true }, { new: true });
    if (!notif) throw new NotFoundException('Notification not found');
    return notif;
  }

  async remove(id: string): Promise<void> {
    const result = await this.notifModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Notification not found');
  }
}
