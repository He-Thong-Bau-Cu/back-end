import { Test, TestingModule } from '@nestjs/testing';
import { DataManagementService } from './data-management.service';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Backups } from 'src/database/schemas/backups.schema';
import { MinioService } from '../minio/minio.service';
import { BadRequestException } from '@nestjs/common';
import { paginate } from 'src/common/dto/paignation';

// Helper to create valid ObjectId strings
const oid = () => new Types.ObjectId().toString();

jest.mock('src/common/dto/paignation', () => ({
  paginate: jest.fn().mockImplementation((data) => ({
    items: data,
    total: data.length,
    page: 1,
    limit: 10,
  })),
}));

describe('DataManagementService', () => {
  let service: DataManagementService;
  let backupModel: any;
  let minioService: any;

  beforeEach(async () => {
    backupModel = {
      find: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      lean: jest.fn(),
    };

    minioService = {
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataManagementService,
        {
          provide: getModelToken(Backups.name),
          useValue: backupModel,
        },
        {
          provide: MinioService,
          useValue: minioService,
        },
      ],
    }).compile();

    service = module.get<DataManagementService>(DataManagementService);
  });

  afterEach(() => jest.clearAllMocks());

  // ================================================================================
  // 1. searchBackups
  // ================================================================================
  describe('searchBackups', () => {
    it('should return paginated backups', async () => {
      const mockData = [
        { tableName: 'users', action: 'CREATE', createdAt: new Date() },
      ];
  
      backupModel.exec.mockResolvedValue(mockData);
  
      const result = await service.searchBackups({
        recordId: '10',
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31'),
        page: 1,
        limit: 10,
      } as any);
  
      expect(backupModel.find).toHaveBeenCalled();
      expect((result as any).items.length).toBe(1);   
    });
  });
  

  // ================================================================================
  // 2. importBackup
  // ================================================================================
  describe('importBackup', () => {
    it('should throw error when userId is missing', async () => {
      await expect(
        service.importBackup({ tableName: 'users' } as any, undefined, '')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error when file is missing', async () => {
      const userId = oid();
      await expect(
        service.importBackup({ tableName: 'users' } as any, undefined, userId)
      ).rejects.toThrow('Vui lòng đính kèm tệp dữ liệu để nhập');
    });

    it('should import backup successfully', async () => {
      const userId = oid();
      const mockFile = {
        originalname: 'test.json',
        mimetype: 'application/json',
        buffer: Buffer.from(JSON.stringify({ a: 1 })),
      };

      minioService.uploadFile.mockResolvedValue({ key: 'abc/test.json' });

      backupModel.create.mockResolvedValue({
        populate: jest.fn().mockResolvedValue({
          tableName: 'users',
          action: 'IMPORT',
        }),
      });

      const result = await service.importBackup(
        {
          tableName: 'users',
          action: 'IMPORT',
          dataBefore: '{"a":1}',
        } as any,
        mockFile as any,
        userId
      );

      expect(minioService.uploadFile).toHaveBeenCalled();
      expect(backupModel.create).toHaveBeenCalled();
      expect(result.tableName).toBe('users');
    });
  });

  // ================================================================================
  // 3. exportBackups
  // ================================================================================
  describe('exportBackups', () => {
    it('should export JSON format', async () => {
      backupModel.find.mockReturnThis();
      backupModel.populate.mockReturnThis();
      backupModel.sort.mockReturnThis();
      backupModel.lean.mockResolvedValue([
        {
          tableName: 'users',
          action: 'CREATE',
          dataBefore: null,
          dataAfter: { test: 1 },
          createdAt: new Date(),
          actionBy: { fullName: 'Admin' },
        },
      ]);

      const result = await service.exportBackups({
        format: 'json',
      } as any);

      expect(result.mimeType).toBe('application/json');
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
    });

    it('should export CSV format', async () => {
      backupModel.find.mockReturnThis();
      backupModel.populate.mockReturnThis();
      backupModel.sort.mockReturnThis();
      backupModel.lean.mockResolvedValue([
        {
          tableName: 'users',
          action: 'CREATE',
          dataBefore: null,
          dataAfter: null,
          createdAt: new Date(),
          actionBy: { fullName: 'Admin' },
        },
      ]);

      const result = await service.exportBackups({
        format: 'csv',
      } as any);

      expect(result.mimeType).toContain('text/csv');
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
    });

    it('should throw when fromDate > toDate', async () => {
      await expect(
        service.exportBackups({
          fromDate: new Date('2024-12-01'),
          toDate: new Date('2024-01-01'),
        } as any)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
