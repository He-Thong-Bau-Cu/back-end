import { Test, TestingModule } from '@nestjs/testing';
import { ElectionParticipantsController } from './election-participants.controller';
import { ElectionParticipantsService } from './election-participants.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('ElectionParticipantsController', () => {
  let controller: ElectionParticipantsController;
  let service: ElectionParticipantsService;

  const mockService = {
    getParticipantsAsVoter: jest.fn(),
    getById: jest.fn(),
    getByElection: jest.fn(),
    getByUserId: jest.fn(),
    getParticipantsActive: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  const mockReq = {
    user: { sub: 'u001' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectionParticipantsController],
      providers: [
        { provide: ElectionParticipantsService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<ElectionParticipantsController>(ElectionParticipantsController);
    service = module.get<ElectionParticipantsService>(ElectionParticipantsService);

    jest.clearAllMocks();
  });

  // ==========================================================
  // getVotersByElectionId
  // ==========================================================
  it('should return success when getVotersByElectionId succeeds', async () => {
    const mockData = [{ id: 'v001' }];
    mockService.getParticipantsAsVoter.mockResolvedValue(mockData);

    const result = await controller.getVotersByElectionId('e001');

    expect(result).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.ELECTION_PARTICIPANT_GET_VOTERS_SUCCESS,
        HttpStatus.OK,
      ),
    );
  });

  it('should throw HttpException when getVotersByElectionId fails', async () => {
    mockService.getParticipantsAsVoter.mockRejectedValue(new Error('Error'));

    await expect(controller.getVotersByElectionId('e001')).rejects.toThrow(HttpException);
  });

  // ==========================================================
  // getById
  // ==========================================================
  it('should return success when getById succeeds', async () => {
    const mockData = { id: 'p001' };
    mockService.getById.mockResolvedValue(mockData);

    const result = await controller.getById('p001');

    expect(result).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.ELECTION_PARTICIPANT_GET_BY_ID,
        HttpStatus.OK,
      ),
    );
  });

  it('should throw HttpException when getById fails', async () => {
    mockService.getById.mockRejectedValue(new Error('Error'));

    await expect(controller.getById('p001')).rejects.toThrow(HttpException);
  });

  // ==========================================================
  // getByElection
  // ==========================================================
  it('should return success when getByElection succeeds', async () => {
    const mockData = [{ id: 'p1' }];
    mockService.getByElection.mockResolvedValue(mockData);

    const result = await controller.getByElection('e001');

    expect(result).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.ELECTION_PARTICIPANT_GET_BY_ELECTION,
        HttpStatus.OK,
      ),
    );
  });

  it('should throw HttpException when getByElection fails', async () => {
    mockService.getByElection.mockRejectedValue(new Error('Error'));

    await expect(controller.getByElection('e001')).rejects.toThrow(HttpException);
  });

  // ==========================================================
  // getByUser
  // ==========================================================
  it('should return success when getByUser succeeds', async () => {
    const mockData = [{ id: 'e11' }];
    mockService.getByUserId.mockResolvedValue(mockData);

    const result = await controller.getByUser('u123');

    expect(result).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.ELECTION_PARTICIPANT_GET_BY_USER_SUCCESS,
        HttpStatus.OK,
      ),
    );
  });

  it('should throw HttpException when getByUser fails', async () => {
    mockService.getByUserId.mockRejectedValue(new Error('Error'));

    await expect(controller.getByUser('u123')).rejects.toThrow(HttpException);
  });

  // ==========================================================
  // getActiveByElectionId
  // ==========================================================
  it('should return success when getActiveByElectionId succeeds', async () => {
    const mockData = [{ id: 'active1' }];
    mockService.getParticipantsActive.mockResolvedValue(mockData);

    const result = await controller.getActiveByElectionId('e001');

    expect(result).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.ELECTION_PARTICIPANT_GET_ACTIVE_BY_ELECTION,
        HttpStatus.OK,
      ),
    );
  });

  it('should throw HttpException when getActiveByElectionId fails', async () => {
    mockService.getParticipantsActive.mockRejectedValue(new Error('Error'));

    await expect(controller.getActiveByElectionId('e001')).rejects.toThrow(HttpException);
  });

  // ==========================================================
  // create
  // ==========================================================
  it('should return success when create succeeds', async () => {
    const dto = { userId: 'u1' };
    const mockData = { id: 'new' };

    mockService.create.mockResolvedValue(mockData);

    const result = await controller.create(dto as any, mockReq as any);

    expect(result).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.ELECTION_PARTICIPANT_CREATE_SUCCESS,
        HttpStatus.CREATED,
      ),
    );
  });

  it('should throw HttpException when create fails', async () => {
    mockService.create.mockRejectedValue(new Error('Error'));

    await expect(
      controller.create({} as any, mockReq as any),
    ).rejects.toThrow(HttpException);
  });

  // ==========================================================
  // delete
  // ==========================================================
  it('should return success when delete succeeds', async () => {
    mockService.delete.mockResolvedValue(true);

    const result = await controller.delete('p001');

    expect(result).toEqual(
      BaseResponse.success(
        true,
        MESSAGE.ELECTION_PARTICIPANT_DELETE_SUCCESS,
        HttpStatus.OK,
      ),
    );
  });

  it('should throw HttpException when delete fails', async () => {
    mockService.delete.mockRejectedValue(new Error('Error'));

    await expect(controller.delete('p001')).rejects.toThrow(HttpException);
  });

  // ==========================================================
  // update
  // ==========================================================
  it('should return success when update succeeds', async () => {
    const mockData = { id: 'updated' };
    mockService.update.mockResolvedValue(mockData);

    const result = await controller.update(
      'p001',
      { active: true } as any,
      mockReq as any,
    );

    expect(result).toEqual(
      BaseResponse.success(
        mockData,
        MESSAGE.ELECTION_PARTICIPANT_UPDATE_SUCCESS,
        HttpStatus.OK,
      ),
    );
  });

  it('should throw HttpException when update fails', async () => {
    mockService.update.mockRejectedValue(new Error('Error'));

    await expect(
      controller.update('p001', {} as any, mockReq as any),
    ).rejects.toThrow(HttpException);
  });
});
