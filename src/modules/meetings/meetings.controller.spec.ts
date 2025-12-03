// meetings.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';

import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('MeetingsController', () => {
  let controller: MeetingsController;
  let service: MeetingsService;

  const mockService = {
    getById: jest.fn(),
    getByElectionId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    search: jest.fn(),
  };

  const mockReq = { user: { sub: 'USER123' } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeetingsController],
      providers: [
        {
          provide: MeetingsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MeetingsController>(MeetingsController);
    service = module.get<MeetingsService>(MeetingsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ============================================================
  // getById
  // ============================================================
  describe('getById', () => {
    it('should return BaseResponse.success on success', async () => {
      const id = 'M1';
      const mockData = { id, title: 'Meeting 1' };

      mockService.getById.mockResolvedValue(mockData);

      const result = await controller.getById(id);

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.MEETING_GET_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.getById).toHaveBeenCalledWith(id);
    });

    it('should throw HttpException when service throws', async () => {
      mockService.getById.mockRejectedValue(new Error('Fail'));

      await expect(controller.getById('M1')).rejects.toThrow(HttpException);
    });
  });

  // ============================================================
  // getByElecionId
  // ============================================================
  describe('getByElecionId', () => {
    it('should return BaseResponse.success on success', async () => {
      const electionId = 'E1';
      const mockData = [{ id: 'M1' }];

      mockService.getByElectionId.mockResolvedValue(mockData);

      const result = await controller.getByElecionId(electionId);

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.MEETING_GET_BY_ELECTION_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.getByElectionId).toHaveBeenCalledWith(electionId);
    });

    it('should throw HttpException when service throws', async () => {
      mockService.getByElectionId.mockRejectedValue(new Error('Fail'));

      await expect(
        controller.getByElecionId('E1'),
      ).rejects.toThrow(HttpException);
    });
  });

  // ============================================================
  // create
  // ============================================================
  describe('create', () => {
    it('should return BaseResponse.success on success', async () => {
      const body: any = { title: 'New meeting' };
      const mockData = { id: 'M1', ...body };

      mockService.create.mockResolvedValue(mockData);

      const result = await controller.create(body as any, mockReq as any);

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.MEETING_CREATE_SUCCESS,
          HttpStatus.CREATED,
        ),
      );
      expect(service.create).toHaveBeenCalledWith(body, mockReq.user.sub);
    });

    it('should throw HttpException when service throws', async () => {
      mockService.create.mockRejectedValue(new Error('Fail'));

      await expect(
        controller.create({} as any, mockReq as any),
      ).rejects.toThrow(HttpException);
    });
  });

  // ============================================================
  // update
  // ============================================================
  describe('update', () => {
    it('should return BaseResponse.success on success', async () => {
      const id = 'M1';
      const body: any = { title: 'Updated meeting' };
      const mockData = { id, ...body };

      mockService.update.mockResolvedValue(mockData);

      const result = await controller.update(id, body as any, mockReq as any);

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.MEETING_UPDATE_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.update).toHaveBeenCalledWith(id, body, mockReq.user.sub);
    });

    it('should throw HttpException when service throws', async () => {
      mockService.update.mockRejectedValue(new Error('Fail'));

      await expect(
        controller.update('M1', {} as any, mockReq as any),
      ).rejects.toThrow(HttpException);
    });
  });

  // ============================================================
  // search
  // ============================================================
  describe('search', () => {
    it('should return BaseResponse.success on success', async () => {
      const body: any = { page: 1, limit: 10 };
      const mockData = { items: [], total: 0 };

      mockService.search.mockResolvedValue(mockData);

      const result = await controller.search(body as any);

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.MEETING_SEARCH_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.search).toHaveBeenCalledWith(body);
    });

    it('should throw HttpException when service throws', async () => {
      mockService.search.mockRejectedValue(new Error('Fail'));

      await expect(
        controller.search({} as any),
      ).rejects.toThrow(HttpException);
    });
  });
});
