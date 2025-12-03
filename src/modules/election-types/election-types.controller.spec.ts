import { Test, TestingModule } from '@nestjs/testing';
import { ElectionTypesController } from './election-types.controller';
import { ElectionTypesService } from './election-types.service';
import { MESSAGE } from 'src/common/enums/message.enum';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ElectionTypesController', () => {
  let controller: ElectionTypesController;
  let service: ElectionTypesService;

  const mockService = {
    getById: jest.fn(),
    findOne: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockReq = {
    user: { sub: 'user123' },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectionTypesController],
      providers: [
        {
          provide: ElectionTypesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ElectionTypesController>(ElectionTypesController);
    service = module.get<ElectionTypesService>(ElectionTypesService);
    jest.clearAllMocks();
  });

  // ============================================================
  // GET BY ID
  // ============================================================
  it('should get election type by id', async () => {
    const data = { id: '1', title: 'Type A' };
    mockService.getById.mockResolvedValue(data);

    const res = await controller.getElectionTypeById('1');

    expect(res.data).toEqual(data);
    expect(res.message).toBe(MESSAGE.ELECTION_TYPE_GET_BY_ID_SUCCESS);
  });

  it('should throw error when getById fails', async () => {
    mockService.getById.mockRejectedValue(new Error('ERR'));

    await expect(controller.getElectionTypeById('1')).rejects.toThrow(
      HttpException,
    );
  });

  // ============================================================
  // GET BY TYPE CODE
  // ============================================================
  it('should get election type by typeCode', async () => {
    const data = { typeCode: 'T1' };
    mockService.findOne.mockResolvedValue(data);

    const res = await controller.getElectionTypeByCode('T1');

    expect(res.data).toEqual(data);
    expect(res.message).toBe(MESSAGE.ELECTION_TYPE_GET_BY_CODE_SUCCESS);
  });

  it('should throw on findOne error', async () => {
    mockService.findOne.mockRejectedValue(new Error('ERR'));

    await expect(controller.getElectionTypeByCode('T1')).rejects.toThrow(
      HttpException,
    );
  });

  // ============================================================
  // SEARCH
  // ============================================================
  it('should search election types', async () => {
    const data = [{ title: 'ABC' }];
    mockService.search.mockResolvedValue(data);

    const res = await controller.searchElectionTypes({ keyword: 'abc' } as any);

    expect(res.data).toEqual(data);
    expect(res.message).toBe(MESSAGE.ELECTION_TYPE_SEARCH_SUCCESS);
  });

  it('should throw on search error', async () => {
    mockService.search.mockRejectedValue(new Error('ERR'));

    await expect(
      controller.searchElectionTypes({ keyword: 'abc' } as any),
    ).rejects.toThrow(HttpException);
  });

  // ============================================================
  // CREATE
  // ============================================================
  it('should create election type', async () => {
    const dto = { title: 'X' };
    const created = { id: '1', ...dto };

    mockService.create.mockResolvedValue(created);

    const res = await controller.create(dto as any, mockReq);

    expect(res.data).toEqual(created);
    expect(res.message).toBe(MESSAGE.ELECTION_TYPE_CREATE_SUCCESS);
    expect(service.create).toHaveBeenCalledWith(dto, 'user123');
  });

  it('should throw on create error', async () => {
    mockService.create.mockRejectedValue(new Error('ERR'));

    await expect(controller.create({} as any, mockReq)).rejects.toThrow(
      HttpException,
    );
  });

  // ============================================================
  // UPDATE
  // ============================================================
  it('should update election type', async () => {
    const dto = { title: 'Updated' };
    const updated = { id: '1', title: 'Updated' };

    mockService.update.mockResolvedValue(updated);

    const res = await controller.update('1', dto as any, mockReq);

    expect(res.data).toEqual(updated);
    expect(res.message).toBe(MESSAGE.ELECTION_TYPE_UPDATE_SUCCESS);
    expect(service.update).toHaveBeenCalledWith('1', dto, 'user123');
  });

  it('should throw on update error', async () => {
    mockService.update.mockRejectedValue(new Error('ERR'));

    await expect(
      controller.update('1', {} as any, mockReq),
    ).rejects.toThrow(HttpException);
  });
});
