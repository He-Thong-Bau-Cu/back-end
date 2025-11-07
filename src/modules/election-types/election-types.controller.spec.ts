import { Test, TestingModule } from '@nestjs/testing';
import { ElectionTypesController } from './election-types.controller';
import { ElectionTypesService } from './election-types.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ElectionTypesController', () => {
  let controller: ElectionTypesController;
  let service: ElectionTypesService;

  const mockElectionTypesService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectionTypesController],
      providers: [
        {
          provide: ElectionTypesService,
          useValue: mockElectionTypesService,
        },
      ],
    }).compile();

    controller = module.get<ElectionTypesController>(ElectionTypesController);
    service = module.get<ElectionTypesService>(ElectionTypesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getElectionTypeByCode', () => {
    it('should return BaseResponse.success when found', async () => {
      const mockData = { typeCode: 'BGD', name: 'Ban Giám đốc' };
      mockElectionTypesService.findOne.mockResolvedValue(mockData);

      const result = await controller.getElectionTypeByCode('BGD');

      expect(result).toEqual(
        BaseResponse.success(mockData, 'Lấy thông tin loại bầu cử theo mã thành công', 200),
      );
      expect(service.findOne).toHaveBeenCalledWith('BGD');
    });

    it('should throw HttpException when service throws error', async () => {
      mockElectionTypesService.findOne.mockRejectedValue(new Error('Election Type Code not found'));

      try {
        await controller.getElectionTypeByCode('INVALID');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.response.message).toBe('Election Type Code not found');
      }
    });
  });
});
