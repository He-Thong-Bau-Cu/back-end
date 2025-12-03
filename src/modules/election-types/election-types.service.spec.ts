jest.mock('src/common/dto/paignation', () => ({
  paginate: (items: any[], page: number, limit: number) => ({
    items,
    total: items.length,
    page,
    limit,
  }),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ElectionTypesService } from './election-types.service';
import { getModelToken } from '@nestjs/mongoose';
import { MESSAGE } from 'src/common/enums/message.enum';
import { Types } from 'mongoose';

const oid = () => new Types.ObjectId().toString();

const mockModel = () => ({
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findByIdAndUpdate: jest.fn().mockReturnThis(),
  exec: jest.fn(),
  create: jest.fn(),
  populate: jest.fn().mockReturnThis(),
});

describe('ElectionTypesService', () => {
  let service: ElectionTypesService;
  const electionTypesModel = mockModel();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionTypesService,
        {
          provide: getModelToken('ElectionTypes'),
          useValue: electionTypesModel,
        },
      ],
    }).compile();

    service = module.get<ElectionTypesService>(ElectionTypesService);
    jest.clearAllMocks();
  });

  // ============================================================
  // SEARCH
  // ============================================================
  it('should search election types', async () => {
    const chain: any = {
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        { _id: oid(), title: 'Type 1' },
        { _id: oid(), title: 'Type 2' },
      ]),
    };
    electionTypesModel.find.mockReturnValue(chain);

    const res = await service.search({ keyword: 'abc', page: 1, limit: 10 });

    expect((res as any).items.length).toBe(2);
  });

  // ============================================================
  // FIND ONE
  // ============================================================
  it('should find one by typeCode', async () => {
    electionTypesModel.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve({ typeCode: 'TEST' }),
    });

    const result = await service.findOne('TEST');
    expect(result.typeCode).toBe('TEST');
  });

  it('should throw if typeCode not found', async () => {
    electionTypesModel.findOne.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve(null),
    });

    await expect(service.findOne('NOTFOUND')).rejects.toThrow(
      MESSAGE.ELECTION_TYPE_CODE_NOT_FOUND,
    );
  });

  // ============================================================
  // CREATE
  // ============================================================
  it('should create election type', async () => {
    const dto = { title: 'A', typeCode: 'T1' };

    electionTypesModel.create.mockResolvedValue({
      _id: oid(),
      ...dto,
    });

    const res = await service.create(dto as any, oid());

    expect(res.typeCode).toBe('T1');
  });

  // ============================================================
  // GET BY ID
  // ============================================================
  it('should get election type by id', async () => {
    const id = oid();

    electionTypesModel.findById.mockReturnValue({
      exec: () => Promise.resolve({ _id: id }),
    });

    const res = await service.getById(id);

    expect(res._id).toBe(id);
  });

  it('should throw if id not found', async () => {
    electionTypesModel.findById.mockReturnValue({
      exec: () => Promise.resolve(null),
    });

    await expect(service.getById(oid())).rejects.toThrow(
      MESSAGE.ELECTION_TYPE_NOT_FOUND,
    );
  });

  // ============================================================
  // UPDATE
  // ============================================================
  it('should update election type', async () => {
    const id = oid();

    // ⚡ FIX: findByIdAndUpdate phải return object thật
    electionTypesModel.findByIdAndUpdate.mockResolvedValue({
      _id: id,
      title: 'Updated',
    });

    const res = await service.update(id, { title: 'Updated' } as any, oid());

    expect((res as any).title).toBe('Updated');
  });

  it('should throw when updating non-existing election type', async () => {
    // ⚡ FIX: phải resolve null (KHÔNG có exec)
    electionTypesModel.findByIdAndUpdate.mockResolvedValue(null);

    await expect(
      service.update(oid(), { title: 'X' } as any, oid()),
    ).rejects.toThrow(MESSAGE.ELECTION_TYPE_NOT_FOUND);
  });
});
