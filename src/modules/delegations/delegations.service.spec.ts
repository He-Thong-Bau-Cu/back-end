import { Test, TestingModule } from '@nestjs/testing';
import { DelegationsService } from './delegations.service';
import { getModelToken } from '@nestjs/mongoose';
import { Delegations } from 'src/database/schemas/delegations.schema';
import { Elections } from 'src/database/schemas/elections.schema';
import { User } from 'src/database/schemas/users.schema';
import { ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import { Types } from 'mongoose';

describe('DelegationsService', () => {
  let service: DelegationsService;

  // === MOCK MONGOOSE MODELS ===
  const mockDelegationModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    exists: jest.fn(),
    create: jest.fn(),
  };
  const mockElectionModel = { exists: jest.fn() };
  const mockUserModel = { exists: jest.fn() };
  const mockDocumentModel = { exists: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DelegationsService,
        { provide: getModelToken(Delegations.name), useValue: mockDelegationModel },
        { provide: getModelToken(Elections.name), useValue: mockElectionModel },
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: getModelToken(ElectionDocuments.name), useValue: mockDocumentModel },
      ],
    }).compile();

    service = module.get<DelegationsService>(DelegationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================
  // ✅ FIXED HELPER for chaining populate calls properly
  // ===========================================================
  const mockPopulateChain = (returnValue: any) => {
    const exec = jest.fn().mockResolvedValue(returnValue);
    const chain = { populate: jest.fn().mockReturnThis(), exec };
    return chain;
  };

  // ===========================================================
  // ✅ TEST 1: getByElectionId
  // ===========================================================
  it('should return delegation when getByElectionId succeeds', async () => {
    const mockData = { id: 'e1', electionId: 'e1' };
    mockDelegationModel.findOne.mockReturnValue(mockPopulateChain(mockData));

    const result = await service.getByElectionId('e1');
    expect(result).toEqual(mockData);
    expect(mockDelegationModel.findOne).toHaveBeenCalledWith({ electionId: 'e1' });
  });

  it('should throw error when getByElectionId fails', async () => {
    mockDelegationModel.findOne.mockImplementation(() => {
      throw new Error('DB Error');
    });
    await expect(service.getByElectionId('e1')).rejects.toThrow('DB Error');
  });

  // ===========================================================
  // ✅ TEST 2: getById
  // ===========================================================
  it('should return delegation when getById succeeds', async () => {
    const mockData = { id: '507f1f77bcf86cd799439011' }; // valid ObjectId
    mockDelegationModel.findById.mockReturnValue(mockPopulateChain(mockData));

    const result = await service.getById(mockData.id);
    expect(result).toEqual(mockData);
    expect(mockDelegationModel.findById).toHaveBeenCalled();
  });

  it('should throw error when getById fails', async () => {
    mockDelegationModel.findById.mockImplementation(() => {
      throw new Error('Find error');
    });
    await expect(service.getById('507f1f77bcf86cd799439012')).rejects.toThrow('Find error');
  });

  // ===========================================================
  // ✅ TEST 3: getDeletaionsPending
  // ===========================================================
  it('should return delegation when getDeletaionsPending succeeds', async () => {
    const mockData = { id: 'p001', status: 'pending' };
    mockDelegationModel.findOne.mockReturnValue(mockPopulateChain(mockData));

    const result = await service.getDeletaionsPending();
    expect(result).toEqual(mockData);
    expect(mockDelegationModel.findOne).toHaveBeenCalledWith({ status: 'pending' });
  });

  it('should throw error when getDeletaionsPending fails', async () => {
    mockDelegationModel.findOne.mockImplementation(() => {
      throw new Error('Pending error');
    });
    await expect(service.getDeletaionsPending()).rejects.toThrow('Pending error');
  });

  // ===========================================================
  // ✅ TEST 4: create delegation
  // ===========================================================
  it('should create delegation successfully', async () => {
    const dto = { electionId: 'e1', delegatorId: 'u1', documentId: 'd1' };
    const mockCreated = { id: 'new001', ...dto };

    mockElectionModel.exists.mockResolvedValue(true);
    mockUserModel.exists.mockResolvedValue(true);
    mockDocumentModel.exists.mockResolvedValue(true);
    mockDelegationModel.create.mockResolvedValue(mockCreated);

    const result = await service.create(dto as any);
    expect(result).toEqual(mockCreated);
    expect(mockDelegationModel.create).toHaveBeenCalledWith(dto);
  });

  it('should throw error if election not found', async () => {
    mockElectionModel.exists.mockResolvedValue(false);
    await expect(service.create({ electionId: 'e1' } as any)).rejects.toThrow('Election is not found');
  });

  it('should throw error if user not found', async () => {
    mockElectionModel.exists.mockResolvedValue(true);
    mockUserModel.exists.mockResolvedValue(false);
    await expect(service.create({ electionId: 'e1', delegatorId: 'u1' } as any)).rejects.toThrow('User is not found');
  });

  it('should throw error if document not found', async () => {
    mockElectionModel.exists.mockResolvedValue(true);
    mockUserModel.exists.mockResolvedValue(true);
    mockDocumentModel.exists.mockResolvedValue(false);

    await expect(
      service.create({ electionId: 'e1', delegatorId: 'u1', documentId: 'd1' } as any),
    ).rejects.toThrow('Document is not found');
  });

  it('should throw if create() throws error', async () => {
    mockElectionModel.exists.mockResolvedValue(true);
    mockUserModel.exists.mockResolvedValue(true);
    mockDocumentModel.exists.mockResolvedValue(true);
    mockDelegationModel.create.mockRejectedValue(new Error('DB Insert Fail'));

    await expect(service.create({ electionId: 'e1', delegatorId: 'u1' } as any)).rejects.toThrow('DB Insert Fail');
  });

  // ===========================================================
  // ✅ TEST 5: update delegation
  // ===========================================================
  it('should update delegation successfully', async () => {
    const validId = '507f1f77bcf86cd799439012';
    const mockUpdated = { id: validId, status: 'approved' };

    mockDelegationModel.exists.mockResolvedValue(true);
    const execMock = jest.fn().mockResolvedValue(mockUpdated);
    mockDelegationModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

    const result = await service.update(validId, { status: 'approved' } as any);
    expect(result).toEqual(mockUpdated);
    expect(mockDelegationModel.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('should throw error if delegation not found', async () => {
    mockDelegationModel.exists.mockResolvedValue(false);
    await expect(service.update('507f1f77bcf86cd799439013', {} as any)).rejects.toThrow('Delegation not found');
  });

  it('should throw error if update fails', async () => {
    mockDelegationModel.exists.mockResolvedValue(true);
    mockDelegationModel.findByIdAndUpdate.mockImplementation(() => {
      throw new Error('Update failed');
    });
    await expect(service.update('507f1f77bcf86cd799439014', {} as any)).rejects.toThrow('Update failed');
  });
});
