import { Test, TestingModule } from '@nestjs/testing';
import { SystemReportController } from './system-report.controller';
import { SystemReportService } from './system-report.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('SystemReportController', () => {
  let controller: SystemReportController;
  let service: SystemReportService;

  const mockService = {
    getOverview: jest.fn(),
    exportReport: jest.fn(),
  };

  // Mock Express Response
  const mockRes = () => {
    const res: any = {};
    res.set = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemReportController],
      providers: [
        {
          provide: SystemReportService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SystemReportController>(SystemReportController);
    service = module.get<SystemReportService>(SystemReportService);

    jest.clearAllMocks();
  });

  // ===========================================================================
  // getOverview
  // ===========================================================================
  describe('getOverview', () => {
    it('should return system overview report', async () => {
      const query = { from: '2024-01-01', to: '2024-01-31' } as any;
      const mockData = { users: 100, elections: 5 };
  
      mockService.getOverview.mockResolvedValue(mockData);
  
      const result: any = await controller.getOverview(query);
  
      expect(result.status).toBe(HttpStatus.OK);
      expect(result.data).toEqual(mockData);
      expect(result.message).toBe(MESSAGE.SYSTEM_REPORT_VIEW_SUCCESS);
  
      expect(service.getOverview).toHaveBeenCalledWith(query);
    });
  
    it('should throw HttpException on error', async () => {
      mockService.getOverview.mockRejectedValue(new Error('Error occurred'));
  
      await expect(controller.getOverview({} as any)).rejects.toThrow(HttpException);
    });
  });
  

  // ===========================================================================
  // exportReport
  // ===========================================================================
  describe('exportReport', () => {
    it('should export system report file', async () => {
      const query = { from: '2024-01-01', to: '2024-01-31' } as any;
  
      const mockFile = {
        fileName: 'report.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from('test'),
      };
  
      mockService.exportReport.mockResolvedValue(mockFile);
  
      const res = mockRes();
  
      await controller.exportReport(query, res);
  
      expect(service.exportReport).toHaveBeenCalledWith(query);
      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': mockFile.mimeType,
        'Content-Disposition': `attachment; filename="${mockFile.fileName}"`,
      });
  
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.send).toHaveBeenCalledWith(mockFile.buffer);
    });
  });
  
});
