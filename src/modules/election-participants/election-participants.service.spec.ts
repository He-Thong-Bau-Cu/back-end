import { Test, TestingModule } from '@nestjs/testing';
import { ElectionParticipantsService } from './election-participants.service';
import { getModelToken } from '@nestjs/mongoose';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { Elections } from 'src/database/schemas/elections.schema';
import { Users } from 'src/database/schemas/users.schema';
import { Roles } from 'src/database/schemas/roles.schema';
import { RolePermissions } from 'src/database/schemas/rolePermissions.schema';
import { Voters } from 'src/database/schemas/voters.schema';
import { Permissions } from 'src/database/schemas/permissions.schema';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

// Helper to create valid ObjectId strings
const oid = () => new Types.ObjectId().toString();

// 🌟 Factory tạo mock model
const mockModel = () => ({
  exists: jest.fn(),
  create: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn().mockReturnThis(),
  exec: jest.fn(),
});

describe('ElectionParticipantsService', () => {
  let service: ElectionParticipantsService;

  // 🌟 Tạo mock cho các collection
  const mockElectionParticipantsModel = mockModel();
  const mockElectionsModel = mockModel();
  const mockUsersModel = mockModel();
  const mockRolesModel = mockModel();
  const mockRolePermissionsModel = mockModel();
  const mockVotersModel = mockModel();
  const mockPermissionsModel = mockModel();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionParticipantsService,
        { provide: getModelToken(ElectionsParticipants.name), useValue: mockElectionParticipantsModel },
        { provide: getModelToken(Elections.name), useValue: mockElectionsModel },
        { provide: getModelToken(Users.name), useValue: mockUsersModel },
        { provide: getModelToken(Roles.name), useValue: mockRolesModel },
        { provide: getModelToken(RolePermissions.name), useValue: mockRolePermissionsModel },
        { provide: getModelToken(Voters.name), useValue: mockVotersModel },
        { provide: getModelToken(Permissions.name), useValue: mockPermissionsModel },
      ],
    }).compile();

    service = module.get<ElectionParticipantsService>(ElectionParticipantsService);
  });

  afterEach(() => jest.clearAllMocks());

  const electionId = oid();
  const userId = oid();
  const roleId = oid();
  const adminUserId = oid();
  
  const dto = {
    electionId: electionId,
    userId: userId,
    roleId: roleId,
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  //  Election not found
  // ============================================
  it('should throw if election not found', async () => {
    mockElectionsModel.exists.mockResolvedValue(false);

    await expect(service.create(dto as any, adminUserId))
      .rejects.toThrow(NotFoundException);

    expect(mockElectionsModel.exists).toHaveBeenCalled();
  });

  //  User not found
  // ============================================
  it('should throw if user not found', async () => {
    mockElectionsModel.exists.mockResolvedValue(true);
    mockUsersModel.exists.mockResolvedValue(false);

    await expect(service.create(dto as any, adminUserId))
      .rejects.toThrow(NotFoundException);

    expect(mockUsersModel.exists).toHaveBeenCalled();
  });

  //  Role not found
  // ============================================
  it('should throw if role not found', async () => {
    mockElectionsModel.exists.mockResolvedValue(true);
    mockUsersModel.exists.mockResolvedValue(true);
    mockRolesModel.exists.mockResolvedValue(false);
    // Mock findOne to return null (no existing participant)
    mockElectionParticipantsModel.findOne.mockResolvedValue(null);

    await expect(service.create(dto as any, adminUserId))
      .rejects.toThrow(NotFoundException);

    expect(mockRolesModel.exists).toHaveBeenCalled();
  });

  // ============================================
  // ✅ Create success
  // ============================================
  it('should create participant successfully', async () => {
    const participantId = oid();
    const mockParticipant = { _id: participantId, ...dto };

    mockElectionsModel.exists.mockResolvedValue(true);
    mockUsersModel.exists.mockResolvedValue(true);
    mockRolesModel.exists.mockResolvedValue(true);
    // Mock findOne to return null (no existing participant)
    mockElectionParticipantsModel.findOne.mockResolvedValue(null);
    mockElectionParticipantsModel.create.mockResolvedValue(mockParticipant);

    const result = await service.create(dto as any, adminUserId);

    expect(result).toEqual(mockParticipant);
    expect(mockElectionParticipantsModel.create).toHaveBeenCalled();
  });
});
