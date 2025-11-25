import { Test, TestingModule } from '@nestjs/testing';
import { VotingRightsService } from './voting-rights.service';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';

// ✅ Bỏ lỗi ObjectId validation trong test
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  Types: {
    ObjectId: jest.fn().mockImplementation((id) => id),
  },
}));

describe('VotingRightsService', () => {
  let service: VotingRightsService;

  // Mock mongoose model
  const mockModel = () => ({
    exists: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  });

  const mockVotingRightsModel = mockModel();
  const mockElectionsModel = mockModel();
  const mockVotersModel = mockModel();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotingRightsService,
        { provide: getModelToken('VotingRights'), useValue: mockVotingRightsModel },
        { provide: getModelToken('Elections'), useValue: mockElectionsModel },
        { provide: getModelToken('Voters'), useValue: mockVotersModel },
      ],
    }).compile();

    service = module.get<VotingRightsService>(VotingRightsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ===========================
  // ✅ CREATE
  // ===========================
  describe('create', () => {
    const dto = { electionId: 'E001', voterId: 'V001' };

    it('should throw if election not found', async () => {
      mockElectionsModel.exists.mockResolvedValue(false);
      await expect(service.create(dto as any)).rejects.toThrow('Election not found');
    });

    it('should throw if voter not found', async () => {
      mockElectionsModel.exists.mockResolvedValue(true);
      mockVotersModel.exists.mockResolvedValue(false);
      await expect(service.create(dto as any)).rejects.toThrow('Voter not found');
    });

    it('should create voting right successfully', async () => {
      const mockData = { id: 'R001', ...dto };
      mockElectionsModel.exists.mockResolvedValue(true);
      mockVotersModel.exists.mockResolvedValue(true);
      mockVotingRightsModel.create.mockResolvedValue(mockData);

      const result = await service.create(dto as any);
      expect(result).toEqual(mockData);
      expect(mockVotingRightsModel.create).toHaveBeenCalledWith(dto);
    });
  });

  // ===========================
  // ✅ UPDATE
  // ===========================
  describe('update', () => {
    const updateDto = { status: 'active' };

    it('should throw if voting right not found', async () => {
      mockVotingRightsModel.exists.mockResolvedValue(false);
      await expect(service.update('507f1f77bcf86cd799439011', updateDto as any))
        .rejects.toThrow('Voting right not found');
    });

    it('should update successfully', async () => {
      const mockData = { id: 'R001', status: 'active' };
      mockVotingRightsModel.exists.mockResolvedValue(true);
      mockVotingRightsModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockData),
      });

      const result = await service.update('507f1f77bcf86cd799439011', updateDto as any);
      expect(result).toEqual(mockData);
    });
  });
});
