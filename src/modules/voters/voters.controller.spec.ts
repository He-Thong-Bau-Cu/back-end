import { Test, TestingModule } from '@nestjs/testing';
import { VotersController } from './voters.controller';
import { VotersService } from './voters.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('VotersController', () => {
  let controller: VotersController;
  let service: VotersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotersController],
      providers: [
        {
          provide: VotersService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<VotersController>(VotersController);
    service = module.get<VotersService>(VotersService);
  });

  afterEach(() => jest.clearAllMocks());

  const createDto = { electionId: 'E01', userId: 'U01' };
  const updateDto = { status: 'active' };

  // ================
  // ✅ TEST CASES
  // ================
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // CREATE
  it('should return BaseResponse.success when create voter successfully', async () => {
    const mockData = { id: 'V001', ...createDto };
    jest.spyOn(service, 'create').mockResolvedValue(mockData as any);

    const result = await controller.create(createDto as any);

    expect(result).toEqual(
      BaseResponse.success(mockData, 'Tạo cử tri thành công', 201),
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

  // UPDATE
  it('should return BaseResponse.success when update voter successfully', async () => {
    const mockData = { id: 'V001', ...updateDto };
    jest.spyOn(service, 'update').mockResolvedValue(mockData as any);

    const result = await controller.update('V001', updateDto);

    expect(result).toEqual(
      BaseResponse.success(mockData, 'Cập nhật cử tri thành công', 200),
    );
    expect(service.update).toHaveBeenCalledWith('V001', updateDto);
  });

  it('should throw HttpException when service.update throws error', async () => {
    jest.spyOn(service, 'update').mockRejectedValue(new Error('Update Error'));

    try {
      await controller.update('V001', updateDto);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.response.message).toBe('Update Error');
    }
  });
});
