import { Test, TestingModule } from '@nestjs/testing';
import { VotingMethodsController } from './voting-methods.controller';
import { VotingMethodsService } from './voting-methods.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseResponse } from 'src/common/dto/base-response.dto';

describe('VotingMethodsController', () => {
  let controller: VotingMethodsController;
  let service: VotingMethodsService;

  const mockVotingMethodsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotingMethodsController],
      providers: [
        {
          provide: VotingMethodsService,
          useValue: mockVotingMethodsService,
        },
      ],
    }).compile();

    controller = module.get<VotingMethodsController>(VotingMethodsController);
    service = module.get<VotingMethodsService>(VotingMethodsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getVotingMethodByCode', () => {
    it('should return BaseResponse.success when found', async () => {
      const mockData = { methodCode: 'M01', name: 'Trực tuyến' };
      mockVotingMethodsService.findOne.mockResolvedValue(mockData);

      const result = await controller.getVotingMethodByCode('M01');

      expect(result).toEqual(
        BaseResponse.success(mockData, 'Lấy thông tin phương thức bầu cử theo code thành công', 200),
      );
      expect(service.findOne).toHaveBeenCalledWith('M01');
    });

    it('should throw HttpException when service throws error', async () => {
      mockVotingMethodsService.findOne.mockRejectedValue(new Error('Voting Method Code not found'));

      try {
        await controller.getVotingMethodByCode('INVALID');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.response.message).toBe('Voting Method Code not found');
      }
    });
  });
});
