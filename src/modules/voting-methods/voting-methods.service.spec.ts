import { Test, TestingModule } from '@nestjs/testing';
import { VotingMethodsService } from './voting-methods.service';
import { getModelToken } from '@nestjs/mongoose';
import { MESSAGE } from 'src/common/enums/message.enum';
import { Types } from 'mongoose';

// ⭐ MOCK paginate
jest.mock('src/common/dto/paignation', () => ({
  paginate: (items: any[], page: number, limit: number) => ({
    data: items,
    total: items.length,
    page,
    limit,
  }),
}));

describe('VotingMethodsService', () => {
  let service: VotingMethodsService;

  const execMock = jest.fn();
  const populateMock = {
    populate: jest.fn().mockReturnThis(),
    exec: execMock,
  };

  const mockVotingMethodsModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotingMethodsService,
        {
          provide: getModelToken('VotingMethods'),
          useValue: mockVotingMethodsModel,
        },
      ],
    }).compile();

    service = module.get<VotingMethodsService>(VotingMethodsService);

    jest.clearAllMocks();
    execMock.mockReset();
  });

  // ---------------------------------------------------------------------
  // findOne
  // ---------------------------------------------------------------------
  describe('findOne', () => {
    it('should return voting method when found', async () => {
      mockVotingMethodsModel.findOne.mockReturnValue(populateMock);
      execMock.mockResolvedValue({ methodCode: 'YES_NO', name: 'Yes/No' });

      const result = await service.findOne('YES_NO');

      expect(result.methodCode).toBe('YES_NO');
      expect(mockVotingMethodsModel.findOne).toHaveBeenCalledWith({ methodCode: 'YES_NO' });
    });

    it('should throw when not found', async () => {
      mockVotingMethodsModel.findOne.mockReturnValue(populateMock);
      execMock.mockResolvedValue(null);

      await expect(service.findOne('INVALID')).rejects.toThrow(
        MESSAGE.VOTING_METHOD_CODE_NOT_FOUND,
      );
    });
  });

  // ---------------------------------------------------------------------
  // getById
  // ---------------------------------------------------------------------
  describe('getById', () => {
    it('should return voting method when found', async () => {
      mockVotingMethodsModel.findById.mockReturnValue(populateMock);
      execMock.mockResolvedValue({ _id: '123', name: 'Method A' });

      const id = new Types.ObjectId().toString();
      const result = await service.getById(id);

      expect(result._id).toBe('123');
      expect(mockVotingMethodsModel.findById).toHaveBeenCalled();
    });

    it('should throw when not found', async () => {
      mockVotingMethodsModel.findById.mockReturnValue(populateMock);
      execMock.mockResolvedValue(null);

      await expect(service.getById(new Types.ObjectId().toString())).rejects.toThrow(
        MESSAGE.VOTING_METHOD_NOT_FOUND,
      );
    });
  });

  // ---------------------------------------------------------------------
  // search
  // ---------------------------------------------------------------------
  describe('search', () => {
    it('should return paginated search results', async () => {
      const mockList = [{ name: 'A' }, { name: 'B' }];

      mockVotingMethodsModel.find.mockReturnValue(populateMock);
      execMock.mockResolvedValue(mockList);

      const req = { keyword: 'test', page: 1, limit: 10 };

      const result = await service.search(req as any);

      expect(mockVotingMethodsModel.find).toHaveBeenCalled();
      expect((result as any).data.length).toBe(2);
      expect((result as any).total).toBe(2);
    });
  });

  // ---------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------
  describe('create', () => {
    it('should create voting method successfully', async () => {
      const dto = { methodCode: 'TEST', name: 'Test' };
      const mockCreated = { _id: '1', ...dto };

      mockVotingMethodsModel.create.mockResolvedValue(mockCreated);

      const userId = new Types.ObjectId().toString();
      const result = await service.create(dto as any, userId);

      expect(result).toEqual(mockCreated);
      expect(mockVotingMethodsModel.create).toHaveBeenCalledWith({
        ...dto,
        createdBy: new Types.ObjectId(userId),
      });
    });
  });

  // ---------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------
  describe('update', () => {
    it('should update voting method successfully', async () => {
      const id = new Types.ObjectId().toString();
      const dto = { name: 'Updated Method' };
      const mockUpdated = { _id: id, ...dto };

      mockVotingMethodsModel.findByIdAndUpdate.mockReturnValue({
        exec: () => Promise.resolve(mockUpdated),
      });

      const result = await service.update(id, dto as any, 'u001');

      expect(result).toEqual(mockUpdated);
      expect(mockVotingMethodsModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw when voting method does not exist', async () => {
      mockVotingMethodsModel.findByIdAndUpdate.mockReturnValue({
        exec: () => Promise.resolve(null),
      });

      await expect(service.update(new Types.ObjectId().toString(), {}, 'u001')).rejects.toThrow(
        MESSAGE.VOTING_METHOD_NOT_FOUND,
      );
    });
  });
});
