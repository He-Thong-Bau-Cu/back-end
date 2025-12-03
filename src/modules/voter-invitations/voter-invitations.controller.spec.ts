import { Test, TestingModule } from '@nestjs/testing';
import { VoterInvitationsController } from './voter-invitations.controller';
import { VoterInvitationsService } from './voter-invitations.service';
import { HttpStatus } from '@nestjs/common';
import { BaseResponse } from 'src/common/dto/base-response.dto';

describe('VoterInvitationsController', () => {
  let controller: VoterInvitationsController;
  let service: any;

  beforeEach(async () => {
    service = {
      getById: jest.fn(),
      getByElectionId: jest.fn(),
      getByVoterId: jest.fn(),
      create: jest.fn(),
      confirmationVoterInvitation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoterInvitationsController],
      providers: [
        { provide: VoterInvitationsService, useValue: service },
      ],
    }).compile();

    controller = module.get<VoterInvitationsController>(VoterInvitationsController);
  });

  // ---------------------------------------------------------------------
  // GET BY ID
  // ---------------------------------------------------------------------
  it('should get invitation by id', async () => {
    const mockData = { id: '1', electionId: 'E1' };
    service.getById.mockResolvedValue(mockData);

    const result = await controller.getById('1');

    expect(result.data).toEqual(mockData);
    expect(result.status).toBe(HttpStatus.OK);
    expect(service.getById).toHaveBeenCalledWith('1');
  });

  // ---------------------------------------------------------------------
  // GET BY ELECTION ID
  // ---------------------------------------------------------------------
  it('should get invitations by election ID', async () => {
    const mockData = [{ id: '1', electionId: 'EC1' }];
    service.getByElectionId.mockResolvedValue(mockData);

    const result = await controller.getByElectionId('EC1');

    expect(result.data).toEqual(mockData);
    expect(service.getByElectionId).toHaveBeenCalledWith('EC1');
  });

  // ---------------------------------------------------------------------
  // GET BY VOTER ID
  // ---------------------------------------------------------------------
  it('should get invitations by voter ID', async () => {
    const mockData = [{ id: '1', voterId: 'V001' }];
    service.getByVoterId.mockResolvedValue(mockData);

    const result = await controller.getByVoterId('V001');

    expect(result.data).toEqual(mockData);
    expect(service.getByVoterId).toHaveBeenCalledWith('V001');
  });

  // ---------------------------------------------------------------------
  // CREATE INVITATION
  // ---------------------------------------------------------------------
  it('should create a voter invitation', async () => {
    const mockData = { id: '1', email: 'abc@gmail.com' };
    const body = {
      electionId: 'EC1',
      voterId: 'V1',
      email: 'abc@gmail.com',
    };

    const mockReq = { user: { sub: 'adminUserId' } };

    service.create.mockResolvedValue(mockData);

    const result = await controller.create(body as any, mockReq as any);

    expect(result.data).toEqual(mockData);
    expect(result.status).toBe(HttpStatus.CREATED);

    expect(service.create).toHaveBeenCalledWith(body, 'adminUserId');
  });

  // ---------------------------------------------------------------------
  // CONFIRM INVITATION
  // ---------------------------------------------------------------------
  it('should confirm invitation', async () => {
    const mockData = { success: true };
    service.confirmationVoterInvitation.mockResolvedValue(mockData);

    const result = await controller.invited('randomToken');

    expect(result.data).toEqual(mockData);
    expect(result.status).toBe(HttpStatus.OK);
    expect(service.confirmationVoterInvitation).toHaveBeenCalledWith('randomToken');
  });

});
