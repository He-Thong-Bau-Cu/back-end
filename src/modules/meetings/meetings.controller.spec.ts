import { Test, TestingModule } from '@nestjs/testing';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseResponse } from 'src/common/dto/base-response.dto';

describe('MeetingsController', () => {
  let controller: MeetingsController;
  let service: MeetingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeetingsController],
      providers: [
        {
          provide: MeetingsService,
          useValue: {
            create: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MeetingsController>(MeetingsController);
    service = module.get<MeetingsService>(MeetingsService);
  });

  afterEach(() => jest.clearAllMocks());

  const dto = { electionId: 'e001', name: 'Họp thường niên' };

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return BaseResponse.success when created successfully', async () => {
    const mockData = { id: 'm001', ...dto };
    jest.spyOn(service, 'create').mockResolvedValue(mockData as any);

    const result = await controller.create(dto as any);
    expect(result).toEqual(
      BaseResponse.success(mockData, 'Tạo cuộc họp thành công', 201),
    );
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
