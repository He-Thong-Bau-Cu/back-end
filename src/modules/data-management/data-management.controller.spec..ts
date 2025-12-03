import { Test, TestingModule } from '@nestjs/testing';
import { DataManagementController } from './data-management.controller';
import { DataManagementService } from './data-management.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('DataManagementController', () => {
  let controller: DataManagementController;
  let service: DataManagementService;

  const mockService = {
    searchBackups: jest.fn(),
    importBackup: jest.fn(),
    exportBackups: jest.fn(),
  };

  // Fake response object dùng cho exportBackup()
  const mockResponse: any = {
    set: jest.fn(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataManagementController],
      providers: [
        {
          provide: DataManagementService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<DataManagementController>(DataManagementController);
    service = module.get<DataManagementService>(DataManagementService);

    jest.clearAllMocks();
  });

  // ============================================================
  // 1. searchBackups
  // ============================================================
  describe('searchBackups', () => {
    it('should return BaseResponse.success when service succeeds', async () => {
      const body: any = {
        tableName: 'users',
        page: 1,
        limit: 10,
      };
  
      const mockResult = { items: [], total: 0 };
  
      mockService.searchBackups.mockResolvedValue(mockResult);
  
      const response = await controller.searchBackups(body);
  
      expect(response).toEqual(
        BaseResponse.success(
          mockResult,
          MESSAGE.BACKUP_SEARCH_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.searchBackups).toHaveBeenCalledWith(body);
    });
  
    it('should throw HttpException when service throws error', async () => {
      mockService.searchBackups.mockRejectedValue(new Error('Server failed'));
  
      await expect(controller.searchBackups({} as any)).rejects.toThrow(HttpException);
    });
  });
  

  // ============================================================
  // 2. importBackup
  // ============================================================
  describe('importBackup', () => {
    it('should return success response when import succeeds', async () => {
      const body = { tableName: 'users' } as any;
      const file = { originalname: 'test.json' } as any;
      const req: any = { user: { sub: '123' } };

      const mockResult = { id: 'backup123' };

      mockService.importBackup.mockResolvedValue(mockResult);

      const response = await controller.importBackup(body, file, req);

      expect(response).toEqual(
        BaseResponse.success(mockResult, MESSAGE.BACKUP_IMPORT_SUCCESS, HttpStatus.CREATED),
      );

      expect(service.importBackup).toHaveBeenCalledWith(body, file, '123');
    });

    it('should throw HttpException on error', async () => {
      mockService.importBackup.mockRejectedValue(new Error('Import failed'));

      await expect(
        controller.importBackup({} as any, {} as any, { user: { sub: '123' } } as any),
      ).rejects.toThrow(HttpException);
    });
  });

  // ============================================================
  // 3. exportBackup
  // ============================================================
  describe('exportBackup', () => {
    it('should set headers and send buffer on success', async () => {
      const query = { format: 'json' } as any;

      const mockFile = {
        mimeType: 'application/json',
        fileName: 'backup.json',
        buffer: Buffer.from('TEST'),
      };

      mockService.exportBackups.mockResolvedValue(mockFile);

      await controller.exportBackup(query, mockResponse);

      expect(service.exportBackups).toHaveBeenCalledWith(query);

      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': mockFile.mimeType,
        'Content-Disposition': `attachment; filename="${mockFile.fileName}"`,
      });

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.send).toHaveBeenCalledWith(mockFile.buffer);
    });

    it('should throw HttpException when service fails', async () => {
      mockService.exportBackups.mockRejectedValue(new Error('Export failed'));

      await expect(
        controller.exportBackup({} as any, mockResponse),
      ).rejects.toThrow(HttpException);
    });
  });
});
