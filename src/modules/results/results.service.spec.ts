import { Test, TestingModule } from '@nestjs/testing';
import { ResultsService } from './results.service';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { STATUS } from 'src/common/enums/status.enum';
import { MESSAGE } from 'src/common/enums/message.enum';

import { SigningService } from '../signature/signature.service';
import { MinioService } from '../minio/minio.service';
import { MailService } from '../mail/mail.service';

const oid = () => new Types.ObjectId().toString();

// Generic mock model
const mockModel = () => ({
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findByIdAndUpdate: jest.fn().mockReturnThis(),
  exists: jest.fn(),
  create: jest.fn(),
  populate: jest.fn().mockReturnThis(),
  exec: jest.fn(),
  aggregate: jest.fn(),
});

describe('ResultsService', () => {
  let service: ResultsService;

  const resultsModel = mockModel();
  const electionsModel = mockModel();
  const entitiesModel = mockModel();
  const ballotsModel = mockModel();
  const votingMethodsModel = mockModel();
  const documentsModel = mockModel();
  const participantsModel = mockModel();

  const signingService = { signPdfWithP12: jest.fn() };
  const minioService = { uploadSignedPdf: jest.fn() };
  const mailService = { sendMailResult: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,

        { provide: getModelToken('Results'), useValue: resultsModel },
        { provide: getModelToken('Elections'), useValue: electionsModel },
        { provide: getModelToken('ElectionEntities'), useValue: entitiesModel },
        { provide: getModelToken('Ballots'), useValue: ballotsModel },
        { provide: getModelToken('VotingMethods'), useValue: votingMethodsModel },
        { provide: getModelToken('ElectionDocuments'), useValue: documentsModel },
        { provide: getModelToken('ElectionsParticipants'), useValue: participantsModel },

        // 🔥🔥 FIX CHUẨN DI TOKEN — phải dùng CLASS chứ không dùng STRING
        { provide: SigningService, useValue: signingService },
        { provide: MinioService, useValue: minioService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<ResultsService>(ResultsService);
    jest.clearAllMocks();
  });

  // ============================================================
  // GET BY ID
  // ============================================================
  it('should return result by id', async () => {
    const id = oid();

    resultsModel.exists.mockResolvedValue(true);
    resultsModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve({ _id: id }),
    });

    const result = await service.getById(id);

    expect((result as any)._id).toBe(id);
    expect(resultsModel.exists).toHaveBeenCalled();
  });

  // ============================================================
  // GET BY ELECTION ID
  // ============================================================
  it('should return results by election id', async () => {
    const electionId = oid();

    electionsModel.exists.mockResolvedValue(true);
    resultsModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve([{ id: 'r1' }]),
    });

    const result = await service.getByElectionId(electionId);

    expect(result.length).toBe(1);
  });

  // ============================================================
  // SEARCH RESULTS
  // ============================================================
  it('should search results', async () => {
    electionsModel.find.mockReturnValue({
      collation: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve([{ _id: oid() }]),
    });

    entitiesModel.find.mockReturnValue({
      collation: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve([{ _id: oid() }]),
    });

    resultsModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve([{ id: 'r1' }]),
    });

    const res = await service.search({ keyword: 'abc' });

    expect(res.length).toBe(1);
  });

  // ============================================================
  // UPDATE
  // ============================================================
  it('should update result', async () => {
    const id = oid();
    const updateDto = { votesCount: 10 };

    resultsModel.exists.mockResolvedValue(true);

    resultsModel.findByIdAndUpdate.mockReturnValue({
      exec: () => Promise.resolve({ _id: id, votesCount: 10 }),
    });

    const result = await service.update(id, updateDto as any, oid());

    expect((result as any).votesCount).toBe(10);
  });

  // ============================================================
  // CUMULATIVE
  // ============================================================
  it('should return cumulative winners', async () => {
    ballotsModel.aggregate.mockResolvedValue([
      { _id: oid(), totalVotes: 10, entityTitle: 'Option A' },
      { _id: oid(), totalVotes: 5, entityTitle: 'Option B' },
    ]);

    const winners = await service.getWinnersCumulative(oid());

    expect(winners.length).toBe(2);
    expect(winners[0].percentage).toBe(66.67);
  });

  // ============================================================
  // YES / NO / ABSTAIN
  // ============================================================
  it('should return yes/no/abstain winners', async () => {
    ballotsModel.aggregate
      .mockResolvedValueOnce([
        { _id: 1, total: 5 },
        { _id: 0, total: 3 },
        { _id: -1, total: 2 },
      ])
      .mockResolvedValueOnce([
        {
          _id: oid(),
          agree: 5,
          disagree: 3,
          abstain: 2,
          entityTitle: 'Option A',
        },
      ]);

    const result = await service.getWinnersYesNo(oid());

    expect(result.length).toBe(1);
    expect(result[0].percentage).toBe(50);
  });

  // ============================================================
  // CREATE & SIGN
  // ============================================================
  it('should create and sign result', async () => {
    const electionId = oid();
    const userId = oid();

    electionsModel.findById.mockReturnValue({
      exec: () =>
        Promise.resolve({
          _id: electionId,
          title: "Test election",
          votingMethodId: oid(),
        }),
    });

    votingMethodsModel.findById.mockResolvedValue({
      methodCode: "CUMULATIVE",
    });

    jest
      .spyOn(service, 'getWinnersCumulative')
      .mockResolvedValue([{ _id: oid(), totalVotes: 10 }]);

    jest.spyOn(service, 'generateResultPdf').mockResolvedValue(Buffer.from("pdf"));

    signingService.signPdfWithP12.mockResolvedValue(Buffer.from("signed"));

    participantsModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve([]),
    });

    minioService.uploadSignedPdf.mockResolvedValue({ url: "minio-link" });

    const result = await service.createAndSign(
      { buffer: Buffer.from("file") } as any,
      "123456",
      electionId,
      userId,
    );

    expect(result.url).toBe("minio-link");
  });
});
