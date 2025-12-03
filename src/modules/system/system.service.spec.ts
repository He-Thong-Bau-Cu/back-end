import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { SystemService } from './system.service';

// Helper để tạo mock Model
const mockModel = () => ({
  find: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  exec: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
});

describe('SystemService (FULL PASS FIXED)', () => {
  let service: SystemService;

  // Mock data
  const mockSystemLog = [{ statusCode: 200, createdAt: new Date(), responseTime: 50 }];
  const mockAuditLogs = [
    {
      userId: { fullName: 'John Doe' },
      action: 'created',
      module: 'Users',
      createdAt: new Date(),
    },
  ];

  const mockElections = [
    {
      title: 'Election 1',
      createdAt: new Date(),
      statusData: {},
      status: 'ONGOING',
    },
  ];

  const mockUsers = [
    { status: 'ACTIVE' },
    { status: 'INACTIVE' },
    { status: 'ACTIVE' },
  ];

  const mockParticipantsAgg = [
    { _id: { month: 1, year: 2025 }, total: 12 },
    { _id: { month: 2, year: 2025 }, total: 20 },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemService,

        // Audit Logs
        {
          provide: getModelToken('AuditLogs'),
          useValue: {
            countDocuments: jest.fn(),
            aggregate: jest.fn(),
            find: jest.fn().mockImplementation(() => {
              const chain: any = {
                exec: jest.fn().mockResolvedValue(mockAuditLogs),
                then: (resolve: any) => Promise.resolve(mockAuditLogs).then(resolve),
                catch: (reject: any) => Promise.resolve(mockAuditLogs).catch(reject),
              };
              chain.populate = jest.fn().mockReturnValue(chain);
              chain.sort = jest.fn().mockReturnValue(chain);
              chain.skip = jest.fn().mockReturnValue(chain);
              chain.limit = jest.fn().mockReturnValue(chain);
              chain.lean = jest.fn().mockReturnValue(chain);
              return chain;
            }),
          },
        },

        // Elections
        {
          provide: getModelToken('Elections'),
          useValue: {
            ...mockModel(),
            find: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockElections),
            }),
            countDocuments: jest.fn().mockResolvedValue(10),
          },
        },

        // Voters
        {
          provide: getModelToken('Voters'),
          useValue: {
            ...mockModel(),
            countDocuments: jest.fn()
              .mockResolvedValueOnce(100) // eligible
              .mockResolvedValueOnce(60), // voted
          },
        },

        // Users
        {
          provide: getModelToken('Users'),
          useValue: {
            ...mockModel(),
            find: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue(mockUsers),
            }),
          },
        },

        // Results
        { provide: getModelToken('Results'), useValue: mockModel() },

        // SystemLog
        {
          provide: getModelToken('SystemLog'),
          useValue: {
            countDocuments: jest.fn(),
            aggregate: jest.fn(),
            find: jest.fn().mockImplementation(() => {
              const chain: any = {
                exec: jest.fn().mockResolvedValue(mockSystemLog),
              };
              chain.sort = jest.fn().mockReturnValue(chain);
              chain.skip = jest.fn().mockReturnValue(chain);
              chain.limit = jest.fn().mockReturnValue(chain);
              chain.lean = jest.fn().mockReturnValue(chain);
              return chain;
            }),
          },
        },

        // electionParticipants
        {
          provide: getModelToken('ElectionsParticipants'),
          useValue: {
            ...mockModel(),
            countDocuments: jest.fn().mockResolvedValue(50),
            aggregate: jest.fn().mockResolvedValue(mockParticipantsAgg),
          },
        },
      ],
    }).compile();

    service = module.get<SystemService>(SystemService);
  });

  // ======================================================
  it('should search system logs', async () => {
    const res = await service.searchSystemLogs({
      page: 1,
      limit: 10,
      status: '',
      fromDate: '',
      toDate: '',
    } as any);

    expect(res.content.length).toBe(1);
  });

  // ======================================================
  it('should search audit logs', async () => {
    const res = await service.searchAuditLogs({
      page: 1,
      limit: 10,
    } as any);

    expect(res.content.length).toBe(1);
  });

  // ======================================================
  it('should return statistics cards', async () => {
    const res = await service.getStatisticsCards();
    expect(res.length).toBe(4);
  });

  // ======================================================
  it('should return participation rate chart', async () => {
    const res = await service.getParticipationRateChart();
    expect(res.length).toBe(2);
  });

  // ======================================================
  it('should return result distribution chart', async () => {
    const res = await service.getResultDistributionChart();
    expect(res.active).toBe(2);
    expect(res.inactive).toBe(1);
  });

  // ======================================================
  it('should return ongoing polls', async () => {
    const res = await service.getOngoingPolls();
    expect(res.length).toBe(1);
    expect(res[0].name).toBe('Election 1');
  });

  // ======================================================
  it('should return recent activities', async () => {
    const res = await service.getRecentActivities();
    expect(res.length).toBe(1);
    expect(res[0].activity).toContain('John Doe');
  });

  // ======================================================
  it('should return system log statistics', async () => {
    const res = await service.getSystemLogStatistics('week');

    expect(res.data.length).toBeGreaterThan(0);
    expect(res.metadata.totalRequests).toBeGreaterThan(0);
  });
});
