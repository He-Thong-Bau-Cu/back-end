import { Test, TestingModule } from '@nestjs/testing';
import { ElectionDocumentsController } from './election-documents.controller';
import { ElectionDocumentsService } from './election-documents.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ElectionDocumentsController', () => {
  let controller: ElectionDocumentsController;
  let service: ElectionDocumentsService;

  const mockService = {
    create: jest.fn(),
    getById: jest.fn(),
    getByElectionId: jest.fn(),
    getByCreatedBy: jest.fn(),
    update: jest.fn(),
  };

  const mockReq = { user: { sub: 'user123' } } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectionDocumentsController],
      providers: [
        {
          provide: ElectionDocumentsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ElectionDocumentsController>(ElectionDocumentsController);
    service = module.get<ElectionDocumentsService>(ElectionDocumentsService);

    jest.clearAllMocks();
  });

  // =========================================================================
  // 1. CREATE
  // =========================================================================
  describe('create', () => {
    it('should return success response', async () => {
      const dto = { title: 'Document A' } as any;
      const resultData = { id: 'doc123' };

      mockService.create.mockResolvedValue(resultData);

      const response = await controller.create(dto, mockReq);

      expect(response).toEqual(
        BaseResponse.success(
          resultData,
          MESSAGE.ELECTION_DOCUMENT_CREATE_SUCCESS,
          HttpStatus.CREATED
        ),
      );

      expect(service.create).toHaveBeenCalledWith(dto, 'user123');
    });

    it('should throw HttpException when service fails', async () => {
      mockService.create.mockRejectedValue(new Error('Create failed'));

      await expect(controller.create({} as any, mockReq)).rejects.toThrow(HttpException);
    });
  });

  // =========================================================================
  // 2. GET BY ID
  // =========================================================================
  describe('getById', () => {
    it('should return success response', async () => {
      mockService.getById.mockResolvedValue({ id: 'doc1' });

      const response = await controller.getById('doc1');

      expect(response).toEqual(
        BaseResponse.success(
          { id: 'doc1' },
          MESSAGE.ELECTION_DOCUMENT_GET_BY_ID_SUCCESS,
          HttpStatus.OK,
        ),
      );
    });

    it('should throw HttpException on error', async () => {
      mockService.getById.mockRejectedValue(new Error('Not found'));

      await expect(controller.getById('doc1')).rejects.toThrow(HttpException);
    });
  });

  // =========================================================================
  // 3. GET BY ELECTION ID
  // =========================================================================
  describe('getByElectionId', () => {
    it('should return success', async () => {
      mockService.getByElectionId.mockResolvedValue([{ id: 1 }]);

      const response = await controller.getByElectionId('e1');

      expect(response).toEqual(
        BaseResponse.success(
          [{ id: 1 }],
          MESSAGE.ELECTION_DOCUMENT_GET_SUCCESS,
          HttpStatus.OK,
        ),
      );
    });

    it('should throw error', async () => {
      mockService.getByElectionId.mockRejectedValue(new Error('Failed'));

      await expect(controller.getByElectionId('e1')).rejects.toThrow(HttpException);
    });
  });

  // =========================================================================
  // 4. GET BY CREATED BY (USER)
  // =========================================================================
  describe('getByCreatedBy', () => {
    it('should return success', async () => {
      mockService.getByCreatedBy.mockResolvedValue([{ id: 'docA' }]);

      const response = await controller.getByCreatedBy('user1');

      expect(response).toEqual(
        BaseResponse.success(
          [{ id: 'docA' }],
          MESSAGE.ELECTION_DOCUMENT_GET_BY_CREATED_BY_SUCCESS,
          HttpStatus.OK,
        ),
      );
    });

    it('should throw error', async () => {
      mockService.getByCreatedBy.mockRejectedValue(new Error('Failed'));

      await expect(controller.getByCreatedBy('user1')).rejects.toThrow(HttpException);
    });
  });

  // =========================================================================
  // 5. UPDATE
  // =========================================================================
  describe('update', () => {
    it('should return success response', async () => {
      const dto = { title: 'Updated' } as any;
      const mockResult = { id: 'doc1', title: 'Updated' };

      mockService.update.mockResolvedValue(mockResult);

      const response = await controller.update('doc1', dto, mockReq);

      expect(response).toEqual(
        BaseResponse.success(
          mockResult,
          MESSAGE.ELECTION_DOCUMENT_UPDATE_SUCCESS,
          HttpStatus.OK,
        ),
      );

      expect(service.update).toHaveBeenCalledWith('doc1', dto, 'user123');
    });

    it('should throw error', async () => {
      mockService.update.mockRejectedValue(new Error('Update error'));

      await expect(controller.update('doc1', {} as any, mockReq)).rejects.toThrow(HttpException);
    });
  });
});
