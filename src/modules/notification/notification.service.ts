import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationDocument } from 'src/database/schemas/notification.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private readonly notificationGateway: NotificationGateway,
  ) { }

  async notifyUser(userId: string, message: string) {
    if (!userId || !message) {
      throw new Error('UserId and message are required');
    }
    const userToObjectId = new Types.ObjectId(userId);
    const notification = await this.notificationModel.create({
      userId: userToObjectId,
      message,
    });
    this.notificationGateway.sendToUser(userId, notification);
  }

  async transferDataRealTime(electionId: string, data: any) {
    if (!electionId || !data) {
      throw new Error('ElectionId and data are required');
    }
    this.notificationGateway.dataToElectionId(electionId, data);
  }

  async getUserNotifications(userId: string) {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markReadOne(notificationId: string, uid: string) {
    try {
      const notification = await this.notificationModel
        .findOne({ _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(uid) })
        .exec();
      if (!notification) {
        throw new Error('Notification not found');
      }
      notification.read = true;
      await notification.save();
      return this.getUserNotifications(uid);
    } catch (e) {
      throw e;
    }
  }

  async markReadAll(userId: string) {
    try {
      await this.notificationModel.updateMany(
        { userId: new Types.ObjectId(userId), read: false },
        { $set: { read: true } },
      );
      return this.getUserNotifications(userId);
    } catch (e) {
      throw e;
    }
  }

  async deleteAllNotifications(userId: string) {
    try {
      await this.notificationModel.deleteMany({ userId: new Types.ObjectId(userId) });
      return userId;
    } catch (error) {
      throw new Error('Error deleting notifications: ' + error.message);
    }
  }
}
