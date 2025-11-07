import { Test, TestingModule } from '@nestjs/testing';
import { ElectionTypesService } from './election-types.service';
import { getModelToken } from '@nestjs/mongoose';
import { ElectionTypes } from 'src/database/schemas/electionTypes.schema';

describe('ElectionTypesService', () => {
  let service: ElectionTypesService;

  const mockElectionTypesModel = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionTypesService,
        {
          provide: getModelToken(ElectionTypes.name),
          useValue: mockElectionTypesModel,
        },
      ],
    }).compile();

    service = module.get<ElectionTypesService>(ElectionTypesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return election type when found', async () => {
      const mockData = { typeCode: 'BGD', name: 'Ban Giám đốc' };
      mockElectionTypesModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockData),
      });

      const result = await service.findOne('BGD');
      expect(result).toEqual(mockData);
      expect(mockElectionTypesModel.findOne).toHaveBeenCalledWith({ typeCode: 'BGD' });
    });

    it('should throw error when not found', async () => {
      mockElectionTypesModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('INVALID')).rejects.toThrow('Không tìm thấy mã loại bầu cử');
    });
  });
});
