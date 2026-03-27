import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationLog } from './notification.schema';

@Injectable()
export class AppService {
  constructor(@InjectModel(NotificationLog.name) private notifModel: Model<NotificationLog>) {}

  async notifyOverdue(data: any): Promise<NotificationLog> {
    const msg = `Borrow ID ${String(data.borrowId).substring(0,8)} is OVERDUE! Please return '${data.bookTitle || data.bookId}' immediately.`;
    const notif = new this.notifModel({
      memberId: data.memberId,
      message: msg,
      type: 'ALERT',
      metadata: { borrowId: data.borrowId, bookId: data.bookId }
    });
    return notif.save();
  }

  async notifyReturn(data: any): Promise<NotificationLog> {
    const msg = `Thank you for returning '${data.bookTitle || data.bookId}'. Borrow ID ${String(data.borrowId).substring(0,8)} is resolved.`;
    const notif = new this.notifModel({
      memberId: data.memberId,
      message: msg,
      type: 'SUCCESS',
      metadata: { borrowId: data.borrowId, bookId: data.bookId }
    });
    return notif.save();
  }

  async createLog(data: { memberId?: string, message: string, type?: string, metadata?: any }): Promise<NotificationLog> {
    const notif = new this.notifModel({
      memberId: data.memberId || 'SYSTEM',
      message: data.message,
      type: data.type || 'INFO',
      metadata: data.metadata || {}
    });
    return notif.save();
  }

  async getAll(): Promise<NotificationLog[]> {
    return this.notifModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByMember(memberId: string): Promise<NotificationLog[]> {
    return this.notifModel.find({ memberId }).sort({ createdAt: -1 }).exec();
  }

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
