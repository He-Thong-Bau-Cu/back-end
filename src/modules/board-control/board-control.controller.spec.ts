import { Test, TestingModule } from '@nestjs/testing';
import { BoardControlController } from './board-control.controller';
import { BoardControlService } from './board-control.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('BoardControlController', () => {
  let controller: BoardControlController;
  let service: BoardControlService;

  // Mock Service
  const mockService = {
    getVotingOverview: jest.fn(),
    getVerificationReport: jest.fn(),
    approveVerification: jest.fn(),
    generateAuditReportPdf: jest.fn(),
    generateArchiveReportPdf: jest.fn(),
    getAuditReport: jest.fn(),
    confirmAuditReport: jest.fn(),
    getOrUpdateArchiveReport: jest.fn(),
  };

  // Mock Express Response
  const mockResponse = (): Response => {
    const res: any = {};
    res.set = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoardControlController],
      providers: [
        {
          provide: BoardControlService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<BoardControlController>(BoardControlController);
    service = module.get<BoardControlService>(BoardControlService);
  });

  // ----------------------------------------------------------------------
  // GET: /:electionId/voting-overview
  // ----------------------------------------------------------------------
  describe('getVotingOverview', () => {
    it('should return success response', async () => {
      mockService.getVotingOverview.mockResolvedValue({ totalVotes: 100 });

      const result = await controller.getVotingOverview('e1');

      expect((result as any).data.totalVotes).toBe(100);
      expect(mockService.getVotingOverview).toHaveBeenCalledWith('e1');
    });

    it('should throw HttpException on error', async () => {
      mockService.getVotingOverview.mockRejectedValue(new Error('Test error'));

      await expect(controller.getVotingOverview('e1')).rejects.toThrow(HttpException);
    });
  });

  // ----------------------------------------------------------------------
  // GET: /:electionId/verification
  // ----------------------------------------------------------------------
  describe('getVerification', () => {
    it('should return verification data', async () => {
      mockService.getVerificationReport.mockResolvedValue({ verified: true });

      const result = await controller.getVerification('e1');

      expect((result as any).data.verified).toBe(true);
    });
  });

  // ----------------------------------------------------------------------
  // POST: /:electionId/verification/approve
  // ----------------------------------------------------------------------
  describe('approveVerification', () => {
    it('should approve verification success', async () => {
      mockService.approveVerification.mockResolvedValue({ approved: true });

      const req = { user: { sub: 'user123' } };

      const result = await controller.approveVerification('e1', req as any);

      expect((result as any).data.approved).toBe(true);
      expect(mockService.approveVerification).toHaveBeenCalledWith('e1', 'user123');
    });
  });

  // ----------------------------------------------------------------------
  // GET: /audit-report/download
  // ----------------------------------------------------------------------
  describe('downloadAuditReport', () => {
    it('should send pdf buffer', async () => {
      const pdfBuffer = Buffer.from('pdfcontent');

      mockService.generateAuditReportPdf.mockResolvedValue(pdfBuffer);

      const res = mockResponse();

      await controller.downloadAuditReport('e1', res);

      expect(res.set).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(pdfBuffer);
    });
  });

  // ----------------------------------------------------------------------
  // GET: /archive-report/download
  // ----------------------------------------------------------------------
  describe('downloadArchiveReport', () => {
    it('should send pdf buffer', async () => {
      const pdfBuffer = Buffer.from('archivepdf');

      mockService.generateArchiveReportPdf.mockResolvedValue(pdfBuffer);

      const res = mockResponse();

      await controller.downloadArchiveReport('e1', 'r123', res);

      expect(res.send).toHaveBeenCalledWith(pdfBuffer);
    });
  });

  // ----------------------------------------------------------------------
  // GET: /audit-report
  // ----------------------------------------------------------------------
  describe('getAuditReport', () => {
    it('should return audit report', async () => {
      mockService.getAuditReport.mockResolvedValue({ report: true });

      const result = await controller.getAuditReport('e1');

      expect((result as any).data.report).toBe(true);
      expect(mockService.getAuditReport).toHaveBeenCalledWith('e1');
    });
  });

  // ----------------------------------------------------------------------
  // POST: /audit-report
  // ----------------------------------------------------------------------
  describe('updateAuditReport', () => {
    it('should update audit report', async () => {
      mockService.getAuditReport.mockResolvedValue({ updated: true });

      const data = { description: 'Fix', summary: 'Updated' };

      const result = await controller.updateAuditReport('e1', data);

      expect((result as any).data.updated).toBe(true);
      expect(mockService.getAuditReport).toHaveBeenCalledWith('e1', data);
    });
  });

  // ----------------------------------------------------------------------
  // POST: /audit-report/sign
  // ----------------------------------------------------------------------
  describe('signAuditReport', () => {
    it('should sign audit report', async () => {
      mockService.confirmAuditReport.mockResolvedValue({ signed: true });

      const req = { user: { sub: 'u123' } };

      const result = await controller.signAuditReport('e1', req as any);

      expect((result as any).data.signed).toBe(true);
    });
  });

  // ----------------------------------------------------------------------
  // GET: /archive-report
  // ----------------------------------------------------------------------
  describe('getArchiveReport', () => {
    it('should return archive report', async () => {
      mockService.getOrUpdateArchiveReport.mockResolvedValue({ archived: true });

      const result = await controller.getArchiveReport('e1');

      expect((result as any).data.archived).toBe(true);
    });
  });

  // ----------------------------------------------------------------------
  // POST: /archive-report
  // ----------------------------------------------------------------------
  describe('updateArchiveReport', () => {
    it('should update archive report', async () => {
      mockService.getOrUpdateArchiveReport.mockResolvedValue({ updated: true });

      const result = await controller.updateArchiveReport('e1', { description: 'test' });

      expect((result as any).data.updated).toBe(true);
      expect(mockService.getOrUpdateArchiveReport).toHaveBeenCalledWith('e1', { description: 'test' });
    });
  });
});
