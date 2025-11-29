import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationDocument } from 'src/database/schemas/notification.schema';
import { ElectionsParticipants, ElectionsParticipantsDocument } from 'src/database/schemas/electionParticipants.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(ElectionsParticipants.name) private electionParticipantsModel: Model<ElectionsParticipantsDocument>,
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

  async transferStateDataRT(electionId: string, data: any) {
    if (!electionId || !data) {
      throw new Error('ElectionId and data are required');
    }
    this.notificationGateway.transferStateDataRT(electionId, data);
  }

  async getBallotsVoter(voterId: string, data: any) {
    if (!voterId || !data) {
      throw new Error('VoterId and data are required');
    }
    this.notificationGateway.sendToVoter(voterId, data);
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

  async broadcastAnnouncement(electionId: string, message: string) {
    try {
      if (!electionId || !message) {
        throw new Error('ElectionId and message are required');
      }

      // Lấy tất cả participants trong election
      const participants = await this.electionParticipantsModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('userId', '_id')
        .exec();

      // Tạo notification cho mỗi participant
      const notifications = participants.map(participant => ({
        userId: (participant.userId as any)?._id || participant.userId,
        message: message,
        read: false,
      }));

      // Lưu notifications vào database
      const createdNotifications = await this.notificationModel.insertMany(notifications);

      // Emit socket để gửi realtime đến tất cả participants
      participants.forEach(participant => {
        this.notificationGateway.sendToUser(String(participant.userId), message);
      });

      return {
        sent: createdNotifications.length,
        message: 'Thông báo đã được gửi đến tất cả người tham dự',
      };
    } catch (error) {
      throw new Error('Error broadcasting announcement: ' + error.message);
    }
  }
}
