import { Test, TestingModule } from '@nestjs/testing';
import { BallotsService } from './ballots.service';
import { getModelToken } from '@nestjs/mongoose';
import { STATUS } from 'src/common/enums/status.enum';
import { MESSAGE } from 'src/common/enums/message.enum';
import { Types } from 'mongoose';

import { NotificationService } from '../notification/notification.service';
import { SigningService } from '../signature/signature.service';
import { MinioService } from '../minio/minio.service';
import { RedisService } from '../redis/redis.service';

// ===== Mock Helpers =====
const VALID_ID = '64b7e4b1c2a5f0c1aabbccdd';

const createModelMock = () => ({
  exists: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  create: jest.fn(),
  aggregate: jest.fn(),
  countDocuments: jest.fn(),
  exec: jest.fn(),
  lean: jest.fn(),
  populate: jest.fn(),
});

// Redis mock
const redisMock = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

// Minio mock
const minioMock = {
  uploadSignedPdf: jest.fn(),
};

// Signing mock
const signingMock = {
  signPdfWithP12: jest.fn(),
};

// Notification mock
const notificationMock = {
  transferDataRealTime: jest.fn(),
};

describe('BallotsService', () => {
  let service: BallotsService;

  // All models
  const ballotsModel = createModelMock();
  const electionsModel = createModelMock();
  const votersModel = createModelMock();
  const electionEntitiesModel = createModelMock();
  const votingRightsModel = createModelMock();
  const electionTypesModel = createModelMock();
  const usersModel = createModelMock();
  const electionDocumentsModel = createModelMock();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BallotsService,

        // Model tokens
        { provide: getModelToken('Ballots'), useValue: ballotsModel },
        { provide: getModelToken('Elections'), useValue: electionsModel },
        { provide: getModelToken('Voters'), useValue: votersModel },
        { provide: getModelToken('ElectionEntities'), useValue: electionEntitiesModel },
        { provide: getModelToken('VotingRights'), useValue: votingRightsModel },
        { provide: getModelToken('ElectionTypes'), useValue: electionTypesModel },
        { provide: getModelToken('Users'), useValue: usersModel },
        { provide: getModelToken('ElectionDocuments'), useValue: electionDocumentsModel },

        // Dependency services (IMPORTANT)
        { provide: NotificationService, useValue: notificationMock },
        { provide: SigningService, useValue: signingMock },
        { provide: MinioService, useValue: minioMock },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    service = module.get<BallotsService>(BallotsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ======================================================================================
  // 📌 TEST getById
  // ======================================================================================
  describe('getById', () => {
    it('should return ballot when found', async () => {
      ballotsModel.exists.mockResolvedValue(true);

      ballotsModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ _id: VALID_ID, ok: true }),
      });

      const res = await service.getById(VALID_ID);
      expect(res).toEqual({ _id: VALID_ID, ok: true });
    });

    it('should throw when ballot not found', async () => {
      ballotsModel.exists.mockResolvedValue(false);

      await expect(service.getById(VALID_ID)).rejects.toThrow(MESSAGE.BALLOT_NOT_FOUND);
    });
  });

  // ======================================================================================
  // 📌 TEST getByElectionId
  // ======================================================================================
  describe('getByElectionId', () => {
    it('should return ballots when election exists', async () => {
      electionsModel.exists.mockResolvedValue(true);

      ballotsModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ _id: VALID_ID }]),
      });

      const res = await service.getByElectionId(VALID_ID);
      expect(res).toEqual([{ _id: VALID_ID }]);
    });

    it('should throw when election not found', async () => {
      electionsModel.exists.mockResolvedValue(false);

      await expect(service.getByElectionId(VALID_ID)).rejects.toThrow(MESSAGE.ELECTION_NOT_FOUND);
    });
  });

  // ======================================================================================
  // 📌 TEST getByVoterId
  // ======================================================================================
  describe('getByVoterId', () => {
    it('should throw when voter does not exist', async () => {
      votersModel.exists.mockResolvedValue(false);

      await expect(service.getByVoterId(VALID_ID)).rejects.toThrow(MESSAGE.VOTER_NOT_FOUND);
    });

    it('should return ballots when voter exists', async () => {
      votersModel.exists.mockResolvedValue(true);

      ballotsModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ _id: VALID_ID }]),
      });

      const res = await service.getByVoterId(VALID_ID);
      expect(res).toEqual([{ _id: VALID_ID }]);
    });
  });

  // ======================================================================================
  // 📌 TEST create ballot
  // ======================================================================================
  describe('create', () => {
    const dto: any = {
      electionId: VALID_ID,
      voterId: VALID_ID,
      allocations: [],
    };

    it('should throw when election not found', async () => {
      electionsModel.findOne.mockResolvedValue(null);

      await expect(service.create(dto, VALID_ID)).rejects.toThrow(MESSAGE.ELECTION_NOT_FOUND);
    });

    it('should throw when voter not found', async () => {
      electionsModel.findOne.mockResolvedValue({ status: STATUS.ACTIVE });
      votersModel.findOne.mockResolvedValue(null);

      await expect(service.create(dto, VALID_ID)).rejects.toThrow(MESSAGE.VOTER_NOT_FOUND);
    });

    it('should create ballot successfully', async () => {
      electionsModel.findOne.mockResolvedValue({ status: STATUS.ACTIVE, typeId: VALID_ID });
      votersModel.findOne.mockResolvedValue({ status: STATUS.ACTIVE });

      ballotsModel.findOne.mockResolvedValue(null);

      electionTypesModel.findById.mockResolvedValue({ typeCode: 'NORMAL' });
      votingRightsModel.findOne.mockResolvedValue({ shares: 10, votes: 10 });

      ballotsModel.create.mockResolvedValue({ _id: VALID_ID });

      const result = await service.create(dto, VALID_ID);
      expect(result).toEqual({ _id: VALID_ID });
    });
  });

  // ======================================================================================
  // 📌 TEST updateStatus
  // ======================================================================================
  describe('updateStatus', () => {
    it('should throw when ballot not found', async () => {
      ballotsModel.findById.mockResolvedValue(null);

      await expect(service.updateStatus(VALID_ID, VALID_ID)).rejects.toThrow(
        MESSAGE.BALLOT_NOT_FOUND,
      );
    });

    it('should activate ballot successfully', async () => {
      const mockBallot = {
        electionId: VALID_ID,
        voterId: VALID_ID,
        status: STATUS.PENDING,
      };
      ballotsModel.findById.mockResolvedValue(mockBallot);

      electionsModel.findById.mockResolvedValue({ status: STATUS.ACTIVE });
      votersModel.findById.mockResolvedValue({ status: STATUS.ACTIVE });

      const updatedBallot = {
        ...mockBallot,
        status: STATUS.ACTIVE,
        issuedAt: new Date(),
        updatedBy: VALID_ID,
      };
      ballotsModel.findByIdAndUpdate.mockResolvedValue(updatedBallot);

      const res = await service.updateStatus(VALID_ID, VALID_ID);
      expect(res).toBeDefined();
      expect(res?.status).toBe(STATUS.ACTIVE);
    });
  });

  // ======================================================================================
  // 📌 TEST getStatistics
  // ======================================================================================
  describe('getStatistics', () => {
    it('should return statistics & notify realtime', async () => {
      ballotsModel.countDocuments.mockResolvedValue(10);
      ballotsModel.aggregate.mockResolvedValue([
        { _id: STATUS.PENDING, totalBallots: 5 },
      ]);

      const res = await service.getStatistics(VALID_ID);

      expect(notificationMock.transferDataRealTime).toHaveBeenCalled();
      expect(res.total).toBe(10);
    });
  });

  // ======================================================================================
  // 📌 TEST verifyOtp
  // ======================================================================================
  describe('verifyOtp', () => {
    it('should throw when ballot not found', async () => {
      ballotsModel.findById.mockResolvedValue(null);

      await expect(
        service.verifyOtp(VALID_ID, { email: 'a@a.com', otp: '123' }),
      ).rejects.toThrow(MESSAGE.BALLOT_NOT_FOUND);
    });

    it('should verify OTP successfully', async () => {
      ballotsModel.findById.mockResolvedValue({
        attempts: 0,
        save: jest.fn(),
      });

      usersModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ status: STATUS.ACTIVE }),
      });
      

      redisMock.get.mockResolvedValue('123');
      redisMock.set.mockResolvedValue(null);
      redisMock.del.mockResolvedValue(null);

      const result = await service.verifyOtp(VALID_ID, {
        email: 'a@a.com',
        otp: '123',
      });

      expect(result.verified).toBe(true);
    });
  });
});
