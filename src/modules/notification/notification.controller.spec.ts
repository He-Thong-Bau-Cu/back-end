import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { NotificationDto } from './notification.dto';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockService = {
    getUserNotifications: jest.fn(),
    markReadOne: jest.fn(),
    markReadAll: jest.fn(),
    deleteAllNotifications: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);

    jest.clearAllMocks();
  });

  // =====================================================
  // GET /notification/:userId
  // =====================================================
  describe('getEmployeeNotifications', () => {
    it('should return notifications', async () => {
      const mockData = [{ _id: 'N1' }];
      mockService.getUserNotifications.mockResolvedValue(mockData);

      const result = await controller.getEmployeeNotifications('U1');

      expect(service.getUserNotifications).toHaveBeenCalledWith('U1');
      expect(result.data).toEqual(mockData);
    });

    it('should throw HttpException on error', async () => {
      mockService.getUserNotifications.mockRejectedValue(new Error('DB error'));

      await expect(controller.getEmployeeNotifications('U1')).rejects.toThrow(
        HttpException,
      );
    });
  });

  // =====================================================
  // POST /notification/mark-read-one
  // =====================================================
  describe('markReadOne', () => {
    const mockDto: NotificationDto = {
      userId: 'U1',
      notificationId: 'N1',
    };

    it('should mark one notification as read', async () => {
      const mockData = [{ _id: 'N1', read: true }];
      mockService.markReadOne.mockResolvedValue(mockData);

      const result = await controller.markReadOne(mockDto);

      expect(service.markReadOne).toHaveBeenCalledWith('N1', 'U1');
      expect(result.data).toEqual(mockData);
    });

    it('should throw on service error', async () => {
      mockService.markReadOne.mockRejectedValue(new Error('Not found'));

      await expect(controller.markReadOne(mockDto)).rejects.toThrow(HttpException);
    });
  });

  // =====================================================
  // POST /notification/mark-read-all
  // =====================================================
  describe('markReadAll', () => {
    const mockDto: NotificationDto = { 
      userId: 'U1',
      notificationId: 'N1'
    };
  
    it('should mark all notifications as read', async () => {
      const mockData = [{ _id: 'N1', read: true }];
  
      mockService.markReadAll.mockResolvedValue(mockData);
  
      const result = await controller.markReadAll(mockDto);
  
      expect(service.markReadAll).toHaveBeenCalledWith('U1');
      expect(result.data).toEqual(mockData);
    });
  
    it('should throw error when service fails', async () => {
      mockService.markReadAll.mockRejectedValue(new Error('DB error'));
  
      await expect(controller.markReadAll(mockDto)).rejects.toThrow(HttpException);
    });
  });
  

  // =====================================================
  // POST /notification/delete-all
  // =====================================================
  describe('deleteAll', () => {
    const mockDto: NotificationDto = { 
      userId: 'U1',
      notificationId: 'N1',
    };
  
    it('should delete all notifications', async () => {
      mockService.deleteAllNotifications.mockResolvedValue('U1');
  
      const result = await controller.deleteAll(mockDto);
  
      expect(service.deleteAllNotifications).toHaveBeenCalledWith('U1');
      expect(result.data).toBe('U1');
    });
  
    it('should throw HttpException on error', async () => {
      mockService.deleteAllNotifications.mockRejectedValue(new Error('Error deleting'));
  
      await expect(controller.deleteAll(mockDto))
        .rejects.toThrow(HttpException);
    });
  });
  
});
