import { Test, TestingModule } from '@nestjs/testing';
import { ElectionsController } from './elections.controller';
import { ElectionsService } from './elections.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('ElectionsController', () => {
  let controller: ElectionsController;
  let service: ElectionsService;

  const mockService = {
    searchElections: jest.fn(),
    getElectionById: jest.fn(),
    updateElections: jest.fn(),
    deleteElection: jest.fn(),
    createElection: jest.fn(),
    getElectionOrganizerByTime: jest.fn(),
    getUserIsVoter: jest.fn(),
  };

  const mockReq = { user: { sub: 'USER123' } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectionsController],
      providers: [
        {
          provide: ElectionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ElectionsController>(ElectionsController);
    service = module.get<ElectionsService>(ElectionsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // =========================================================
  // 📌 1. searchElections
  // =========================================================
  describe('searchElections', () => {
    it('should return success response', async () => {
      const body = {
        textSearch: 'abc',
        fromDate: null,
        toDate: null,
        type: null,
        page: 1,
        limit: 10,
      };
  
      const mockResult = { items: [], total: 0 };
  
      mockService.searchElections.mockResolvedValue(mockResult);
  
      const result = await controller.searchElections(body as any);
  
      expect(result).toEqual(
        BaseResponse.success(
          mockResult,
          MESSAGE.ELECTION_SEARCH_SUCCESS,
          HttpStatus.OK,
        ),
      );
  
      expect(service.searchElections).toHaveBeenCalledWith(body);
    });
  
    it('should throw HttpException on error', async () => {
      mockService.searchElections.mockRejectedValue(new Error('Fail'));
  
      await expect(
        controller.searchElections({} as any),
      ).rejects.toThrow(HttpException);
    });
  });
  

  // =========================================================
  // 📌 2. getElectionById
  // =========================================================
  describe('getElectionById', () => {
    it('should return success response', async () => {
      const id = 'E001';
      const mockData = { id, name: 'Election A' };

      mockService.getElectionById.mockResolvedValue(mockData);

      const result = await controller.getElectionById(id);

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.ELECTION_GET_BY_ID_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.getElectionById).toHaveBeenCalledWith(id);
    });

    it('should throw HttpException on error', async () => {
      mockService.getElectionById.mockRejectedValue(new Error('Fail'));

      await expect(controller.getElectionById('id')).rejects.toThrow(
        HttpException,
      );
    });
  });

  // =========================================================
  // 📌 3. updateElections
  // =========================================================
  describe('updateElections', () => {
    it('should return success response', async () => {
      const id = 'E123';
      const body = { title: 'Updated' };
      const mockData = { id, ...body };

      mockService.updateElections.mockResolvedValue(mockData);

      const result = await controller.updateElections(mockReq as any, id, body);

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.ELECTION_UPDATE_SUCCESS,
          HttpStatus.OK,
        ),
      );

      expect(service.updateElections).toHaveBeenCalledWith(
        id,
        body,
        mockReq.user.sub,
      );
    });

    it('should throw HttpException on error', async () => {
      mockService.updateElections.mockRejectedValue(new Error('Fail'));

      await expect(
        controller.updateElections(mockReq as any, 'ID1', {} as any),
      ).rejects.toThrow(HttpException);
    });
  });

  // =========================================================
  // 📌 4. deleteElection
  // =========================================================
  describe('deleteElection', () => {
    it('should return success response', async () => {
      const id = 'E10';
      const mockData = { deleted: true };

      mockService.deleteElection.mockResolvedValue(mockData);

      const result = await controller.deleteElection(id);

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.ELECTION_DELETE_SUCCESS,
          HttpStatus.OK,
        ),
      );

      expect(service.deleteElection).toHaveBeenCalledWith(id);
    });

    it('should throw HttpException on error', async () => {
      mockService.deleteElection.mockRejectedValue(new Error('Fail'));

      await expect(controller.deleteElection('E10')).rejects.toThrow(
        HttpException,
      );
    });
  });

  // =========================================================
  // 📌 5. createElection
  // =========================================================
  describe('createElection', () => {
    it('should return success response', async () => {
      const body = { 
        title: 'New Election',
        typeId: 'T01',
        decisionNumber: 'D001',
        decisionName: 'Quyết định 01'
      };
  
      const mockData = { id: 'E1', ...body };
  
      mockService.createElection.mockResolvedValue(mockData);
  
      const result = await controller.createElection(mockReq as any, body);
  
      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.ELECTION_CREATE_SUCCESS,
          HttpStatus.CREATED,
        ),
      );
  
      expect(service.createElection).toHaveBeenCalledWith(
        body,
        mockReq.user.sub,
      );
    });
  });

  // =========================================================
  // 📌 6. getElectionOrganizer
  // =========================================================
  describe('getElectionOrganizer', () => {
    it('should return success response', async () => {
      const req = { startDate: '2024-01-01', endDate: '2024-01-10' };
      const mockData = [{ id: 'U1' }];

      mockService.getElectionOrganizerByTime.mockResolvedValue(mockData);

      const result = await controller.getElectionOrganizer(req as any);

      expect(result).toEqual(
        BaseResponse.success(mockData, MESSAGE.SUCCESS, HttpStatus.OK),
      );
    });

    it('should throw HttpException on error', async () => {
      mockService.getElectionOrganizerByTime.mockRejectedValue(
        new Error('Fail'),
      );

      await expect(
        controller.getElectionOrganizer({} as any),
      ).rejects.toThrow(HttpException);
    });
  });

  // =========================================================
  // 📌 7. getuserVoterValid
  // =========================================================
  describe('getuserVoterValid', () => {
    it('should return success response', async () => {
      const mockData = [{ id: 'V1' }];

      mockService.getUserIsVoter.mockResolvedValue(mockData);

      const result = await controller.getuserVoterValid();

      expect(result).toEqual(
        BaseResponse.success(mockData, MESSAGE.SUCCESS, HttpStatus.OK),
      );
    });

    it('should throw HttpException on error', async () => {
      mockService.getUserIsVoter.mockRejectedValue(new Error('Fail'));

      await expect(controller.getuserVoterValid()).rejects.toThrow(
        HttpException,
      );
    });
  });
});
