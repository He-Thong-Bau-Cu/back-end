import { Test, TestingModule } from '@nestjs/testing';
import { DelegationsController } from './delegations.controller';
import { DelegationsService } from './delegations.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseResponse } from 'src/common/dto/base-response.dto';

describe('DelegationsController', () => {
  let controller: DelegationsController;
  let service: DelegationsService;

  // Mock service
  const mockDelegationsService = {
    getByElectionId: jest.fn(),
    getDeletaionsPending: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DelegationsController],
      providers: [
        {
          provide: DelegationsService,
          useValue: mockDelegationsService,
        },
      ],
    }).compile();

    controller = module.get<DelegationsController>(DelegationsController);
    service = module.get<DelegationsService>(DelegationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ===================================
  // ✅ TEST 1: Controller definition
  // ===================================
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ===================================
  // ✅ TEST 2: getDelegationsByElectionId
  // ===================================
  it('should return BaseResponse.success when getByElectionId succeeds', async () => {
    const mockData = [{ id: 'd001', name: 'Ủy quyền A' }];
    (service.getByElectionId as jest.Mock).mockResolvedValue(mockData);

    const result = await controller.getDelegationsByElectionId('e123');

    expect(result).toEqual(
      BaseResponse.success(mockData, 'Lấy thông tin ủy quyền theo cuộc bầu cử thành công', HttpStatus.OK),
    );
    expect(service.getByElectionId).toHaveBeenCalledWith('e123');
  });

  it('should throw HttpException when getByElectionId throws error', async () => {
    (service.getByElectionId as jest.Mock).mockRejectedValue(new Error('Database Error'));

    await expect(controller.getDelegationsByElectionId('e123')).rejects.toThrow(HttpException);
    await expect(controller.getDelegationsByElectionId('e123')).rejects.toThrow('Database Error');
  });

  // ===================================
  // ✅ TEST 3: getDelegationsStatusPending
  // ===================================
  it('should return BaseResponse.success when getDeletaionsPending succeeds', async () => {
    const mockData = [{ id: 'p001', status: 'pending' }];
    (service.getDeletaionsPending as jest.Mock).mockResolvedValue(mockData);

    const result = await controller.getDelegationsStatusPending();

    expect(result).toEqual(
      BaseResponse.success(mockData, 'Lấy danh sách ủy quyền cần xác minh', HttpStatus.OK),
    );
    expect(service.getDeletaionsPending).toHaveBeenCalled();
  });

  it('should throw HttpException when getDeletaionsPending throws error', async () => {
    (service.getDeletaionsPending as jest.Mock).mockRejectedValue(new Error('Server Error'));

    await expect(controller.getDelegationsStatusPending()).rejects.toThrow(HttpException);
    await expect(controller.getDelegationsStatusPending()).rejects.toThrow('Server Error');
  });

  // ===================================
  // ✅ TEST 4: create delegation
  // ===================================
  it('should return BaseResponse.success when create succeeds', async () => {
    const dto = { electionId: 'e1', delegatorId: 'u1' };
    const mockCreated = { id: 'd002', ...dto };
    (service.create as jest.Mock).mockResolvedValue(mockCreated);

    const result = await controller.create(dto as any);

    expect(result).toEqual(
      BaseResponse.success(mockCreated, 'Tạo ủy quyền thành công', HttpStatus.CREATED),
    );
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should throw HttpException when create fails', async () => {
    (service.create as jest.Mock).mockRejectedValue(new Error('Create failed'));

    await expect(controller.create({} as any)).rejects.toThrow(HttpException);
    await expect(controller.create({} as any)).rejects.toThrow('Create failed');
  });

  // ===================================
  // ✅ TEST 5: update delegation
  // ===================================
  it('should return BaseResponse.success when update succeeds', async () => {
    const id = 'd003';
    const dto = { status: 'approved' };
    const mockUpdated = { id, ...dto };
    (service.update as jest.Mock).mockResolvedValue(mockUpdated);

    const result = await controller.update(id, dto as any);

    expect(result).toEqual(
      BaseResponse.success(mockUpdated, 'Cập nhật ủy quyền thành công', HttpStatus.OK),
    );
    expect(service.update).toHaveBeenCalledWith(id, dto);
  });

  it('should throw HttpException when update fails', async () => {
    (service.update as jest.Mock).mockRejectedValue(new Error('Update failed'));

    await expect(controller.update('d003', {} as any)).rejects.toThrow(HttpException);
    await expect(controller.update('d003', {} as any)).rejects.toThrow('Update failed');
  });
});
