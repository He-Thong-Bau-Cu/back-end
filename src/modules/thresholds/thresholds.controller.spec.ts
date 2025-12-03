import { Test, TestingModule } from '@nestjs/testing';
import { ThresholdsController } from './thresholds.controller';
import { ThresholdsService } from './thresholds.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('ThresholdsController', () => {
  let controller: ThresholdsController;
  let service: ThresholdsService;

  const mockService = {
    getById: jest.fn(),
    findOne: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockReq = { user: { sub: 'u001' } } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThresholdsController],
      providers: [
        {
          provide: ThresholdsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ThresholdsController>(ThresholdsController);
    service = module.get<ThresholdsService>(ThresholdsService);

    jest.clearAllMocks();
  });

  // ----------------------------------------------------------------------
  // getById
  // ----------------------------------------------------------------------

  describe('getById', () => {
    it('should return BaseResponse.success when found', async () => {
      const mockData = { id: 't1', value: 70 };
      mockService.getById.mockResolvedValue(mockData);

      const result: any = await controller.getById('t1');

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.THRESHOLD_GET_BY_ID_SUCCESS,
          HttpStatus.OK
        )
      );

      expect(service.getById).toHaveBeenCalledWith('t1');
    });

    it('should throw HttpException when service throws error', async () => {
      mockService.getById.mockRejectedValue(new Error('Error'));

      await expect(controller.getById('t1')).rejects.toThrow(HttpException);
    });
  });

  // ----------------------------------------------------------------------
  // getThresholdByCode
  // ----------------------------------------------------------------------

  describe('getThresholdByCode', () => {
    it('should return BaseResponse.success when found', async () => {
      const mockData = { thresholdCode: 'TH001', value: 75 };

      mockService.findOne.mockResolvedValue(mockData);

      const result: any = await controller.getThresholdByCode('TH001');

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.THRESHOLD_GET_BY_CODE_SUCCESS,
          HttpStatus.OK
        )
      );

      expect(service.findOne).toHaveBeenCalledWith('TH001');
    });

    it('should throw HttpException when service throws error', async () => {
      mockService.findOne.mockRejectedValue(new Error('Error'));

      await expect(controller.getThresholdByCode('TH001')).rejects.toThrow(HttpException);
    });
  });

  // ----------------------------------------------------------------------
  // search
  // ----------------------------------------------------------------------

  describe('search', () => {
    it('should return BaseResponse.success with search results', async () => {
      const dto = { keyword: 'test', page: 1, limit: 10 };
      const mockData = [{ id: 't1' }];

      mockService.search.mockResolvedValue(mockData);

      const result: any = await controller.search(dto);

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.THRESHOLD_SEARCH_SUCCESS,
          HttpStatus.OK
        )
      );
      expect(service.search).toHaveBeenCalledWith(dto);
    });

    it('should throw HttpException when service throws error', async () => {
      mockService.search.mockRejectedValue(new Error('Error'));

      await expect(controller.search({} as any)).rejects.toThrow(HttpException);
    });
  });

  // ----------------------------------------------------------------------
  // create
  // ----------------------------------------------------------------------

  describe('create', () => {
    it('should create threshold successfully', async () => {
      const dto = { thresholdCode: 'TH01', value: 80 };
      const mockData = { id: 't1', ...dto };

      mockService.create.mockResolvedValue(mockData);

      const result: any = await controller.create(dto as any, mockReq);

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.THRESHOLD_CREATE_SUCCESS,
          HttpStatus.CREATED
        )
      );

      expect(service.create).toHaveBeenCalledWith(dto, 'u001');
    });

    it('should throw HttpException when service throws error', async () => {
      mockService.create.mockRejectedValue(new Error('Error'));

      await expect(controller.create({} as any, mockReq)).rejects.toThrow(HttpException);
    });
  });

  // ----------------------------------------------------------------------
  // update
  // ----------------------------------------------------------------------

  describe('update', () => {
    it('should update threshold successfully', async () => {
      const dto = { value: 90 };
      const mockData = { id: 't1', updated: true };

      mockService.update.mockResolvedValue(mockData);

      const result: any = await controller.update('t1', dto as any, mockReq);

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.THRESHOLD_UPDATE_SUCCESS,
          HttpStatus.OK
        )
      );

      expect(service.update).toHaveBeenCalledWith('t1', dto, 'u001');
    });

    it('should throw HttpException when service throws error', async () => {
      mockService.update.mockRejectedValue(new Error('Error'));

      await expect(controller.update('t1', {} as any, mockReq)).rejects.toThrow(HttpException);
    });
  });

});
