import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { MESSAGE } from 'src/common/enums/message.enum';
import { SigningService } from '../signature/signature.service';
import { MinioService } from '../minio/minio.service';
import { MailService } from '../mail/mail.service';

const oid = () => new Types.ObjectId().toString();

// Mock model
const mockModel = () => ({
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findByIdAndUpdate: jest.fn().mockReturnThis(),
  exists: jest.fn(),
  create: jest.fn(),
  populate: jest.fn().mockReturnThis(),
  exec: jest.fn(),
});

describe('ReportsService', () => {
  let service: ReportsService;

  const reportModel = mockModel();
  const electionsModel = mockModel();
  const participantsModel = mockModel();
  const electionDocumentsModel = mockModel();
  const usersModel = mockModel();
  const mockSigningService = {
    signDocument: jest.fn(),
  };
  const mockMinioService = {
    uploadFile: jest.fn(),
    getFileBuffer: jest.fn(),
  };
  const mockMailService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getModelToken('Reports'), useValue: reportModel },
        { provide: getModelToken('Elections'), useValue: electionsModel },
        { provide: getModelToken('ElectionsParticipants'), useValue: participantsModel },
        { provide: getModelToken('ElectionDocuments'), useValue: electionDocumentsModel },
        { provide: getModelToken('Users'), useValue: usersModel },
        { provide: SigningService, useValue: mockSigningService },
        { provide: MinioService, useValue: mockMinioService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    jest.clearAllMocks();
  });

  // ============================================================
  // CREATE
  // ============================================================
  it('should create report successfully', async () => {
    const electionId = oid();
    const userId = oid();

    electionsModel.exists.mockResolvedValue(true);

    reportModel.create.mockResolvedValue({
      _id: oid(),
      electionId,
      createdBy: userId,
    });

    const dto = { electionId };

    const result = await service.create(dto as any, userId);

    expect(reportModel.create).toHaveBeenCalled();
    expect(result._id).toBeDefined();
  });

  it('should throw when election does not exist on create', async () => {
    electionsModel.exists.mockResolvedValue(false);

    await expect(
      service.create({ electionId: oid() } as any, oid()),
    ).rejects.toThrow(MESSAGE.ELECTION_NOT_FOUND);
  });

  // ============================================================
  // FIND ALL
  // ============================================================
  it('should return all reports', async () => {
    reportModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve([{ id: 'r1' }]),
    });

    const result = await service.findAll();

    expect(result.length).toBe(1);
  });

  // ============================================================
  // GET BY ID
  // ============================================================
  it('should return report by id', async () => {
    const id = oid();

    reportModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve({ _id: id }),
    });

    const result = await service.getById(id);

    expect(result._id).toBe(id);
  });

  it('should throw when report not found by id', async () => {
    reportModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve(null),
    });

    await expect(service.getById(oid())).rejects.toThrow(MESSAGE.REPORT_NOT_FOUND);
  });

  // ============================================================
  // GET BY ELECTION ID
  // ============================================================
  it('should return reports by election id', async () => {
    const electionId = oid();

    electionsModel.exists.mockResolvedValue(true);

    reportModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve([{ _id: oid() }]),
    });

    const results = await service.getByElectionId(electionId);

    expect(results.length).toBe(1);
  });

  it('should throw when election not found for getByElectionId', async () => {
    electionsModel.exists.mockResolvedValue(false);

    await expect(service.getByElectionId(oid())).rejects.toThrow(MESSAGE.ELECTION_NOT_FOUND);
  });

  it('should throw when no report found for election', async () => {
    const electionId = oid();

    electionsModel.exists.mockResolvedValue(true);

    reportModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve(null),
    });

    await expect(service.getByElectionId(electionId)).rejects.toThrow(MESSAGE.REPORT_NOT_FOUND);
  });

  // ============================================================
  // UPDATE
  // ============================================================
  it('should update report successfully', async () => {
    const id = oid();

    reportModel.exists.mockResolvedValue(true);

    reportModel.findByIdAndUpdate.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () =>
        Promise.resolve({
          _id: id,
          updatedBy: oid(),
        }),
    });

    const result = await service.update(id, {} as any, oid());

    expect((result as any)._id).toBe(id);
  });

  it('should throw when updating non-existing report', async () => {
    reportModel.exists.mockResolvedValue(false);

    await expect(service.update(oid(), {} as any, oid())).rejects.toThrow(
      MESSAGE.REPORT_NOT_FOUND,
    );
  });
});
