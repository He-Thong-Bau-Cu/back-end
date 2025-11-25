import { Test, TestingModule } from '@nestjs/testing';
import { ThresholdsService } from './thresholds.service';
import { getModelToken } from '@nestjs/mongoose';
import { Thresholds } from 'src/database/schemas/thresholds.schema';

describe('ThresholdsService', () => {
  let service: ThresholdsService;

  const mockThresholdsModel = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThresholdsService,
        {
          provide: getModelToken(Thresholds.name),
          useValue: mockThresholdsModel,
        },
      ],
    }).compile();

    service = module.get<ThresholdsService>(ThresholdsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return threshold when found', async () => {
      const mockData = { thresholdCode: 'TH001', value: 75 };
      mockThresholdsModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockData),
      });

      const result = await service.findOne('TH001');
      expect(result).toEqual(mockData);
      expect(mockThresholdsModel.findOne).toHaveBeenCalledWith({ thresholdCode: 'TH001' });
    });

    it('should throw error when not found', async () => {
      mockThresholdsModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('INVALID')).rejects.toThrow('Threshold Code not found');
    });
  });
});
