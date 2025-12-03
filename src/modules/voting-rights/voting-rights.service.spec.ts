import { Test, TestingModule } from '@nestjs/testing';
import { VotingRightsService } from './voting-rights.service';
import { getModelToken } from '@nestjs/mongoose';
import { MESSAGE } from 'src/common/enums/message.enum';
import { Types } from 'mongoose';

describe('VotingRightsService', () => {
  let service: VotingRightsService;

  const mockVotingRightModel = {
    findById: jest.fn(),
    find: jest.fn(),
    exists: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockElectionsModel = { exists: jest.fn() };
  const mockVotersModel = { exists: jest.fn() };

  const populateMock = {
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotingRightsService,
        { provide: getModelToken('VotingRights'), useValue: mockVotingRightModel },
        { provide: getModelToken('Elections'), useValue: mockElectionsModel },
        { provide: getModelToken('Voters'), useValue: mockVotersModel },
      ],
    }).compile();

    service = module.get<VotingRightsService>(VotingRightsService);
    jest.clearAllMocks();
  });

  // ===================================================================
  // getById
  // ===================================================================
  describe('getById', () => {
    it('should return voting right when found', async () => {
      const id = new Types.ObjectId().toString();
      const mockData = { _id: id };

      mockVotingRightModel.findById.mockReturnValue(populateMock);
      populateMock.exec.mockResolvedValue(mockData);

      const result = await service.getById(id);
      expect(result).toEqual(mockData);
    });

    it('should throw if not found', async () => {
      const id = new Types.ObjectId().toString();

      mockVotingRightModel.findById.mockReturnValue(populateMock);
      populateMock.exec.mockResolvedValue(null);

      await expect(service.getById(id)).rejects.toThrow(MESSAGE.VOTING_RIGHT_NOT_FOUND);
    });
  });

  // ===================================================================
  // getByElectionId
  // ===================================================================
  describe('getByElectionId', () => {
    it('should return voting rights', async () => {
      const electionId = new Types.ObjectId().toString();

      mockElectionsModel.exists.mockResolvedValue(true);

      const mockList = [{ id: 'vr1' }];

      mockVotingRightModel.find.mockReturnValue(populateMock);
      populateMock.exec.mockResolvedValue(mockList);

      const result = await service.getByElectionId(electionId);

      expect(result).toEqual(mockList);
    });
  });

  // ===================================================================
  // getByVoterId
  // ===================================================================
  describe('getByVoterId', () => {
    it('should return voting rights', async () => {
      const voterId = new Types.ObjectId().toString();

      mockVotersModel.exists.mockResolvedValue(true);

      const mockList = [{ id: 'vr1' }];

      mockVotingRightModel.find.mockReturnValue(populateMock);
      populateMock.exec.mockResolvedValue(mockList);

      const result = await service.getByVoterId(voterId);

      expect(result).toEqual(mockList);
    });
  });

  // ===================================================================
  // create
  // ===================================================================
  describe('create', () => {
    const electionId = new Types.ObjectId().toString();
    const voterId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    const dto = {
      electionId,
      voterId,
      shares: 10,
      votes: 10,
      status: 'ACTIVE',
    };

    it('should create voting right successfully', async () => {
      mockElectionsModel.exists.mockResolvedValue(true);
      mockVotersModel.exists.mockResolvedValue(true);
      mockVotingRightModel.exists.mockResolvedValue(false);

      const mockCreated = { id: 'vr1', ...dto };
      mockVotingRightModel.create.mockResolvedValue(mockCreated);

      const result = await service.create(dto, userId);
      expect(result).toEqual(mockCreated);
    });
  });

  // ===================================================================
  // update
  // ===================================================================
  describe('update', () => {
    it('should update voting right', async () => {
      const id = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();

      const dto = { shares: 99 };

      mockVotingRightModel.exists.mockResolvedValue(true);

      const mockUpdated = { _id: id, ...dto };

      mockVotingRightModel.findByIdAndUpdate.mockReturnValue(populateMock);
      populateMock.exec.mockResolvedValue(mockUpdated);

      const result = await service.update(id, dto as any, userId);

      expect(result).toEqual(mockUpdated);
    });
  });
});
