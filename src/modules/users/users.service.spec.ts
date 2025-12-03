import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { MailService } from '../mail/mail.service';
import { MinioService } from '../minio/minio.service';
import { ElasticsearchService } from '../elasticsearch/elasticsearch.service';
import { Types } from 'mongoose';
import { STATUS } from '../../common/enums/status.enum';

process.env.MINIO_BUCKET_NAME = 'test-bucket';

// -------------------------------------------------------
// MOCK USER MODEL (PHẢI LÀ CLASS ĐỂ new this.userModel() KO LỖI)
// -------------------------------------------------------
class MockUserModel {
  constructor(data) {
    Object.assign(this, data);
  }

  save = jest.fn().mockResolvedValue(this);

  static find = jest.fn();
  static findById = jest.fn();
  static findOne = jest.fn();
  static countDocuments = jest.fn();
  static create = jest.fn((data) => new MockUserModel(data));
}

// MOCK ROLE MODEL
class MockRoleModel {
  static findOne = jest.fn();
}

// MOCK Election Model
class MockElectionParticipantModel {}
class MockElectionModel {}

const mockMailService = {
  sendMail: jest.fn(),
  sendMailDelegatge: jest.fn(),
};

const mockMinioService = {
  deleteFileByKey: jest.fn(),
};

const mockElasticsearchService = {
  indexUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken('Users'), useValue: MockUserModel },
        { provide: getModelToken('Roles'), useValue: MockRoleModel },
        { provide: getModelToken('ElectionsParticipants'), useValue: MockElectionParticipantModel },
        { provide: getModelToken('Elections'), useValue: MockElectionModel },
        { provide: MailService, useValue: mockMailService },
        { provide: MinioService, useValue: mockMinioService },
        { provide: ElasticsearchService, useValue: mockElasticsearchService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  // ============================================================
  // getById
  // ============================================================
  describe('getById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '1' };

      MockUserModel.findById.mockReturnValue({
        populate: () => ({
          exec: () => Promise.resolve(mockUser),
        }),
      });

      const result = await service.getById(new Types.ObjectId().toString());

      expect(result).toEqual(mockUser);
    });

    it('should throw when user not found', async () => {
      MockUserModel.findById.mockReturnValue({
        populate: () => ({
          exec: () => Promise.resolve(null),
        }),
      });

      await expect(service.getById(new Types.ObjectId().toString())).rejects.toThrow();
    });
  });

  // ============================================================
  // search
  // ============================================================
  describe('search', () => {
    it('should return paginated users', async () => {
      const mockUsers = [{ id: 1 }, { id: 2 }];

      MockUserModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUsers),
      });

      MockUserModel.countDocuments.mockResolvedValue(2);

      const result = await service.search({ page: 1, limit: 10 } as any);

      expect(result.totalItems).toBe(2);
      expect(result.content.length).toBe(2);
      expect(MockUserModel.find).toHaveBeenCalled();
    });
  });

  // ============================================================
  // create
  // ============================================================
  describe('create', () => {
    it('should create new user and send email', async () => {
      const dto: any = {
        fullName: 'Nguyen Van A',
        email: 'a@gmail.com',
        phone: '0909000000',
        citizenId: '012345678912',
      };

      // mock email + phone duplicate check
      MockUserModel.findOne.mockReturnValue({
        exec: () => Promise.resolve(null),
      });

      // mock username generation
      MockUserModel.find.mockReturnValue({
        select: () => ({
          lean: () => Promise.resolve([]),
        }),
      });

      // mock role
      MockRoleModel.findOne.mockReturnValue({
        exec: () => Promise.resolve({ _id: new Types.ObjectId() }),
      });

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(mockMailService.sendMail).toHaveBeenCalled();
    });
  });

  // ============================================================
  // updateUser
  // ============================================================
  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = new Types.ObjectId().toString();

      const mockUser: any = {
        fullName: 'Old Name',
        save: jest.fn().mockResolvedValue(true),
      };

      MockUserModel.findById.mockReturnValue({
        exec: () => Promise.resolve(mockUser),
      });

      MockUserModel.find.mockReturnValue({
        exec: () => Promise.resolve([]),
      });

      const result = await service.updateUser(userId, { fullName: 'New Name' } as any);

      expect(result.fullName).toBe('New Name');
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  // ============================================================
  // delete
  // ============================================================
  describe('delete', () => {
    it('should set user INACTIVE', async () => {
      const mockUser: any = {
        status: STATUS.ACTIVE,
        save: jest.fn().mockResolvedValue({ status: STATUS.INACTIVE }),
      };

      MockUserModel.findById.mockReturnValue({
        exec: () => Promise.resolve(mockUser),
      });

      const result = await service.delete(new Types.ObjectId().toString());

      expect(result.status).toBe(STATUS.INACTIVE);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  // ============================================================
  // updateAvatar
  // ============================================================
  describe('updateAvatar', () => {
    it('should delete old avatar and update to new URL', async () => {
      const mockUser: any = {
        image: 'https://minio/test-bucket/avatar-old.png',
        save: jest.fn().mockResolvedValue(true),
      };

      MockUserModel.findById.mockResolvedValue(mockUser);

      const newUrl = 'https://minio/test-bucket/avatar-new.png';

      const result = await service.updateAvatar('user-id', newUrl);

      expect(mockMinioService.deleteFileByKey).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toBe(newUrl);
    });
  });

  // ============================================================
  // getStatsUser
  // ============================================================
  describe('getStatsUser', () => {
    it('should return correct user statistics', async () => {
      MockUserModel.countDocuments
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(8)  // active
        .mockResolvedValueOnce(2)  // inactive
        .mockResolvedValueOnce(3); // new temp password

      const result = await service.getStatsUser();

      expect(result).toEqual({
        totalUsers: 10,
        activeUsers: 8,
        inactiveUsers: 2,
        newUsers: 3,
      });
    });
  });
});
