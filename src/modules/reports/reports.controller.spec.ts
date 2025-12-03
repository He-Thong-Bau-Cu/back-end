import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getById: jest.fn(),
    getByElectionId: jest.fn(),
    update: jest.fn(),
  };

  const mockRequest: any = {
    user: { sub: 'U1' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        { provide: ReportsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
    service = module.get<ReportsService>(ReportsService);

    jest.clearAllMocks();
  });

  // =====================================================
  // CREATE
  // =====================================================
  describe('create', () => {
    const dto = { electionId: 'E1', title: 'Test Report' };

    it('should create report successfully', async () => {
      mockService.create.mockResolvedValue({ _id: 'R1', ...dto });

      const result = await controller.create(dto as any, mockRequest);

      expect(service.create).toHaveBeenCalledWith(dto, 'U1');
      expect(result.success).toBe(true);
      expect(result.data._id).toBe('R1');
    });

    it('should throw HttpException when service fails', async () => {
      mockService.create.mockRejectedValue(new Error('DB error'));

      await expect(controller.create(dto as any, mockRequest))
        .rejects.toThrow(HttpException);
    });
  });

  // =====================================================
  // FIND ALL
  // =====================================================
  describe('findAll', () => {
    it('should return all reports', async () => {
      mockService.findAll.mockResolvedValue([{ _id: 'R1' }]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result.data.length).toBe(1);
    });

    it('should throw HttpException when service fails', async () => {
      mockService.findAll.mockRejectedValue(new Error('DB error'));

      await expect(controller.findAll()).rejects.toThrow(HttpException);
    });
  });

  // =====================================================
  // GET BY ID
  // =====================================================
  describe('getById', () => {
    it('should return report by ID', async () => {
      mockService.getById.mockResolvedValue({ _id: 'R1' });

      const result = await controller.getById('R1');

      expect(service.getById).toHaveBeenCalledWith('R1');
      expect(result.data._id).toBe('R1');
    });

    it('should throw HttpException when service fails', async () => {
      mockService.getById.mockRejectedValue(new Error('DB error'));

      await expect(controller.getById('R1')).rejects.toThrow(HttpException);
    });
  });

  // =====================================================
  // GET BY ELECTION ID
  // =====================================================
  describe('getByElectionId', () => {
    it('should return reports by election ID', async () => {
      mockService.getByElectionId.mockResolvedValue([{ _id: 'R1' }]);

      const result = await controller.getByElectionId('E1');

      expect(service.getByElectionId).toHaveBeenCalledWith('E1');
      expect(result.data.length).toBe(1);
    });

    it('should throw HttpException when service fails', async () => {
      mockService.getByElectionId.mockRejectedValue(new Error('DB error'));

      await expect(controller.getByElectionId('E1')).rejects.toThrow(HttpException);
    });
  });

  // =====================================================
  // UPDATE
  // =====================================================
  describe('update', () => {
    const dto = { title: 'Updated Report' };

    it('should update report successfully', async () => {
      mockService.update.mockResolvedValue({ _id: 'R1', ...dto });

      const result = await controller.update('R1', dto as any, mockRequest);

      expect(service.update).toHaveBeenCalledWith('R1', dto, 'U1');
      expect(result.data.title).toBe('Updated Report');
    });

    it('should throw HttpException when service fails', async () => {
      mockService.update.mockRejectedValue(new Error('DB error'));

      await expect(controller.update('R1', dto as any, mockRequest))
        .rejects.toThrow(HttpException);
    });
  });
});
