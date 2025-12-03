import { Test, TestingModule } from '@nestjs/testing';
import { ThresholdsService } from './thresholds.service';
import { getModelToken } from '@nestjs/mongoose';
import { MESSAGE } from 'src/common/enums/message.enum';
import { Types } from 'mongoose';

describe('ThresholdsService', () => {
  let service: ThresholdsService;

  const populateMock = {
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockThresholdModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThresholdsService,
        {
          provide: getModelToken('Thresholds'),
          useValue: mockThresholdModel,
        },
      ],
    }).compile();

    service = module.get<ThresholdsService>(ThresholdsService);

    jest.clearAllMocks();
  });

  // ----------------------------------------------------------------------
  // findOne
  // ----------------------------------------------------------------------

  describe('findOne', () => {
    it('should return threshold when found', async () => {
      const mockData = { thresholdCode: 'TH01', value: 70 };

      mockThresholdModel.findOne.mockReturnValue(populateMock);
      populateMock.exec.mockResolvedValue(mockData);

      const result = await service.findOne('TH01');

      expect(result).toEqual(mockData);
      expect(mockThresholdModel.findOne).toHaveBeenCalledWith({ thresholdCode: 'TH01' });
    });

    it('should throw error when threshold not found', async () => {
      mockThresholdModel.findOne.mockReturnValue(populateMock);
      populateMock.exec.mockResolvedValue(null);

      await expect(service.findOne('TH99')).rejects.toThrow(
        MESSAGE.THRESHOLD_CODE_NOT_FOUND
      );
    });
  });

  // ----------------------------------------------------------------------
  // getById
  // ----------------------------------------------------------------------

  describe('getById', () => {
    it('should return threshold when found', async () => {
      const mockData = { id: '1', value: 80 };

      mockThresholdModel.findById.mockReturnValue(populateMock);
      populateMock.exec.mockResolvedValue(mockData);

      const id = new Types.ObjectId().toString();
      const result = await service.getById(id);

      expect(result).toEqual(mockData);
      expect(mockThresholdModel.findById).toHaveBeenCalled();
    });

    it('should throw error when not found', async () => {
      mockThresholdModel.findById.mockReturnValue(populateMock);
      populateMock.exec.mockResolvedValue(null);

      const id = new Types.ObjectId().toString();

      await expect(service.getById(id)).rejects.toThrow(
        MESSAGE.THRESHOLD_NOT_FOUND
      );
    });
  });

  // ----------------------------------------------------------------------
  // search
  // ----------------------------------------------------------------------

  describe('search', () => {
    it('should return paginated search results', async () => {
      const mockList = [{ id: '1' }, { id: '2' }];
  
      mockThresholdModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockList),
      });
  
      const req = { keyword: 'test', page: 1, limit: 10 };
  
      const result = await service.search(req);
  
      expect(mockThresholdModel.find).toHaveBeenCalled();
  
      expect(result.totalItems).toBe(2);
      expect(result.content.length).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });
  

  // ----------------------------------------------------------------------
  // create
  // ----------------------------------------------------------------------

  describe('create', () => {
    it('should create threshold successfully', async () => {
      const dto = {
        thresholdCode: 'TH01',
        thresholdName: 'Ngưỡng 01',
        thresholdType: 'AUTO',
        description: 'Test',
        status: 'ACTIVE',
        value: 90,
      };

      const mockCreated = { id: '1', ...dto };

      mockThresholdModel.create.mockResolvedValue(mockCreated);

      const userId = new Types.ObjectId().toString();
      const result = await service.create(dto, userId);

      expect(result).toEqual(mockCreated);

      expect(mockThresholdModel.create).toHaveBeenCalledWith({
        ...dto,
        createdBy: new Types.ObjectId(userId),
      });
    });
  });

  // ----------------------------------------------------------------------
  // update
  // ----------------------------------------------------------------------

  describe('update', () => {
    it('should update threshold successfully', async () => {
      const id = new Types.ObjectId().toString();
      const dto = { value: 95 };
  
      const mockUpdated = { id, ...dto };
  
      mockThresholdModel.findByIdAndUpdate.mockResolvedValue(mockUpdated);
  
      const result = await service.update(id, dto, 'u001');
  
      expect(result).toEqual(mockUpdated);
      expect(mockThresholdModel.findByIdAndUpdate).toHaveBeenCalledWith(
        new Types.ObjectId(id),
        { ...dto, updatedBy: 'u001' },
        { new: true }
      );
    });
  });


});
