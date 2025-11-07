import { Test, TestingModule } from '@nestjs/testing';
import { ThresholdsController } from './thresholds.controller';
import { ThresholdsService } from './thresholds.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ThresholdsController', () => {
  let controller: ThresholdsController;
  let service: ThresholdsService;

  const mockThresholdsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThresholdsController],
      providers: [
        {
          provide: ThresholdsService,
          useValue: mockThresholdsService,
        },
      ],
    }).compile();

    controller = module.get<ThresholdsController>(ThresholdsController);
    service = module.get<ThresholdsService>(ThresholdsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getThresholdByCode', () => {
    it('should return BaseResponse.success when found', async () => {
      const mockData = { thresholdCode: 'TH001', value: 75 };
      mockThresholdsService.findOne.mockResolvedValue(mockData);

      const result = await controller.getThresholdByCode('TH001');

      expect(result).toEqual(
        BaseResponse.success(mockData, 'Lấy thông tin ngưỡng thông qua theo code thành công', 200),
      );
      expect(service.findOne).toHaveBeenCalledWith('TH001');
    });

    it('should throw HttpException when service throws error', async () => {
      mockThresholdsService.findOne.mockRejectedValue(new Error('Threshold Code not found'));

      try {
        await controller.getThresholdByCode('INVALID');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.response.message).toBe('Threshold Code not found');
      }
    });
  });
});
