import { Test, TestingModule } from '@nestjs/testing';
import { ElectionEntitiesService } from './election-entities.service';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('ElectionEntitiesService', () => {
  let service: ElectionEntitiesService;

  const mockElectionEntityModel = {
    create: jest.fn(),
    exists: jest.fn(),
    findByIdAndUpdate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    }),
  };

  const mockElectionsModel = {
    exists: jest.fn(),
  };

  const mockElectionTypesModel = {
    exists: jest.fn(),
  };

  const mockParticipantsModel = {
    exists: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionEntitiesService,
        { provide: getModelToken('ElectionEntities'), useValue: mockElectionEntityModel },
        { provide: getModelToken('Elections'), useValue: mockElectionsModel },
        { provide: getModelToken('ElectionTypes'), useValue: mockElectionTypesModel },
        { provide: getModelToken('ElectionsParticipants'), useValue: mockParticipantsModel },
      ],
    }).compile();

    service = module.get<ElectionEntitiesService>(ElectionEntitiesService);
    jest.clearAllMocks();
  });

  // ===================================================
  // CREATE
  // ===================================================
  describe('create', () => {
    const userId = new Types.ObjectId().toHexString();
    const electionId = new Types.ObjectId().toHexString();
    const electionTypeId = new Types.ObjectId().toHexString();
    const proposerId = new Types.ObjectId().toHexString();

    it('should throw if election not found', async () => {
      mockElectionsModel.exists.mockResolvedValue(false);

      await expect(
        service.create({ electionId } as any, userId),
      ).rejects.toThrow(MESSAGE.ELECTION_NOT_FOUND);
    });

    it('should throw if election type not found', async () => {
      mockElectionsModel.exists.mockResolvedValue(true);
      mockElectionTypesModel.exists.mockResolvedValue(false);

      await expect(
        service.create({ electionId, electionTypeId } as any, userId),
      ).rejects.toThrow(MESSAGE.ELECTION_TYPE_NOT_FOUND);
    });

    it('should throw if no participants linked', async () => {
      mockElectionsModel.exists.mockResolvedValue(true);
      mockElectionTypesModel.exists.mockResolvedValue(true);
      mockParticipantsModel.exists.mockResolvedValue(false);

      await expect(
        service.create({ electionId, electionTypeId, proposerId } as any, userId),
      ).rejects.toThrow(MESSAGE.NO_PARTICIPANTS_LINKED);
    });

    it('should create entity successfully', async () => {
      mockElectionsModel.exists.mockResolvedValue(true);
      mockElectionTypesModel.exists.mockResolvedValue(true);
      mockParticipantsModel.exists.mockResolvedValue(true);

      const mockResult = {
        _id: new Types.ObjectId(),
        name: 'Entity A',
      };

      mockElectionEntityModel.create.mockResolvedValue(mockResult);

      const result = await service.create(
        { electionId, electionTypeId, proposerId } as any,
        userId,
      );

      expect(result).toEqual(mockResult);
    });
  });

  // ===================================================
  // UPDATE
  // ===================================================
  describe('update', () => {
    const id = new Types.ObjectId().toHexString();
    const userId = new Types.ObjectId().toHexString();
    const dto = { name: 'Updated Entity' };

    it('should update entity successfully', async () => {
      mockElectionEntityModel.exists.mockResolvedValue(true);

      const updated = { _id: id, ...dto };
      mockElectionEntityModel.findByIdAndUpdate().exec.mockResolvedValue(updated);

      const result = await service.update(id, dto as any, userId);

      expect(result).toEqual(updated);
    });
  });
});
