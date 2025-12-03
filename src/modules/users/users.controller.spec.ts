import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MinioService } from '../minio/minio.service';
import { HttpStatus } from '@nestjs/common';
import { FileType } from 'src/common/enums/file-type.enum';
import { BaseResponse } from 'src/common/dto/base-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: any;
  let minioService: any;

  beforeEach(async () => {
    usersService = {
      getById: jest.fn(),
      getAll: jest.fn(),
      search: jest.fn(),
      create: jest.fn(),
      updateUser: jest.fn(),
      delete: jest.fn(),
      getStatsUser: jest.fn(),
      detail: jest.fn(),
      exportUsersToExcel: jest.fn(),
      importUsersFromExcel: jest.fn(),
      updateAvatar: jest.fn(),
    };

    minioService = {
      uploadFileNoEncrypt: jest.fn(),
      deleteFileByKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        { provide: MinioService, useValue: minioService },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  // ---------------------------------------------------------------------------
  // GET BY ID
  // ---------------------------------------------------------------------------
  it('should get user by ID', async () => {
    const mockUser = { id: '1', name: 'Test' };
    usersService.getById.mockResolvedValue(mockUser);

    const result = await controller.getById('1');

    expect(result.data).toEqual(mockUser);
    expect(result.status).toBe(HttpStatus.OK);
    expect(usersService.getById).toHaveBeenCalledWith('1');
  });

  // ---------------------------------------------------------------------------
  // GET ALL USERS
  // ---------------------------------------------------------------------------
  it('should get all users', async () => {
    const mockUsers = [{ id: 1 }, { id: 2 }];
    usersService.getAll.mockResolvedValue(mockUsers);

    const result = await controller.getAll();

    expect(result.data).toEqual(mockUsers);
    expect(usersService.getAll).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // SEARCH USERS
  // ---------------------------------------------------------------------------
  it('should search users', async () => {
    const mockSearch = { data: [{ id: 1 }], totalItems: 1 };
    usersService.search.mockResolvedValue(mockSearch);

    const result = await controller.search({ page: 1, limit: 10 } as any);

    expect(result.data).toEqual(mockSearch);
    expect(usersService.search).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // CREATE USER
  // ---------------------------------------------------------------------------
  it('should create a user', async () => {
    const mockUser = { id: 1 };
    usersService.create.mockResolvedValue(mockUser);

    const result = await controller.createUser({
      fullName: 'Test',
      email: 'test@gmail.com',
      phone: '0909000000',
      citizenId: '0123456789',
    } as any);

    expect(result.data).toEqual(mockUser);
    expect(result.status).toBe(HttpStatus.CREATED);
    expect(usersService.create).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // UPDATE USER
  // ---------------------------------------------------------------------------
  it('should update a user', async () => {
    const mockUpdated = { id: 1, fullName: 'Updated' };
    usersService.updateUser.mockResolvedValue(mockUpdated);

    const result = await controller.update('1', { fullName: 'Updated' } as any);

    expect(result.data).toEqual(mockUpdated);
    expect(usersService.updateUser).toHaveBeenCalledWith('1', { fullName: 'Updated' });
  });

  // ---------------------------------------------------------------------------
  // DELETE USER
  // ---------------------------------------------------------------------------
  it('should delete a user', async () => {
    const mockDeleted = { id: '1', status: 'INACTIVE' };
    usersService.delete.mockResolvedValue(mockDeleted);

    const result = await controller.delete('1');

    expect(result.data).toEqual(mockDeleted);
    expect(usersService.delete).toHaveBeenCalledWith('1');
  });

  // ---------------------------------------------------------------------------
  // GET USER STATS
  // ---------------------------------------------------------------------------
  it('should get stats', async () => {
    const mockStats = { totalUsers: 100 };
    usersService.getStatsUser.mockResolvedValue(mockStats);

    const result = await controller.getPermissionStatistics();

    expect(result.data).toEqual(mockStats);
    expect(usersService.getStatsUser).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // USER DETAIL
  // ---------------------------------------------------------------------------
  it('should get user detail', async () => {
    const mockDetail = { id: '1' };
    usersService.detail.mockResolvedValue(mockDetail);

    const result = await controller.detail('1');

    expect(result.data).toEqual(mockDetail);
    expect(usersService.detail).toHaveBeenCalledWith('1');
  });

  // ---------------------------------------------------------------------------
  // EXPORT EXCEL
  // ---------------------------------------------------------------------------
  it('should export users to excel', async () => {
    const mockFile = {
      buffer: Buffer.from('test'),
      fileName: 'users.xlsx',
    };

    usersService.exportUsersToExcel.mockResolvedValue(mockFile);

    const res: any = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await controller.exportUsers(res);

    expect(usersService.exportUsersToExcel).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(mockFile.buffer);
  });

  // ---------------------------------------------------------------------------
  // IMPORT EXCEL
  // ---------------------------------------------------------------------------
  it('should import users from excel', async () => {
    const file = { buffer: Buffer.from('excel data') };
    const mockResponse = { success: 10 };

    usersService.importUsersFromExcel.mockResolvedValue(mockResponse);

    const result = await controller.importUsers(file as any);

    expect(result.data).toEqual(mockResponse);
    expect(usersService.importUsersFromExcel).toHaveBeenCalledWith(file);
  });

  // ---------------------------------------------------------------------------
  // UPLOAD AVATAR
  // ---------------------------------------------------------------------------
  it('should upload avatar + update user avatar', async () => {
    const file = { buffer: Buffer.from('avatar') };
    const req: any = { user: { sub: '123' } };

    minioService.uploadFileNoEncrypt.mockResolvedValue({
      key: 'avatar/new.png',
    });

    usersService.updateAvatar.mockResolvedValue('avatar/new.png');

    const result = await controller.uploadAvatar(file as any, req);

    expect(minioService.uploadFileNoEncrypt).toHaveBeenCalledWith(
      FileType.PROFILE_IMAGE,
      '123',
      file
    );

    expect(usersService.updateAvatar).toHaveBeenCalledWith('123', 'avatar/new.png');
    expect(result.data).toBe('avatar/new.png');
  });
});
