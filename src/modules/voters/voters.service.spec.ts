import { Test, TestingModule } from '@nestjs/testing';
import { VotersService } from './voters.service';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { STATUS } from 'src/common/enums/status.enum';

const oid = () => new Types.ObjectId().toString();

const mockModel = () => ({
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findByIdAndUpdate: jest.fn().mockReturnThis(),
  exists: jest.fn(),
  countDocuments: jest.fn(),
  create: jest.fn(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  collation: jest.fn().mockReturnThis(),
  exec: jest.fn(),
});

describe('VotersService', () => {
  let service: VotersService;

  const voterModel = mockModel();
  const electionModel = mockModel();
  const userModel = mockModel();
  const votingRightsModel = mockModel();
  const electionParticipantsModel = mockModel();
  const rolesModel = mockModel();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotersService,
        { provide: getModelToken('Voters'), useValue: voterModel },
        { provide: getModelToken('Elections'), useValue: electionModel },
        { provide: getModelToken('Users'), useValue: userModel },
        { provide: getModelToken('VotingRights'), useValue: votingRightsModel },
        { provide: getModelToken('ElectionsParticipants'), useValue: electionParticipantsModel },
        { provide: getModelToken('Roles'), useValue: rolesModel },
      ],
    }).compile();

    service = module.get<VotersService>(VotersService);

    jest.clearAllMocks();
  });

  // =========================
  // CREATE
  // =========================
  it('should create voter successfully', async () => {
    const electionId = oid();
    const userId = oid();
  
    electionModel.findById.mockReturnValue({
      exec: () => Promise.resolve({ _id: electionId, status: STATUS.ACTIVE }),
    });
  
    userModel.findById.mockReturnValue({
      exec: () => Promise.resolve({ _id: userId, status: STATUS.ACTIVE }),
    });
  
    voterModel.findOne.mockResolvedValueOnce(null);
    electionParticipantsModel.findOne.mockResolvedValueOnce(null);
  
    electionParticipantsModel.create.mockResolvedValue({});
    voterModel.create.mockResolvedValue({
      _id: oid(),
      electionId,
      userId,
    });
  
    const result = await service.create({ electionId, userId } as any, oid());
  
    expect(result._id).toBeDefined();
    expect(voterModel.create).toHaveBeenCalled();
  });  
  

  // =========================
  // UPDATE
  // =========================
  it('should update voter', async () => {
    const id = oid();

    voterModel.exists.mockResolvedValue(true);

    const updated = { _id: id, fullName: 'Updated' };

    voterModel.findByIdAndUpdate.mockReturnValue({
      exec: () => Promise.resolve(updated),
    });

    const result = await service.update(id, updated as any, oid());

    expect(result).toEqual(updated);
  });

  // =========================
  // UPDATE STATUS
  // =========================
  it('should update status', async () => {
    const id = oid();

    const expected = { _id: id, status: STATUS.ACTIVE };

    voterModel.exists.mockResolvedValue(true);

    voterModel.findByIdAndUpdate.mockReturnValue({
      exec: () => Promise.resolve(expected),
    });

    const result = await service.updateStatus(id, STATUS.ACTIVE, oid());

    expect(result).toEqual(expected);
  });

  // =========================
  // DELETE
  // =========================
  it('should delete voter', async () => {
    const id = oid();

    const voter = {
      status: STATUS.ACTIVE,
      save: jest.fn().mockResolvedValue({ status: STATUS.INACTIVE }),
    };

    voterModel.findById.mockReturnValue({ exec: () => Promise.resolve(voter) });

    const result = await service.delete(id);

    expect(result.status).toBe(STATUS.INACTIVE);
  });

  // =========================
  // GET BY ID
  // =========================
  it('should return voter', async () => {
    const id = oid();

    voterModel.exists.mockReturnValue({
      exec: () => Promise.resolve(true),
    });

    const voter = { _id: id };

    voterModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve(voter),
    });

    const result = await service.getById(id);

    expect(result).toEqual(voter);
  });

  // =========================
  // ELIGIBLE VOTERS
  // =========================
  it('should return eligible voters', async () => {
    const electionId = oid();

    electionModel.findOne.mockReturnValue({
      exec: () => Promise.resolve({ _id: electionId, status: STATUS.ACTIVE }),
    });

    voterModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve([{ _id: oid() }]),
    });

    const result = await service.getEligibleVoters(electionId);

    expect(result.length).toBe(1);
  });

  // =========================
  // BY ELECTION ID
  // =========================
  it('should return voters for election', async () => {
    const electionId = oid();

    electionModel.findOne.mockReturnValue({
      exec: () => Promise.resolve({ _id: electionId }),
    });

    voterModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: () => Promise.resolve([{ _id: oid() }]),
    });

    const result = await service.getByElectionId(electionId);

    expect(result.length).toBe(1);
  });

  // =========================
  // DASHBOARD
  // =========================
  it('should return dashboard data', async () => {
    const electionId = oid();
    const voterRoleId = oid();

    electionModel.findById.mockReturnValue({
      exec: () => Promise.resolve({ _id: electionId }),
    });

    rolesModel.findOne.mockResolvedValue({ _id: voterRoleId });

    electionParticipantsModel.countDocuments
      .mockResolvedValueOnce(10) // total voters
      .mockResolvedValueOnce(20); // total participants

    voterModel.countDocuments.mockResolvedValue(5);

    const result = await service.getVoterDashboard(electionId);

    expect(result.totalVoters).toBe(10);
    expect(result.totalParticipants).toBe(20);
    expect(result.participationPercentage).toBe(50);
  });
});
