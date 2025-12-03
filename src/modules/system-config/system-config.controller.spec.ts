import { Test, TestingModule } from '@nestjs/testing';
import { SystemConfigController } from './system-config.controller';
import { SystemConfigService } from './system-config.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('SystemConfigController', () => {
  let controller: SystemConfigController;
  let service: jest.Mocked<SystemConfigService>;

  const mockService = {
    search: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockReq = {
    user: { sub: '507f1f77bcf86cd799439011' },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemConfigController],
      providers: [
        {
          provide: SystemConfigService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SystemConfigController>(SystemConfigController);
    service = module.get(SystemConfigService);
    jest.clearAllMocks();
  });

  // ===========================================================================
  // SEARCH
  // ===========================================================================
  it('should return search results', async () => {
    const result = { data: [], page: 1 };
    service.search.mockResolvedValue(result as any);

    const response = await controller.search({} as any);

    expect(service.search).toHaveBeenCalled();
    expect(response.data).toEqual(result);
    expect(response.message).toBe(MESSAGE.SYSTEM_CONFIG_GET_ALL_SUCCESS);
  });

  it('should throw HttpException when search fails', async () => {
    service.search.mockRejectedValue(new Error('FAIL'));

    await expect(controller.search({} as any)).rejects.toThrow(HttpException);
  });

  // ===========================================================================
  // CREATE
  // ===========================================================================
  it('should create config successfully', async () => {
    const payload = { configKey: 'AA', groupType: 'A', configValue: '1' };
    const created = { id: 1 };

    service.create.mockResolvedValue(created as any);

    const response = await controller.create(payload as any, mockReq);

    expect(service.create).toHaveBeenCalledWith(payload, mockReq.user.sub);
    expect(response.data).toEqual(created);
    expect(response.message).toBe(MESSAGE.SYSTEM_CONFIG_CREATE_SUCCESS);
  });

  it('should throw HttpException when create fails', async () => {
    service.create.mockRejectedValue(new Error('Fail'));

    await expect(controller.create({} as any, mockReq)).rejects.toThrow(HttpException);
  });

  // ===========================================================================
  // GET BY ID
  // ===========================================================================
  it('should return config by id', async () => {
    const mockData = { id: 1 };
    service.findById.mockResolvedValue(mockData as any);

    const response = await controller.findOne('123');

    expect(service.findById).toHaveBeenCalledWith('123');
    expect(response.data).toEqual(mockData);
    expect(response.message).toBe(MESSAGE.SYSTEM_CONFIG_GET_BY_ID_SUCCESS);
  });

  it('should throw HttpException when findById fails', async () => {
    service.findById.mockRejectedValue(new Error('Not found'));

    await expect(controller.findOne('123')).rejects.toThrow(HttpException);
  });

  // ===========================================================================
  // UPDATE
  // ===========================================================================
  it('should update config successfully', async () => {
    const payload = { configKey: 'NEW' };
    const updated = { id: 1, configKey: 'NEW' };

    service.update.mockResolvedValue(updated as any);

    const response = await controller.update('123', payload as any, mockReq);

    expect(service.update).toHaveBeenCalledWith('123', payload, mockReq.user.sub);
    expect(response.data).toEqual(updated);
    expect(response.message).toBe(MESSAGE.SYSTEM_CONFIG_UPDATE_SUCCESS);
  });

  it('should throw HttpException when update fails', async () => {
    service.update.mockRejectedValue(new Error('Fail'));

    await expect(controller.update('1', {} as any, mockReq)).rejects.toThrow(HttpException);
  });

  // ===========================================================================
  // DELETE
  // ===========================================================================
  it('should delete config', async () => {
    const mockData = { id: 1 };

    service.remove.mockResolvedValue(mockData as any);

    const response = await controller.remove('123');

    expect(service.remove).toHaveBeenCalledWith('123');
    expect(response.data).toEqual(mockData);
    expect(response.message).toBe(MESSAGE.SYSTEM_CONFIG_DELETE_SUCCESS);
  });

  it('should throw HttpException when delete fails', async () => {
    service.remove.mockRejectedValue(new Error('Fail'));

    await expect(controller.remove('123')).rejects.toThrow(HttpException);
  });
});
