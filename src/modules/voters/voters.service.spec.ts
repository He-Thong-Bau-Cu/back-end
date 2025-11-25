import { Test, TestingModule } from '@nestjs/testing';
import { VotersService } from './voters.service';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';

describe('VotersService', () => {
  let service: VotersService;

  const mockModel = () => ({
    exists: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  });

  const mockVoterModel = mockModel();
  const mockElectionsModel = mockModel();
  const mockUserModel = mockModel();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotersService,
        { provide: getModelToken('Voters'), useValue: mockVoterModel },
        { provide: getModelToken('Elections'), useValue: mockElectionsModel },
        { provide: getModelToken('User'), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<VotersService>(VotersService);
  });

  afterEach(() => jest.clearAllMocks());

  // ================
  // ✅ CREATE TEST
  // ================
  describe('create', () => {
    const dto = { electionId: 'E01', userId: 'U01' };

    it('should throw if election not found', async () => {
      mockElectionsModel.exists.mockResolvedValue(false);
      await expect(service.create(dto as any)).rejects.toThrow('Election not found');
    });

    it('should throw if user not found', async () => {
      mockElectionsModel.exists.mockResolvedValue(true);
      mockUserModel.exists.mockResolvedValue(false);
      await expect(service.create(dto as any)).rejects.toThrow('User not found');
    });

    it('should create voter successfully', async () => {
      const mockData = { id: 'V001', ...dto };
      mockElectionsModel.exists.mockResolvedValue(true);
      mockUserModel.exists.mockResolvedValue(true);
      mockVoterModel.create.mockResolvedValue(mockData);

      const result = await service.create(dto as any);
      expect(result).toEqual(mockData);
      expect(mockVoterModel.create).toHaveBeenCalledWith(dto);
    });
  });

  // ================
  // ✅ UPDATE TEST
  // ================
  describe('update', () => {
    it('should throw if voter not found', async () => {
      mockVoterModel.exists.mockResolvedValue(false);
      await expect(service.update('id1', {} as any)).rejects.toThrow('Voter not found');
    });

    it('should update successfully', async () => {
      const mockData = { id: 'V001', status: 'active' };
      mockVoterModel.exists.mockResolvedValue(true);
      mockVoterModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockData),
      });

      const result = await service.update('507f1f77bcf86cd799439011', { status: 'active' } as any);
      expect(result).toEqual(mockData);
    });
  });
});
