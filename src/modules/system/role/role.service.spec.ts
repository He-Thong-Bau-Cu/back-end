import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { STATUS } from '../../../common/enums/status.enum';
import { paginate } from '../../../common/dto/paignation';

// Helper to create valid ObjectId strings
const oid = () => new Types.ObjectId().toString();

jest.mock('../../../common/dto/paignation', () => ({
  paginate: jest.fn((data, page, limit) => ({
    data,
    page,
    limit,
  })),
}));

// ====== MOCK MONGOOSE MODEL FACTORY ======
function createModelMock() {
  const mockInstance = {
    save: jest.fn(),
  };
  
  // Create a constructor function
  const MockModel = jest.fn(() => mockInstance) as any;
  
  // Add model methods
  MockModel.find = jest.fn();
  MockModel.findOne = jest.fn();
  MockModel.findById = jest.fn();
  MockModel.findByIdAndUpdate = jest.fn();
  MockModel.findByIdAndDelete = jest.fn();
  MockModel.countDocuments = jest.fn();
  MockModel.exec = jest.fn();
  MockModel.create = jest.fn();
  
  // Store instance for access in tests
  MockModel._mockInstance = mockInstance;
  
  return MockModel;
}

describe('RoleService', () => {
  let service: RoleService;

  let mockRoleModel: any;
  let mockRolePermissionModel: any;
  let mockPermissionModel: any;

  beforeEach(async () => {
    mockRoleModel = createModelMock();
    mockRolePermissionModel = createModelMock();
    mockPermissionModel = createModelMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        { provide: getModelToken('Roles'), useValue: mockRoleModel },
        { provide: getModelToken('RolePermissions'), useValue: mockRolePermissionModel },
        { provide: getModelToken('Permissions'), useValue: mockPermissionModel },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  // =====================================================================
  it('should search roles', async () => {
    mockRoleModel.find.mockReturnValueOnce({ exec: () => ['roleA'] });

    const res = await service.searchRole({ page: 1, limit: 10, roleName: 'Admin' } as any);

    expect((res as any).data).toEqual(['roleA']);
  });

  // =====================================================================
  it('should return role stats', async () => {
    mockRoleModel.countDocuments
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(7)
      .mockResolvedValueOnce(3);

    const res = await service.getStatsRole();

    expect(res).toEqual({
      totalRole: 10,
      activeRole: 7,
      inactiveRole: 3,
    });
  });

  // =====================================================================
  it('should return permission stats', async () => {
    mockPermissionModel.countDocuments
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(8);

    const res = await service.getStatsPermission();

    expect(res).toEqual({
      totalPermission: 20,
      activePermission: 12,
      inactivePermission: 8,
    });
  });

  // =====================================================================
  it('should create role successfully', async () => {
    const roleId = oid();
    mockRoleModel.findOne.mockReturnValue({ exec: () => null }); // no duplicate

    const saveMock = jest.fn().mockResolvedValue({
      _id: roleId,
      roleName: 'Admin',
    });

    // Mock constructor to return instance with save method
    mockRoleModel.mockImplementation(() => ({
      save: saveMock,
      _id: roleId,
    }));

    const savePermission = jest.fn().mockResolvedValue({ id: oid() });
    mockRolePermissionModel.mockImplementation(() => ({
      save: savePermission,
    }));

    const res = await service.createRole({
      roleName: 'Admin',
      roleCode: 'ADMIN',
      description: '',
    } as any);

    expect(res._id).toBe(roleId);
  });

  // =====================================================================
  it('should update role successfully', async () => {
    const roleId = oid();
    const saveMock = jest.fn().mockResolvedValue({
      _id: roleId,
      roleName: 'NewRole',
    });

    mockRoleModel.findById.mockReturnValue({
      exec: () => ({
        _id: roleId,
        roleName: 'Old',
        save: saveMock,
      }),
    });

    mockRoleModel.findOne.mockReturnValue(null); // no duplication check fail

    const res = await service.updateRole({
      roleId: roleId,
      roleName: 'NewRole',
    } as any);

    expect(saveMock).toHaveBeenCalled();
  });

  // =====================================================================
  it('should return role detail', async () => {
    const roleId = oid();
    mockRoleModel.findById.mockReturnValue({
      exec: () => ({ id: roleId }),
    });

    const res = await service.detailRole(roleId);
    expect(res).toEqual({ id: roleId });
  });

  // =====================================================================
  it('should soft-delete a role', async () => {
    const roleId = oid();
    const saveMock = jest.fn().mockResolvedValue({ _id: roleId, status: STATUS.INACTIVE });

    mockRoleModel.findById.mockReturnValue({
      exec: () => ({
        _id: roleId,
        save: saveMock,
      }),
    });

    const res = await service.deleteRole(roleId);
    expect(res.status).toBe(STATUS.INACTIVE);
  });

  // =====================================================================
  it('should search role-permission', async () => {
    mockRolePermissionModel.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: () => [
          {
            _id: 'RP1',
            roleId: {
              _id: 'R1',
              roleName: 'Admin',
              roleCode: 'ADMIN',
              description: '',
              status: STATUS.ACTIVE,
            },
            permissionIds: [],
          },
        ],
      }),
    });

    const res = await service.searchRolePermission({ page: 1, limit: 10 } as any);
    expect((res as any).data.length).toBe(1);
    expect((res as any).data[0].roleName).toBe('Admin');
  });

  // =====================================================================
  it('should get all permissions', async () => {
    mockPermissionModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ id: 'P1' }]),
      }),
    });

    const res = await service.getAllPermission();
    expect(res.length).toBe(1);
  });

  // =====================================================================
  it('should update role-permission', async () => {
    const rolePermissionId = oid();
    const roleId = oid();
    const permissionId1 = oid();
    const permissionId2 = oid();
    const saveMock = jest.fn().mockResolvedValue({ ok: true });

    mockRolePermissionModel.findOne.mockReturnValue({
      exec: () => ({
        permissionIds: [],
        save: saveMock,
      }),
    });

    const res = await service.updateRolePermission({
      rolePermissionId: rolePermissionId,
      roleId: roleId,
      permissionIds: [permissionId1, permissionId2],
    });

    expect(saveMock).toHaveBeenCalled();
  });

  // =====================================================================
  it('should search permission', async () => {
    mockPermissionModel.find.mockReturnValue({
      exec: () => [{ id: 'P1' }],
    });

    const res = await service.searchPermission({
      permissionName: 'view',
      page: 1,
      limit: 10,
    } as any);

    expect((res as any).data.length).toBe(1);
  });

  // =====================================================================
  it('should create permission', async () => {
    const permissionId = oid();
    mockPermissionModel.findOne.mockReturnValue({ exec: () => null });

    const saveMock = jest.fn().mockResolvedValue({ id: permissionId });
    mockPermissionModel.mockImplementation(() => ({ save: saveMock }));

    const res = await service.createPermission({
      permissionName: 'View',
      permissionCode: 'VIEW',
      url: '/v',
    } as any);

    expect(res.id).toBe(permissionId);
  });

  // =====================================================================
  it('should update permission', async () => {
    const permissionId = oid();
    const saveMock = jest.fn().mockResolvedValue({ id: permissionId, permissionName: 'Updated' });

    mockPermissionModel.findById.mockReturnValue({
      exec: () => ({
        permissionName: 'Old',
        save: saveMock,
      }),
    });

    mockPermissionModel.findOne.mockReturnValue(null);

    const res = await service.updatePermission({
      permissionId: permissionId,
      permissionName: 'Updated',
    } as any);

    expect(saveMock).toHaveBeenCalled();
  });

  // =====================================================================
  it('should detail permission', async () => {
    const permissionId = oid();
    mockPermissionModel.findById.mockReturnValue({
      exec: () => ({ id: permissionId }),
    });

    const res = await service.detailPermission(permissionId);
    expect(res.id).toBe(permissionId);
  });

  // =====================================================================
  it('should delete permission', async () => {
    const permissionId = oid();
    const saveMock = jest.fn().mockResolvedValue({ id: permissionId, status: STATUS.INACTIVE });

    mockPermissionModel.findById.mockReturnValue({
      exec: () => ({ save: saveMock }),
    });

    const res = await service.deletePermission(permissionId);
    expect(res.status).toBe(STATUS.INACTIVE);
  });
});
