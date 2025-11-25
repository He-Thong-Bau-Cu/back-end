import { Test, TestingModule } from '@nestjs/testing';
import { ElectionParticipantsController } from './election-participants.controller';
import { ElectionParticipantsService } from './election-participants.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ElectionParticipantsController', () => {
  let controller: ElectionParticipantsController;
  let service: ElectionParticipantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectionParticipantsController],
      providers: [
        {
          provide: ElectionParticipantsService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ElectionParticipantsController>(ElectionParticipantsController);
    service = module.get<ElectionParticipantsService>(ElectionParticipantsService);
  });

  afterEach(() => jest.clearAllMocks());

  const dto = {
    electionId: 'E001',
    userId: 'U001',
    roleId: 'R001',
  };

  // ======================
  // ✅ TEST CASES
  // ======================
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return BaseResponse.success when created successfully', async () => {
    const mockData = { id: 'P123', ...dto };
    jest.spyOn(service, 'create').mockResolvedValue(mockData as any);

    const result = await controller.create(dto as any);

    expect(result).toEqual(
      BaseResponse.success(mockData, 'Tạo người tham gia cuộc bầu cử thành công', 201),
    );
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should throw HttpException when service throws error', async () => {
    jest.spyOn(service, 'create').mockRejectedValue(new Error('Database Error'));

    try {
      await controller.create(dto as any);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.response.message).toBe('Database Error');
    }
  });
});
