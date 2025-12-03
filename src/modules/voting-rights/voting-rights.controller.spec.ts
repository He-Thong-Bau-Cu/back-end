import { Test, TestingModule } from '@nestjs/testing';
import { VotingRightsController } from './voting-rights.controller';
import { VotingRightsService } from './voting-rights.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('VotingRightsController', () => {
  let controller: VotingRightsController;
  let service: VotingRightsService;

  const mockService = {
    getById: jest.fn(),
    getByElectionId: jest.fn(),
    getByVoterId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockReq = {
    user: { sub: 'USER_ID_123' },
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotingRightsController],
      providers: [
        { provide: VotingRightsService, useValue: mockService }
      ],
    }).compile();

    controller = module.get<VotingRightsController>(VotingRightsController);
    service = module.get<VotingRightsService>(VotingRightsService);
  });

  // =======================================================================
  // ✔ TEST getById
  // =======================================================================
  it('should return voting right by ID (SUCCESS)', async () => {
    const data = { id: '1', shares: 10 };
    mockService.getById.mockResolvedValue(data);

    const result = await controller.getById('1');
    expect(result.data).toEqual(data);
    expect(result.message).toBe(MESSAGE.VOTING_RIGHT_GET_BY_ID_SUCCESS);
  });

  it('should throw error when getById fails', async () => {
    mockService.getById.mockRejectedValue(new Error('ERR'));

    await expect(controller.getById('1')).rejects.toThrow(HttpException);
  });

  // =======================================================================
  // ✔ TEST getByElectionId
  // =======================================================================
  it('should return voting rights by electionId (SUCCESS)', async () => {
    const data = [{ id: '1' }];
    mockService.getByElectionId.mockResolvedValue(data);

    const result = await controller.getByElectionId('E1');
    expect(result.data).toEqual(data);
    expect(result.message).toBe(MESSAGE.VOTING_RIGHT_GET_BY_ELECTION_SUCCESS);
  });

  it('should throw error when getByElectionId fails', async () => {
    mockService.getByElectionId.mockRejectedValue(new Error('ERR'));

    await expect(controller.getByElectionId('E1')).rejects.toThrow(HttpException);
  });

  // =======================================================================
  // ✔ TEST getByVoterId
  // =======================================================================
  it('should return voting rights by voterId (SUCCESS)', async () => {
    const data = [{ id: 'V1' }];
    mockService.getByVoterId.mockResolvedValue(data);

    const result = await controller.getByVoterId('V1');
    expect(result.data).toEqual(data);
    expect(result.message).toBe(MESSAGE.VOTING_RIGHT_GET_BY_VOTER_SUCCESS);
  });

  it('should throw error when getByVoterId fails', async () => {
    mockService.getByVoterId.mockRejectedValue(new Error('ERR'));

    await expect(controller.getByVoterId('V1')).rejects.toThrow(HttpException);
  });

  // =======================================================================
  // ✔ TEST create
  // =======================================================================
  it('should create voting right (SUCCESS)', async () => {
    const dto = { shares: 10, votes: 10 };
    const data = { id: 'NEW', ...dto };

    mockService.create.mockResolvedValue(data);

    const result = await controller.create(dto as any, mockReq);
    expect(result.data).toEqual(data);
    expect(result.message).toBe(MESSAGE.VOTING_RIGHT_CREATE_SUCCESS);
    expect(service.create).toHaveBeenCalledWith(dto, mockReq.user.sub);
  });

  it('should throw error when create fails', async () => {
    mockService.create.mockRejectedValue(new Error('ERR'));

    await expect(controller.create({} as any, mockReq)).rejects.toThrow(HttpException);
  });

  // =======================================================================
  // ✔ TEST update
  // =======================================================================
  it('should update voting right (SUCCESS)', async () => {
    const dto = { shares: 20 };
    const data = { id: 'U1', ...dto };

    mockService.update.mockResolvedValue(data);

    const result = await controller.update('U1', dto, mockReq);
    expect(result.data).toEqual(data);
    expect(result.message).toBe(MESSAGE.VOTING_RIGHT_UPDATE_SUCCESS);
    expect(service.update).toHaveBeenCalledWith('U1', dto, mockReq.user.sub);
  });

  it('should throw error when update fails', async () => {
    mockService.update.mockRejectedValue(new Error('ERR'));

    await expect(controller.update('U1', {} as any, mockReq)).rejects.toThrow(HttpException);
  });

});
