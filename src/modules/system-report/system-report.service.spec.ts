import { Test, TestingModule } from '@nestjs/testing';
import { SystemReportService } from './system-report.service';
import { getModelToken } from '@nestjs/mongoose';

describe('SystemReportService', () => {
  let service: SystemReportService;

  // ------------ MOCK MODELS -------------
  const mockFindExec = jest.fn();
  const mockFind = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: mockFindExec,
  });

  const mockSystemLogModel = { find: mockFind };
  const mockAuditLogModel = { find: mockFind };
  const mockBackupModel = { find: mockFind };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemReportService,
        { provide: getModelToken('SystemLog'), useValue: mockSystemLogModel },
        { provide: getModelToken('AuditLogs'), useValue: mockAuditLogModel },
        { provide: getModelToken('Backups'), useValue: mockBackupModel },
      ],
    }).compile();

    service = module.get<SystemReportService>(SystemReportService);

    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // getOverview()
  // ---------------------------------------------------------
  describe('getOverview', () => {
    it('should return full overview report', async () => {
      mockFindExec
        .mockResolvedValueOnce([
          { statusCode: 200, responseTime: 100, method: 'GET', url: '/api', createdAt: new Date() },
          { statusCode: 500, responseTime: 200, method: 'GET', url: '/api', createdAt: new Date() },
        ])
        .mockResolvedValueOnce([
          { module: 'Election', action: 'update', createdAt: new Date(), userId: { fullName: 'Alice' } },
        ])
        .mockResolvedValueOnce([
          { action: 'BACKUP', createdAt: new Date() },
        ]);

      const result = await service.getOverview({});

      expect(result.summary.totalRequests).toBe(2);
      expect(result.auditSummary.totalAudits).toBe(1);
      expect(result.backupSummary.totalBackups).toBe(1);
    });
  });

  // ---------------------------------------------------------
  // exportReport()
  // ---------------------------------------------------------
  describe('exportReport', () => {
    it('should return JSON report buffer', async () => {
      jest.spyOn(service, 'getOverview').mockResolvedValue({ test: 1 } as any);

      const res = await service.exportReport({ format: 'json' });

      expect(res.mimeType).toBe('application/json');
      expect(res.buffer).toBeInstanceOf(Buffer);
    });

    it('should return CSV report buffer', async () => {
      jest.spyOn(service, 'getOverview').mockResolvedValue({
        summary: { totalRequests: 1, successCount: 1, errorCount: 0, successRate: 100, errorRate: 0, avgResponseTime: 100 },
        timeline: [],
        topEndpoints: [],
        auditSummary: { topModules: [], actions: {}, latestActivities: [] },
        backupSummary: { actions: {}, totalBackups: 0 },
      } as any);

      const res = await service.exportReport({ format: 'csv' });

      expect(res.mimeType).toContain('text/csv');
      expect(res.buffer).toBeInstanceOf(Buffer);
    });
  });

  // ---------------------------------------------------------
  // resolveDateRange()
  // ---------------------------------------------------------
  describe('resolveDateRange', () => {
    it('should return last 30 days if empty', () => {
      const res = (service as any).resolveDateRange(undefined, undefined);
      expect(res.toDate).toBeInstanceOf(Date);
      expect(res.fromDate).toBeInstanceOf(Date);
    });

    it('should throw if from > to', () => {
      expect(() =>
        (service as any).resolveDateRange(new Date('2025-01-10'), new Date('2025-01-01')),
      ).toThrow();
    });
  });

  // ---------------------------------------------------------
  // buildSummary()
  // ---------------------------------------------------------
  describe('buildSummary', () => {
    it('should calculate summary correctly', () => {
      const logs = [
        { statusCode: 200, responseTime: 100 },
        { statusCode: 500, responseTime: 300 },
      ] as any[];

      const result = (service as any).buildSummary(logs);

      expect(result.totalRequests).toBe(2);
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(1);
      expect(result.avgResponseTime).toBe(200);
    });
  });

  // ---------------------------------------------------------
  // buildTimeline()
  // ---------------------------------------------------------
  describe('buildTimeline', () => {
    it('should create timeline buckets', () => {
      const logs = [
        { createdAt: new Date('2025-01-01'), statusCode: 200, responseTime: 50 },
        { createdAt: new Date('2025-01-01'), statusCode: 500, responseTime: 100 },
      ] as any[];

      const result = (service as any).buildTimeline(logs, 'day');

      expect(result.length).toBe(1);
      expect(result[0].requests).toBe(2);
      expect(result[0].errors).toBe(1);
      expect(result[0].avgResponseTime).toBe(75);
    });
  });

  // ---------------------------------------------------------
  // buildTopEndpoints()
  // ---------------------------------------------------------
  describe('buildTopEndpoints', () => {
    it('should return top endpoints', () => {
      const logs = [
        { method: 'GET', url: '/a', responseTime: 50, statusCode: 200 },
        { method: 'GET', url: '/a', responseTime: 150, statusCode: 500 },
        { method: 'POST', url: '/b', responseTime: 100, statusCode: 200 },
      ] as any[];

      const result = (service as any).buildTopEndpoints(logs);
      expect(result.length).toBe(2);
      expect(result[0].endpoint).toBe('/a');
      expect(result[0].requests).toBe(2);
    });
  });

  // ---------------------------------------------------------
  // buildAuditSummary()
  // ---------------------------------------------------------
  describe('buildAuditSummary', () => {
    it('should build audit summary', () => {
      const audits = [
        { module: 'Election', action: 'create', createdAt: new Date(), userId: { fullName: 'A' } },
        { module: 'Election', action: 'update', createdAt: new Date(), userId: { fullName: 'B' } },
        { module: 'User', action: 'login', createdAt: new Date(), userId: null },
      ] as any[];

      const result = (service as any).buildAuditSummary(audits);

      expect(result.totalAudits).toBe(3);
      expect(result.topModules[0].module).toBe('Election');
      expect(result.latestActivities.length).toBe(3);
    });
  });

  // ---------------------------------------------------------
  // buildBackupSummary()
  // ---------------------------------------------------------
  describe('buildBackupSummary', () => {
    it('should build backup summary', () => {
      const backups = [
        { action: 'BACKUP', createdAt: new Date() },
        { action: 'RESTORE', createdAt: new Date() },
        { action: 'BACKUP', createdAt: new Date() },
      ] as any[];

      const result = (service as any).buildBackupSummary(backups);

      expect(result.totalBackups).toBe(3);
      expect(result.actions['BACKUP']).toBe(2);
      expect(result.actions['RESTORE']).toBe(1);
    });
  });
});
