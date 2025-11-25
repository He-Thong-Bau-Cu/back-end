import { Test, TestingModule } from '@nestjs/testing';
import { VotingRightsController } from './voting-rights.controller';
import { VotingRightsService } from './voting-rights.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('VotingRightsController', () => {
  let controller: VotingRightsController;
  let service: VotingRightsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotingRightsController],
      providers: [
        {
          provide: VotingRightsService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VotingRightsController>(VotingRightsController);
    service = module.get<VotingRightsService>(VotingRightsService);
  });

  afterEach(() => jest.clearAllMocks());

  const createDto = { electionId: 'E001', voterId: 'V001' };
  const updateDto = { status: 'active' };

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ✅ CREATE
  it('should return BaseResponse.success when create is successful', async () => {
    const mockData = { id: 'R001', ...createDto };
    jest.spyOn(service, 'create').mockResolvedValue(mockData as any);

    const result = await controller.create(createDto as any);

    expect(result).toEqual(
      BaseResponse.success(mockData, 'Tạo quyền bầu cử thành công', 201),
    );
    expect(service.create).toHaveBeenCalledWith(createDto);
  });

  it('should throw HttpException when service.create throws error', async () => {
    jest.spyOn(service, 'create').mockRejectedValue(new Error('Database Error'));

    try {
      await controller.create(createDto as any);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.response.message).toBe('Database Error');
    }
  });

  // ✅ UPDATE
  it('should return BaseResponse.success when update is successful', async () => {
    const mockData = { id: 'R001', ...updateDto };
    jest.spyOn(service, 'update').mockResolvedValue(mockData as any);

    const result = await controller.update('R001', updateDto);

    expect(result).toEqual(
      BaseResponse.success(mockData, 'Cập nhật quyền bầu cử thành công', 200),
    );
    expect(service.update).toHaveBeenCalledWith('R001', updateDto);
  });

  it('should throw HttpException when service.update throws error', async () => {
    jest.spyOn(service, 'update').mockRejectedValue(new Error('Update Error'));

    try {
      await controller.update('R001', updateDto);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.response.message).toBe('Update Error');
    }
  });
});
