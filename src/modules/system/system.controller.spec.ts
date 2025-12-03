import { Test, TestingModule } from '@nestjs/testing';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { RoleService } from './role/role.service';

describe('SystemController', () => {
  let controller: SystemController;
  let systemService: jest.Mocked<SystemService>;
  let roleService: jest.Mocked<RoleService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemController],
      providers: [
        {
          provide: SystemService,
          useValue: {
            getStatisticsCards: jest.fn(),
            getParticipationRateChart: jest.fn(),
            getResultDistributionChart: jest.fn(),
            getOngoingPolls: jest.fn(),
            getRecentActivities: jest.fn(),
            searchSystemLogs: jest.fn(),
            searchAuditLogs: jest.fn(),
            getSystemLogStatistics: jest.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            searchRole: jest.fn(),
            createRole: jest.fn(),
            updateRole: jest.fn(),
            detailRole: jest.fn(),
            deleteRole: jest.fn(),
            updateRolePermission: jest.fn(),
            searchPermission: jest.fn(),
            createPermission: jest.fn(),
            updatePermission: jest.fn(),
            detailPermission: jest.fn(),
            deletePermission: jest.fn(),
            searchRolePermission: jest.fn(),
            getAllPermission: jest.fn(),
            getStatsRole: jest.fn(),
            getStatsPermission: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SystemController>(SystemController);
    systemService = module.get(SystemService);
    roleService = module.get(RoleService);
  });

  // =====================================================
  // SYSTEM SERVICE TESTS
  // =====================================================

  it('should get statistics cards', async () => {
    systemService.getStatisticsCards.mockResolvedValue({ a: 1 } as any);

    const res = await controller.getStatisticsCards();
    expect(res.data).toEqual({ a: 1 });
  });

  it('should return participation chart', async () => {
    systemService.getParticipationRateChart.mockResolvedValue([1, 2, 3] as any);

    const res = await controller.getParticipationRateChart();
    expect(res.data).toEqual([1, 2, 3]);
  });

  it('should return result distribution chart', async () => {
    systemService.getResultDistributionChart.mockResolvedValue([5, 10] as any);

    const res = await controller.getResultDistributionChart();
    expect(res.data).toEqual([5, 10]);
  });

  it('should return ongoing polls', async () => {
    systemService.getOngoingPolls.mockResolvedValue([{ id: 1 }] as any);

    const res = await controller.getOngoingPolls();
    expect(res.data).toEqual([{ id: 1 }]);
  });

  it('should return recent activities', async () => {
    systemService.getRecentActivities.mockResolvedValue(['A', 'B'] as any);

    const res = await controller.getRecentActivities();
    expect(res.data).toEqual(['A', 'B']);
  });

  it('should search system logs', async () => {
    systemService.searchSystemLogs.mockResolvedValue({
      data: ['log'],
      page: 1,
      limit: 10,
      total: 1,
    } as any);

    const res = await controller.searchSystemLogs({ keyword: '' } as any);
    expect(res.data).toEqual({
      data: ['log'],
      page: 1,
      limit: 10,
      total: 1,
    });
  });

  it('should search audit logs', async () => {
    systemService.searchAuditLogs.mockResolvedValue({
      data: ['audit'],
      page: 1,
      limit: 10,
      total: 1,
    } as any);

    const res = await controller.searchAuditLogs({ keyword: '' } as any);
    expect(res.data).toEqual({
      data: ['audit'],
      page: 1,
      limit: 10,
      total: 1,
    });
  });

  it('should get system log statistics', async () => {
    systemService.getSystemLogStatistics.mockResolvedValue({
      data: [1, 2] as any,
      metadata: { total: 2 },
    } as any);

    const res = await controller.getSystemLogStatistics('week');

    expect(res.data).toEqual([1, 2]);
    expect((res as any).metadata).toBeUndefined();
  });

  // =====================================================
  // ROLE SERVICE TESTS
  // =====================================================

  it('should search roles', async () => {
    roleService.searchRole.mockResolvedValue([{ id: 1 }] as any);

    const res = await controller.searchRole({} as any);
    expect(res.data).toEqual([{ id: 1 }]);
  });

  it('should create role', async () => {
    roleService.createRole.mockResolvedValue({ role: 'A' } as any);

    const res = await controller.createRole({} as any);
    expect(res.data).toEqual({ role: 'A' });
  });

  it('should update role', async () => {
    roleService.updateRole.mockResolvedValue({ updated: true } as any);

    const res = await controller.updateRole({} as any);
    expect(res.data).toEqual({ updated: true });
  });

  it('should get role by id', async () => {
    roleService.detailRole.mockResolvedValue({ id: '123' } as any);

    const res = await controller.getRoleById('123');
    expect(res.data).toEqual({ id: '123' });
  });

  it('should delete role', async () => {
    roleService.deleteRole.mockResolvedValue({ deleted: true } as any);

    const res = await controller.deleteRole('111');
    expect(res.data).toEqual({ deleted: true });
  });

  it('should update role permission', async () => {
    roleService.updateRolePermission.mockResolvedValue({ ok: true } as any);

    const res = await controller.updateRolePermission({} as any);
    expect(res.data).toEqual({ ok: true });
  });

  it('should search permissions', async () => {
    roleService.searchPermission.mockResolvedValue([{ id: 10 }] as any);

    const res = await controller.searchPermission({} as any);
    expect(res.data).toEqual([{ id: 10 }]);
  });

  it('should create permission', async () => {
    roleService.createPermission.mockResolvedValue({ created: 999 } as any);

    const res = await controller.createPermission({} as any);
    expect(res.data).toEqual({ created: 999 });
  });

  it('should update permission', async () => {
    roleService.updatePermission.mockResolvedValue({ updated: 100 } as any);

    const res = await controller.updatePermission({} as any);
    expect(res.data).toEqual({ updated: 100 });
  });

  it('should get permission by id', async () => {
    roleService.detailPermission.mockResolvedValue({ id: 'p1' } as any);

    const res = await controller.getPermissionById('p1');
    expect(res.data).toEqual({ id: 'p1' });
  });

  it('should delete permission', async () => {
    roleService.deletePermission.mockResolvedValue({ deleted: 1 } as any);

    const res = await controller.deletePermission('p2');
    expect(res.data).toEqual({ deleted: 1 });
  });

  it('should search role permissions', async () => {
    roleService.searchRolePermission.mockResolvedValue(['rp'] as any);

    const res = await controller.searchRolePermission({} as any);
    expect(res.data).toEqual(['rp']);
  });

  it('should get all permissions', async () => {
    roleService.getAllPermission.mockResolvedValue([1, 2, 3] as any);

    const res = await controller.getAllPermission();
    expect(res.data).toEqual([1, 2, 3]);
  });

  it('should get role statistics', async () => {
    roleService.getStatsRole.mockResolvedValue({
      totalRole: 100,
      activeRole: 80,
      inactiveRole: 20,
    });

    const res = await controller.getRoleStatistics();
    expect(res.data).toEqual({
      totalRole: 100,
      activeRole: 80,
      inactiveRole: 20,
    });
  });

  it('should get permission statistics', async () => {
    roleService.getStatsPermission.mockResolvedValue({
      totalPermission: 200,
      activePermission: 150,
      inactivePermission: 50,
    });

    const res = await controller.getPermissionStatistics();
    expect(res.data).toEqual({
      totalPermission: 200,
      activePermission: 150,
      inactivePermission: 50,
    });
  });
});
