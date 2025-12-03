import { Test, TestingModule } from '@nestjs/testing';
import { BoardControlService } from './board-control.service';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { STATUS } from 'src/common/enums/status.enum';
import { MESSAGE } from 'src/common/enums/message.enum';

// Mongo ObjectId hợp lệ để tránh ensureObjectId() throw lỗi
const VALID_OBJECT_ID = '64b7e4b1c2a5f0c1aabbccdd';

// Helper mock Model
const createModelMock = () => ({
  findById: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  exec: jest.fn(),
  lean: jest.fn(),
  populate: jest.fn(),
});

describe('BoardControlService', () => {
  let service: BoardControlService;

  const electionsModel = createModelMock();
  const votersModel = createModelMock();
  const ballotsModel = createModelMock();
  const resultsModel = createModelMock();
  const auditLogsModel = createModelMock();
  const systemLogModel = createModelMock();
  const reportsModel = createModelMock();
  const electionParticipantsModel = createModelMock();
  const rolesModel = createModelMock();
  const usersModel = createModelMock();
  const meetingsModel = createModelMock();
  const meetingAttendeesModel = createModelMock();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardControlService,
        { provide: getModelToken('Elections'), useValue: electionsModel },
        { provide: getModelToken('Voters'), useValue: votersModel },
        { provide: getModelToken('Ballots'), useValue: ballotsModel },
        { provide: getModelToken('Results'), useValue: resultsModel },
        { provide: getModelToken('AuditLogs'), useValue: auditLogsModel },
        { provide: getModelToken('SystemLog'), useValue: systemLogModel },
        { provide: getModelToken('Reports'), useValue: reportsModel },
        { provide: getModelToken('ElectionsParticipants'), useValue: electionParticipantsModel },
        { provide: getModelToken('Roles'), useValue: rolesModel },
        { provide: getModelToken('Users'), useValue: usersModel },
        { provide: getModelToken('Meetings'), useValue: meetingsModel },
        { provide: getModelToken('MeetingAttendees'), useValue: meetingAttendeesModel },
      ],
    }).compile();

    service = module.get<BoardControlService>(BoardControlService);
  });

  afterEach(() => jest.clearAllMocks());

  // =====================================================================
  // TEST: getElectionOrThrow
  // =====================================================================
  describe('getElectionOrThrow', () => {
    it('should return election when exists', async () => {
      const mockElection = { _id: VALID_OBJECT_ID, title: 'Test Election' };

      electionsModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockElection),
      });

      const result = await (service as any).getElectionOrThrow(VALID_OBJECT_ID);
      expect(result).toEqual(mockElection);
    });

    it('should throw NotFoundException when election not found', async () => {
      electionsModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect((service as any).getElectionOrThrow(VALID_OBJECT_ID))
        .rejects.toThrow(NotFoundException);
    });
  });

  // =====================================================================
  // TEST: getOrCreateReport
  // =====================================================================
  describe('getOrCreateReport', () => {
    it('should return existing report', async () => {
      const mockReport = { _id: 'rep1', type: 'VERIFICATION' };

      reportsModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReport),
      });

      const result = await (service as any).getOrCreateReport(VALID_OBJECT_ID, 'VERIFICATION');
      expect(result).toEqual(mockReport);
    });

    it('should create report if not exists', async () => {
      reportsModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const createdReport = { _id: 'rep_new', type: 'VERIFICATION' };
      reportsModel.create.mockResolvedValue(createdReport);

      const result = await (service as any).getOrCreateReport(VALID_OBJECT_ID, 'VERIFICATION');
      expect(result).toEqual(createdReport);
      expect(reportsModel.create).toHaveBeenCalled();
    });
  });

  // =====================================================================
  // TEST: getVotingOverview
  // =====================================================================
  describe('getVotingOverview', () => {
    it('should return voting summary', async () => {
      electionsModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: VALID_OBJECT_ID,
          title: 'Election 1',
          endDate: new Date(Date.now() + 60000),
        }),
      });

      votersModel.countDocuments.mockResolvedValue(100);
      ballotsModel.countDocuments
        .mockResolvedValueOnce(120)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(10);

      const result = await service.getVotingOverview(VALID_OBJECT_ID);

      expect(result.summary.voted).toBe(80);
      expect(result.ballots.invalid).toBe(3);
      expect(result.summary.total).toBe(100);
    });
  });

  // =====================================================================
  // TEST: approveVerification
  // =====================================================================
  describe('approveVerification', () => {
    it('should throw if no userId', async () => {
      await expect(service.approveVerification(VALID_OBJECT_ID, undefined))
        .rejects.toThrow(BadRequestException);
    });

    it('should sign verification report', async () => {
      const mockReport = { save: jest.fn(), summary: null };

      reportsModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReport),
      });

      const result = await service.approveVerification(VALID_OBJECT_ID, VALID_OBJECT_ID);

      expect(mockReport.save).toHaveBeenCalled();
      expect(result.isConfirmed).toBe(true);
    });
  });

  // =====================================================================
  // TEST: confirmAuditReport
  // =====================================================================
  describe('confirmAuditReport', () => {
    it('should confirm and sign audit report', async () => {
      const mockReport = { save: jest.fn() };

      reportsModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockReport),
      });

      usersModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({ fullName: 'Tester' }),
      });

      const result = await service.confirmAuditReport(VALID_OBJECT_ID, VALID_OBJECT_ID);

      expect(mockReport.save).toHaveBeenCalled();
      expect(result.signerName).toBe('Tester');
    });
  });

  // =====================================================================
  // TEST: getAuditReport
  // =====================================================================
  describe('getAuditReport', () => {
    it('should return audit report structure', async () => {

      // Mock election
      electionsModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: VALID_OBJECT_ID,
          title: 'Election',
          startDate: new Date(),
          endDate: new Date(),
        }),
      });

      // chưa có report => create
      reportsModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      reportsModel.create.mockResolvedValue({
        _id: VALID_OBJECT_ID,
        status: STATUS.PENDING,
      });

      // Mock đầy đủ populate chain
      reportsModel.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: VALID_OBJECT_ID,
          type: 'AUDIT',
          status: STATUS.PENDING,
          createdAt: new Date(),
          electionId: { title: 'Election' },
          signedBy: null,
          createdBy: null,
        }),
      });

      systemLogModel.countDocuments.mockResolvedValue(10);

      auditLogsModel.find.mockReturnValue({
        sort: () => ({
          limit: () => ({
            populate: () => ({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const result = await service.getAuditReport(VALID_OBJECT_ID);

      expect(result.info).toBeDefined();
      expect(result.logs).toBeInstanceOf(Array);
      expect(result.summaryCards).toBeDefined();
    });
  });
});
