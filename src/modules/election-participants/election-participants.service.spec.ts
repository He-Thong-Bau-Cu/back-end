import { Test, TestingModule } from '@nestjs/testing';
import { ElectionParticipantsService } from './election-participants.service';
import { NotFoundException } from '@nestjs/common';

describe('ElectionParticipantsService', () => {
  let service: ElectionParticipantsService;

  // 🧩 Factory tạo mock model thống nhất
  const mockModel = () => ({
    exists: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  });

  // 🧩 Tạo các mock model riêng biệt
  const mockElectionParticipantsModel = mockModel();
  const mockElectionsModel = mockModel();
  const mockUsersModel = mockModel();
  const mockRolesModel = mockModel();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionParticipantsService,
        { provide: 'ElectionParticipantsModel', useValue: mockElectionParticipantsModel },
        { provide: 'ElectionsModel', useValue: mockElectionsModel },
        { provide: 'UserModel', useValue: mockUsersModel },
        { provide: 'RolesModel', useValue: mockRolesModel },
      ],
    }).compile();

    service = module.get<ElectionParticipantsService>(ElectionParticipantsService);
  });

  afterEach(() => jest.clearAllMocks());

  const dto = {
    electionId: 'E1',
    userId: 'U1',
    roleId: 'R1',
  };

  // ===========================
  // ✅ TEST CASES
  // ===========================
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw if election not found', async () => {
    mockElectionsModel.exists.mockResolvedValue(false);

    await expect(service.create(dto as any)).rejects.toThrow(NotFoundException);
    expect(mockElectionsModel.exists).toHaveBeenCalledWith({ _id: dto.electionId });
  });

  it('should throw if user not found', async () => {
    mockElectionsModel.exists.mockResolvedValue(true);
    mockUsersModel.exists.mockResolvedValue(false);

    await expect(service.create(dto as any)).rejects.toThrow(NotFoundException);
    expect(mockUsersModel.exists).toHaveBeenCalledWith({ _id: dto.userId });
  });

  it('should throw if role not found', async () => {
    mockElectionsModel.exists.mockResolvedValue(true);
    mockUsersModel.exists.mockResolvedValue(true);
    mockRolesModel.exists.mockResolvedValue(false);

    await expect(service.create(dto as any)).rejects.toThrow(NotFoundException);
    expect(mockRolesModel.exists).toHaveBeenCalledWith({ _id: dto.roleId });
  });

  it('should create participant successfully', async () => {
    const mockParticipant = { _id: 'P123', ...dto };

    mockElectionsModel.exists.mockResolvedValue(true);
    mockUsersModel.exists.mockResolvedValue(true);
    mockRolesModel.exists.mockResolvedValue(true);
    mockElectionParticipantsModel.create.mockResolvedValue(mockParticipant);

    const result = await service.create(dto as any);

    expect(result).toEqual(mockParticipant);
    expect(mockElectionParticipantsModel.create).toHaveBeenCalledWith(dto);
  });
});
