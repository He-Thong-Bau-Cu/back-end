import { Test, TestingModule } from '@nestjs/testing';
import { VotersController } from './voters.controller';
import { VotersService } from './voters.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('VotersController', () => {
  let controller: VotersController;
  let service: VotersService;

  const mockVotersService = {
    search: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    getEligibleVoters: jest.fn(),
    delete: jest.fn(),
    getByElectionId: jest.fn(),
    getVoterDashboard: jest.fn(),
    getById: jest.fn(),
  };

  const mockReq = {
    user: {
      sub: 'admin123',
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotersController],
      providers: [
        {
          provide: VotersService,
          useValue: mockVotersService,
        },
      ],
    }).compile();

    controller = module.get<VotersController>(VotersController);
    service = module.get<VotersService>(VotersService);
  });

  // ------------------------------------------------
  // SEARCH
  // ------------------------------------------------
  it('should search voters', async () => {
    const data = [{ id: 'v1' }];
    mockVotersService.search.mockResolvedValue(data);

    const result = await controller.search({ page: 1, limit: 10 } as any);

    expect(result.data).toEqual(data);
    expect(result.message).toBe(MESSAGE.VOTER_SEARCH_SUCCESS);
    expect(service.search).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  // ------------------------------------------------
  // CREATE
  // ------------------------------------------------
  it('should create voter', async () => {
    const body = {
      fullName: "Nguyen Van A",
      electionId: "e001"
    } as any;  // FIX: override DTO validation
  
    const created = { id: "v001", ...body };
  
    mockVotersService.create.mockResolvedValue(created);
  
    const result = await controller.create(body, mockReq);
  
    expect(result.data).toEqual(created);
    expect(result.message).toBe(MESSAGE.VOTER_CREATE_SUCCESS);
    expect(service.create).toHaveBeenCalledWith(body, "admin123");
  });

  // ------------------------------------------------
  // UPDATE
  // ------------------------------------------------
  it('should update voter', async () => {
    const updateDto = { fullName: "Updated Name" } as any;
    const updated = { id: "v001", fullName: "Updated Name" };

    mockVotersService.update.mockResolvedValue(updated);

    const result = await controller.update("v001", updateDto, mockReq);

    expect(service.update).toHaveBeenCalledWith("v001", updateDto, "admin123");
    expect(result.data).toEqual(updated);

  });

  // ------------------------------------------------
  // UPDATE STATUS
  // ------------------------------------------------
  it('should update voter status', async () => {
    const updated = { id: 'v001', status: 'ACTIVE' };
    mockVotersService.updateStatus.mockResolvedValue(updated);

    const result = await controller.updateStatus("v001", "ACTIVE", mockReq);

    expect(service.updateStatus).toHaveBeenCalledWith("v001", "ACTIVE", "admin123");
    expect(result.data).toEqual(updated);
  });

  // ------------------------------------------------
  // GET ELIGIBLE
  // ------------------------------------------------
  it('should get eligible voters', async () => {
    const voters = [{ id: 'v001' }];
    mockVotersService.getEligibleVoters.mockResolvedValue(voters);

    const result = await controller.getEligibleVoters("e001");

    expect(result.data).toEqual(voters);
    expect(service.getEligibleVoters).toHaveBeenCalledWith("e001");
  });

  // ------------------------------------------------
  // DELETE
  // ------------------------------------------------
  it('should delete voter', async () => {
    const deleted = { deleted: true };
    mockVotersService.delete.mockResolvedValue(deleted);

    const result = await controller.delete("v001");

    expect(service.delete).toHaveBeenCalledWith("v001");
    expect(result.data).toEqual(deleted);
  });

  // ------------------------------------------------
  // GET BY ELECTION
  // ------------------------------------------------
  it('should get voters by election id', async () => {
    const voters = [{ id: 'v001' }];
    mockVotersService.getByElectionId.mockResolvedValue(voters);

    const result = await controller.getByElectionId("e001");

    expect(result.data).toEqual(voters);
    expect(service.getByElectionId).toHaveBeenCalledWith("e001");
  });

  // ------------------------------------------------
  // DASHBOARD
  // ------------------------------------------------
  it('should get voter dashboard', async () => {
    const dashboard = { total: 100, active: 90 };
    mockVotersService.getVoterDashboard.mockResolvedValue(dashboard);

    const result = await controller.getVoterDashboard("e001");

    expect(result.data).toEqual(dashboard);
    expect(service.getVoterDashboard).toHaveBeenCalledWith("e001");
  });

  // ------------------------------------------------
  // GET BY ID
  // ------------------------------------------------
  it('should get voter by id', async () => {
    const voter = { id: 'v001' };
    mockVotersService.getById.mockResolvedValue(voter);

    const result = await controller.getById("v001");

    expect(result.data).toEqual(voter);
    expect(service.getById).toHaveBeenCalledWith("v001");
  });
});
