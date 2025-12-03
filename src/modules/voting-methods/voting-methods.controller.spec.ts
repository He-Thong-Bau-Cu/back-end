import { Test, TestingModule } from '@nestjs/testing';
import { VotingMethodsController } from './voting-methods.controller';
import { VotingMethodsService } from './voting-methods.service';
import { HttpException, HttpStatus } from '@nestjs/common';

// ⭐ MOCK BaseResponse
jest.mock('src/common/dto/base-response.dto', () => ({
  BaseResponse: {
    success: (data: any, message: string, statusCode: number) => ({
      statusCode,
      message,
      data,
    }),
  },
}));

describe('VotingMethodsController', () => {
  let controller: VotingMethodsController;
  let service: VotingMethodsService;

  const mockService = {
    getById: jest.fn(),
    findOne: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotingMethodsController],
      providers: [
        { provide: VotingMethodsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<VotingMethodsController>(VotingMethodsController);
    service = module.get<VotingMethodsService>(VotingMethodsService);
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // getById
  // -------------------------------------------------------------------------
  describe('getById', () => {
    it('should return a voting method by ID', async () => {
      const mockData = { id: 'vm1', name: 'Method A' };

      mockService.getById.mockResolvedValue(mockData);

      const result: any = await controller.getById('vm1');

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data.id).toBe('vm1');
    });

    it('should throw HttpException on error', async () => {
      mockService.getById.mockRejectedValue(new Error('Not found'));

      await expect(controller.getById('X')).rejects.toThrow(HttpException);
    });
  });

  // -------------------------------------------------------------------------
  // getVotingMethodByCode
  // -------------------------------------------------------------------------
  describe('getVotingMethodByCode', () => {
    it('should return voting method by code', async () => {
      const mockData = { code: 'CUMULATIVE', name: 'Cumulative Voting' };

      mockService.findOne.mockResolvedValue(mockData);

      const result: any = await controller.getVotingMethodByCode('CUMULATIVE');

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data.code).toBe('CUMULATIVE');
    });

    it('should throw HttpException', async () => {
      mockService.findOne.mockRejectedValue(new Error('Error'));

      await expect(
        controller.getVotingMethodByCode('X'),
      ).rejects.toThrow(HttpException);
    });
  });

  // -------------------------------------------------------------------------
  // search
  // -------------------------------------------------------------------------
  describe('search', () => {
    it('should return search results', async () => {
      mockService.search.mockResolvedValue({
        data: [{ id: 'vm1' }],
        total: 1,
      });

      const result: any = await controller.search({ keyword: '' });

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data.data.length).toBe(1);
    });

    it('should throw HttpException', async () => {
      mockService.search.mockRejectedValue(new Error('Error'));

      await expect(
        controller.search({ keyword: '' }),
      ).rejects.toThrow(HttpException);
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('should create a new voting method', async () => {
      const req: any = { user: { sub: 'u001' } };
      const mockData = { id: 'vm1', name: 'X' };

      mockService.create.mockResolvedValue(mockData);

      const result: any = await controller.create({ name: 'X' } as any, req);

      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.data.id).toBe('vm1');
    });

    it('should throw HttpException', async () => {
      const req: any = { user: { sub: 'u001' } };
      mockService.create.mockRejectedValue(new Error('Error'));

      await expect(
        controller.create({ name: 'X' } as any, req),
      ).rejects.toThrow(HttpException);
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  describe('update', () => {
    it('should update a voting method', async () => {
      const req: any = { user: { sub: 'u001' } };
      const mockData = { updated: true };

      mockService.update.mockResolvedValue(mockData);

      const result: any = await controller.update('vm1', { name: 'updated' } as any, req);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data.updated).toBe(true);
    });

    it('should throw HttpException', async () => {
      const req: any = { user: { sub: 'u001' } };

      mockService.update.mockRejectedValue(new Error('Error'));

      await expect(
        controller.update('vm1', { name: 'X' } as any, req),
      ).rejects.toThrow(HttpException);
    });
  });
});
