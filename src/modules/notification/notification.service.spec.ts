import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NotificationService } from './notification.service';
import { Notification } from 'src/database/schemas/notification.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { NotificationGateway } from './notification.gateway';

// Helper to create valid ObjectId strings
const oid = () => new Types.ObjectId().toString();

describe('NotificationService', () => {
  let service: NotificationService;

  const mockNotificationModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };

  const mockElectionParticipantsModel = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockGateway = {
    sendToUser: jest.fn(),
    dataToElectionId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getModelToken(Notification.name),
          useValue: mockNotificationModel,
        },
        {
          provide: getModelToken(ElectionsParticipants.name),
          useValue: mockElectionParticipantsModel,
        },
        {
          provide: NotificationGateway,
          useValue: mockGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  // ==========================================
  // notifyUser
  // ==========================================
  describe('notifyUser', () => {
    it('should throw if userId or message is missing', async () => {
      await expect(service.notifyUser('', 'hello')).rejects.toThrow(
        'UserId and message are required',
      );
      const userId = oid();
      await expect(service.notifyUser(userId, '')).rejects.toThrow(
        'UserId and message are required',
      );
    });

    it('should create notification and send via gateway', async () => {
      const userId = oid();
      const notificationId = oid();
      const createdNotification = { _id: notificationId, userId: userId, message: 'Hi' };
      (mockNotificationModel.create as jest.Mock).mockResolvedValue(createdNotification);

      await service.notifyUser(userId, 'Hi');

      expect(mockNotificationModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.anything(), // ObjectId
          message: 'Hi',
        }),
      );
      expect(mockGateway.sendToUser).toHaveBeenCalledWith(userId, createdNotification);
    });
  });

  // ==========================================
  // transferDataRealTime
  // ==========================================
  describe('transferDataRealTime', () => {
    it('should throw if electionId or data missing', async () => {
      await expect(service.transferDataRealTime('', { a: 1 })).rejects.toThrow(
        'ElectionId and data are required',
      );
      const electionId = oid();
      await expect(service.transferDataRealTime(electionId, null as any)).rejects.toThrow(
        'ElectionId and data are required',
      );
    });

    it('should send data via gateway', async () => {
      const electionId = oid();
      const payload = { type: 'checkin-update', count: 10 };

      await service.transferDataRealTime(electionId, payload);

      expect(mockGateway.dataToElectionId).toHaveBeenCalledWith(electionId, payload);
    });
  });

  // ==========================================
  // getUserNotifications
  // ==========================================
  describe('getUserNotifications', () => {
    it('should return user notifications sorted by createdAt desc', async () => {
      const userId = oid();
      const notificationId1 = oid();
      const notificationId2 = oid();
      const mockList = [{ _id: notificationId1 }, { _id: notificationId2 }];

      (mockNotificationModel.find as jest.Mock).mockReturnValueOnce({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockList),
      });

      const result = await service.getUserNotifications(userId);

      expect(mockNotificationModel.find).toHaveBeenCalledWith({
        userId: expect.anything(), // ObjectId
      });
      expect(result).toEqual(mockList);
    });
  });

  // ==========================================
  // markReadOne
  // ==========================================
  describe('markReadOne', () => {
    it('should throw if notification not found', async () => {
      const notificationId = oid();
      const userId = oid();
      (mockNotificationModel.findOne as jest.Mock).mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.markReadOne(notificationId, userId)).rejects.toThrow('Notification not found');
    });

    it('should mark one notification as read and return list', async () => {
      const notificationId = oid();
      const userId = oid();
      const save = jest.fn().mockResolvedValue(true);
      const foundNotification = { _id: notificationId, read: false, save };

      (mockNotificationModel.findOne as jest.Mock).mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(foundNotification),
      });

      const userNotifications = [{ _id: notificationId, read: true }];
      const getSpy = jest
        .spyOn(service, 'getUserNotifications')
        .mockResolvedValue(userNotifications as any);

      const result = await service.markReadOne(notificationId, userId);

      expect(save).toHaveBeenCalled();
      expect(getSpy).toHaveBeenCalledWith(userId);
      expect(result).toEqual(userNotifications);
    });
  });

  // ==========================================
  // markReadAll
  // ==========================================
  describe('markReadAll', () => {
    it('should mark all notifications as read and return list', async () => {
      const userId = oid();
      const notificationId1 = oid();
      const notificationId2 = oid();
      (mockNotificationModel.updateMany as jest.Mock).mockResolvedValue({ acknowledged: true });

      const userNotifications = [
        { _id: notificationId1, read: true },
        { _id: notificationId2, read: true },
      ];
      const getSpy = jest
        .spyOn(service, 'getUserNotifications')
        .mockResolvedValue(userNotifications as any);

      const result = await service.markReadAll(userId);

      expect(mockNotificationModel.updateMany).toHaveBeenCalledWith(
        { userId: expect.anything(), read: false },
        { $set: { read: true } },
      );
      expect(getSpy).toHaveBeenCalledWith(userId);
      expect(result).toEqual(userNotifications);
    });
  });

  // ==========================================
  // deleteAllNotifications
  // ==========================================
  describe('deleteAllNotifications', () => {
    it('should delete all notifications for user and return userId', async () => {
      const userId = oid();
      (mockNotificationModel.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 3 });

      const result = await service.deleteAllNotifications(userId);

      expect(mockNotificationModel.deleteMany).toHaveBeenCalledWith({
        userId: expect.anything(),
      });
      expect(result).toBe(userId);
    });

    it('should throw wrapped error if delete fails', async () => {
      const userId = oid();
      (mockNotificationModel.deleteMany as jest.Mock).mockRejectedValue(
        new Error('DB error'),
      );

      await expect(service.deleteAllNotifications(userId)).rejects.toThrow(
        'Error deleting notifications: DB error',
      );
    });
  });
});
