import { Test, TestingModule } from '@nestjs/testing';
import { DelegationsController } from './delegations.controller';
import { DelegationsService } from './delegations.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('DelegationsController', () => {
  let controller: DelegationsController;
  let service: DelegationsService;

  const mockService = {
    getDelegationsByElectionId: jest.fn(),
    getByElectionId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    getDelegationsPending: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DelegationsController],
      providers: [
        { provide: DelegationsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<DelegationsController>(DelegationsController);
    service = module.get<DelegationsService>(DelegationsService);

    jest.clearAllMocks();
  });

  // =================================================================
  // getDelegationsByElectionId  (/delegations/election/:electionId)
  // =================================================================
  it('should return BaseResponse.success when getDelegationsByElectionId succeeds', async () => {
    const mockData = [{ id: '1' }];
    mockService.getByElectionId.mockResolvedValue(mockData);

    const result = await controller.getDelegationsByElectionId(
      '507f1f77bcf86cd799439011',
    );

    expect(result).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.DELEGATION_GET_BY_ELECTION_SUCCESS,
        HttpStatus.OK,
      ),
    );
  });

  it('should throw HttpException when getDelegationsByElectionId fails', async () => {
    mockService.getByElectionId.mockRejectedValue(new Error('Error'));

    await expect(
      controller.getDelegationsByElectionId('507f1f77bcf86cd799439011'),
    ).rejects.toThrow(HttpException);
  });

  // =================================================================
  // create
  // =================================================================
  it('should return BaseResponse.success when create succeeds', async () => {
    const dto = { name: 'test' };
    const mockData = { id: 'new-id' };

    mockService.create.mockResolvedValue(mockData);

    const result = await controller.create(dto as any, {
      user: { sub: '507f1f77bcf86cd799439099' },
    } as any);

    expect(result).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.DELEGATION_CREATE_SUCCESS,
        HttpStatus.CREATED,
      ),
    );
  });

  it('should throw HttpException when create fails', async () => {
    mockService.create.mockRejectedValue(new Error('Error'));

    await expect(
      controller.create({} as any, {
        user: { sub: '507f1f77bcf86cd799439099' },
      } as any),
    ).rejects.toThrow(HttpException);
  });

  // =================================================================
  // update
  // =================================================================
  it('should return BaseResponse.success when update succeeds', async () => {
    const mockData = { id: 'updated' };
    mockService.update.mockResolvedValue(mockData);

    const result = await controller.update(
      '507f1f77bcf86cd799439012',
      {},
      { user: { sub: '507f1f77bcf86cd799439099' } } as any,
    );

    expect(result).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.DELEGATION_UPDATE_SUCCESS,
        HttpStatus.OK,
      ),
    );
  });

  it('should throw HttpException when update fails', async () => {
    mockService.update.mockRejectedValue(new Error('Error'));

    await expect(
      controller.update(
        '507f1f77bcf86cd799439012',
        {},
        { user: { sub: '507f1f77bcf86cd799439099' } } as any,
      ),
    ).rejects.toThrow(HttpException);
  });

  // =================================================================
  // getDelegationsStatusPending (/delegations/pending)
  // =================================================================
  it('should return BaseResponse.success when getDelegationsPending succeeds', async () => {
    const mockData = [{ id: 'p001', status: 'pending' }];
    mockService.getDelegationsPending.mockResolvedValue(mockData);

    const result = await controller.getDelegationsStatusPending();

    expect(result).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.DELEGATION_GET_PENDING_SUCCESS,
        HttpStatus.OK,
      ),
    );
  });

  it('should throw HttpException when getDelegationsPending fails', async () => {
    mockService.getDelegationsPending.mockRejectedValue(new Error('Fail'));

    await expect(controller.getDelegationsStatusPending()).rejects.toThrow(
      HttpException,
    );
  });
});
