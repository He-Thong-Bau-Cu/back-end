import { Test, TestingModule } from '@nestjs/testing';
import { ElectionEntitiesController } from './election-entities.controller';
import { ElectionEntitiesService } from './election-entities.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('ElectionEntitiesController', () => {
  let controller: ElectionEntitiesController;
  let service: ElectionEntitiesService;

  const mockElectionEntitiesService = {
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockReq = {
    user: { sub: 'u001' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectionEntitiesController],
      providers: [
        { provide: ElectionEntitiesService, useValue: mockElectionEntitiesService },
      ],
    }).compile();

    controller = module.get<ElectionEntitiesController>(ElectionEntitiesController);
    service = module.get<ElectionEntitiesService>(ElectionEntitiesService);
  });

  afterEach(() => jest.clearAllMocks());

  // ============================================================
  // CREATE
  // ============================================================
  describe('create', () => {
    it('should return BaseResponse.success when created', async () => {
      const dto = { electionId: 'e1' };
      const mockResult = { _id: '123', name: 'Entity A' };

      mockElectionEntitiesService.create.mockResolvedValue(mockResult);

      const result = await controller.create(dto as any, mockReq as any);

      expect(result).toEqual(
        BaseResponse.success(
          mockResult,
          MESSAGE.ELECTION_ENTITY_CREATE_SUCCESS,   // ✔ dùng đúng message thực tế
          HttpStatus.CREATED,
        ),
      );
      expect(service.create).toHaveBeenCalledWith(dto, 'u001');
    });

    it('should throw HttpException when service throws error', async () => {
      mockElectionEntitiesService.create.mockRejectedValue(new Error('Election not found'));

      await expect(controller.create({} as any, mockReq as any))
        .rejects.toThrow(HttpException);

      try {
        await controller.create({} as any, mockReq as any);
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.response.message).toBe('Election not found');
      }
    });
  });

  // ============================================================
  // UPDATE
  // ============================================================
  describe('update', () => {
    it('should return BaseResponse.success when updated', async () => {
      const id = 'id123';
      const dto = { name: 'Updated Entity' };
      const mockResult = { _id: id, ...dto };

      mockElectionEntitiesService.update.mockResolvedValue(mockResult);

      const result = await controller.update(id, dto as any, mockReq as any);

      expect(result).toEqual(
        BaseResponse.success(
          mockResult,
          MESSAGE.ELECTION_ENTITY_UPDATE_SUCCESS,   
          HttpStatus.OK,
        ),
      );
      expect(service.update).toHaveBeenCalledWith(id, dto, 'u001');
    });

    it('should throw HttpException when update fails', async () => {
      mockElectionEntitiesService.update.mockRejectedValue(new Error('Update failed'));

      try {
        await controller.update('id1', {} as any, mockReq as any);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(error.response.message).toBe('Update failed');
      }
    });
  });
});
