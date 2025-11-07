import { Test, TestingModule } from '@nestjs/testing';
import { VotingMethodsService } from './voting-methods.service';
import { getModelToken } from '@nestjs/mongoose';
import { VotingMethods } from 'src/database/schemas/votingMethods.schema';

describe('VotingMethodsService', () => {
  let service: VotingMethodsService;

  const mockVotingMethodsModel = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotingMethodsService,
        {
          provide: getModelToken(VotingMethods.name),
          useValue: mockVotingMethodsModel,
        },
      ],
    }).compile();

    service = module.get<VotingMethodsService>(VotingMethodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return voting method when found', async () => {
      const mockData = { methodCode: 'M01', name: 'Trực tuyến' };
      mockVotingMethodsModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockData),
      });

      const result = await service.findOne('M01');
      expect(result).toEqual(mockData);
      expect(mockVotingMethodsModel.findOne).toHaveBeenCalledWith({ methodCode: 'M01' });
    });

    it('should throw error when not found', async () => {
      mockVotingMethodsModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('INVALID')).rejects.toThrow('Voting Method Code not found');
    });
  });
});
