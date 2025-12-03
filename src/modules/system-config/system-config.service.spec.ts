import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigService } from './system-config.service';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MESSAGE } from 'src/common/enums/message.enum';

// Mock paginate
jest.mock('src/common/dto/paignation', () => ({
  paginate: (data, page, limit) => ({
    data,
    page,
    limit,
    total: data.length,
  }),
}));

describe('SystemConfigService', () => {
  let service: SystemConfigService;

  const validUserId = "507f1f77bcf86cd799439011";

  const mockModel = {
    find: jest.fn(),
    exists: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigService,
        { provide: getModelToken('SystemConfig'), useValue: mockModel },
      ],
    }).compile();

    service = module.get<SystemConfigService>(SystemConfigService);
  });

  // ===========================================================================
  // SEARCH
  // ===========================================================================
  it('should search and return paginated result', async () => {
    const mockData = [{ id: 'A' }, { id: 'B' }];

    mockModel.find.mockReturnValue({
      sort: () => ({
        exec: () => mockData,
      }),
    });

    const result = await service.search({ page: 1, limit: 10 } as any);

    expect((result as any).data).toEqual(mockData);
    expect(result.page).toBe(1);
  });

  // ===========================================================================
  // CREATE
  // ===========================================================================
  it('should throw if userId missing when creating', async () => {
    await expect(service.create({} as any, '')).rejects.toThrow(BadRequestException);
  });

  it('should throw if configKey already exists', async () => {
    mockModel.exists.mockResolvedValue(true);

    await expect(
      service.create({ configKey: 'test' } as any, validUserId),
    ).rejects.toThrow(MESSAGE.SYSTEM_CONFIG_ALREADY_EXIST);
  });

  it('should create config successfully', async () => {
    mockModel.exists.mockResolvedValue(false);
    mockModel.create.mockResolvedValue({ id: 1, configKey: 'TEST' });

    const result = await service.create(
      { configKey: 'test', groupType: 'abc', configValue: '123' } as any,
      validUserId,
    );

    expect(result).toEqual({ id: 1, configKey: 'TEST' });
  });

  // ===========================================================================
  // findById
  // ===========================================================================
  it('should return config by id', async () => {
    mockModel.findById.mockReturnValue({ exec: () => ({ id: 1 }) });

    const result = await service.findById('1');
    expect(result).toEqual({ id: 1 });
  });

  it('should throw when config not found', async () => {
    mockModel.findById.mockReturnValue({ exec: () => null });

    await expect(service.findById('1')).rejects.toThrow(NotFoundException);
  });

  // ===========================================================================
  // UPDATE
  // ===========================================================================
  it('should throw if userId missing when updating', async () => {
    await expect(service.update('1', {} as any, '')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw when updating non-existing config', async () => {
    mockModel.findById.mockReturnValue({ exec: () => null });

    await expect(service.update('1', {} as any, validUserId)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update config key and save', async () => {
    const saveFn = jest.fn().mockResolvedValue(true);

    const mockConfig = {
      configKey: 'OLD',
      save: saveFn,
    };

    mockModel.findById.mockReturnValue({ exec: () => mockConfig });
    mockModel.exists.mockResolvedValue(false);

    await service.update(
      '1',
      { configKey: 'NEW', groupType: 'abc', configValue: '123' } as any,
      validUserId,
    );

    expect(mockConfig.configKey).toBe('NEW');
    expect(saveFn).toHaveBeenCalled();
  });

  it('should throw if new configKey already exists', async () => {
    const mockConfig = {
      configKey: 'OLD',
      save: jest.fn(),
    };

    mockModel.findById.mockReturnValue({ exec: () => mockConfig });
    mockModel.exists.mockResolvedValue(true);

    await expect(
      service.update('1', { configKey: 'EXIST' } as any, validUserId),
    ).rejects.toThrow(MESSAGE.SYSTEM_CONFIG_ALREADY_EXIST);
  });

  // ===========================================================================
  // REMOVE
  // ===========================================================================
  it('should delete config', async () => {
    mockModel.findByIdAndDelete.mockReturnValue({ exec: () => ({ id: 1 }) });

    const result = await service.remove('1');
    expect(result).toEqual({ id: 1 });
  });

  it('should throw when deleting non-existing config', async () => {
    mockModel.findByIdAndDelete.mockReturnValue({ exec: () => null });

    await expect(service.remove('1')).rejects.toThrow(NotFoundException);
  });

  // ===========================================================================
  // normalizeConfigValue
  // ===========================================================================
  it('should return null for empty string', () => {
    expect((service as any).normalizeConfigValue('')).toBeNull();
  });

  it('should parse JSON string', () => {
    expect((service as any).normalizeConfigValue('{"a":1}')).toEqual({ a: 1 });
  });

  it('should return trimmed string when not valid JSON', () => {
    expect((service as any).normalizeConfigValue(' abc ')).toBe('abc');
  });
});
