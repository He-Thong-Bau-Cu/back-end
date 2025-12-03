import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsService } from './statistics.service';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { STATUS } from 'src/common/enums/status.enum';
import { USER_ROLE } from 'src/common/enums/config.enum';

function mockModel() {
  return {
    countDocuments: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    aggregate: jest.fn(),
  };
}

function mockFindChain(data = []) {
  return {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(data),
    exec: jest.fn().mockResolvedValue(data),
  };
}

describe('StatisticsService', () => {
  let service: StatisticsService;

  let electionsModel: any;
  let votersModel: any;
  let participantsModel: any;
  let rolesModel: any;
  let ballotsModel: any;
  let systemLogModel: any;
  let delegationsModel: any;
  let meetingAttendeeModel: any;
  let votingMethodsModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: getModelToken('Elections'), useValue: mockModel() },
        { provide: getModelToken('Voters'), useValue: mockModel() },
        { provide: getModelToken('ElectionsParticipants'), useValue: mockModel() },
        { provide: getModelToken('Roles'), useValue: mockModel() },
        { provide: getModelToken('Ballots'), useValue: mockModel() },
        { provide: getModelToken('SystemLog'), useValue: mockModel() },
        { provide: getModelToken('Delegations'), useValue: mockModel() },
        { provide: getModelToken('MeetingAttendees'), useValue: mockModel() },
        { provide: getModelToken('VotingMethods'), useValue: mockModel() },
        { provide: getModelToken('Meetings'), useValue: mockModel() },
        { provide: getModelToken('AuditLogs'), useValue: mockModel() },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);

    electionsModel = module.get(getModelToken('Elections'));
    votersModel = module.get(getModelToken('Voters'));
    participantsModel = module.get(getModelToken('ElectionsParticipants'));
    rolesModel = module.get(getModelToken('Roles'));
    ballotsModel = module.get(getModelToken('Ballots'));
    systemLogModel = module.get(getModelToken('SystemLog'));
    delegationsModel = module.get(getModelToken('Delegations'));
    meetingAttendeeModel = module.get(getModelToken('MeetingAttendees'));
    votingMethodsModel = module.get(getModelToken('VotingMethods'));
  });

  // ===========================================================================
  // getDashboardPreside
  // ===========================================================================
  it('should return dashboard preside stats', async () => {
    electionsModel.countDocuments
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3);

    votersModel.countDocuments.mockResolvedValue(100);

    systemLogModel.countDocuments.mockResolvedValue(20);

    rolesModel.findOne.mockResolvedValue({ _id: new Types.ObjectId(), roleCode: USER_ROLE.VOTER });

    participantsModel.countDocuments
      .mockResolvedValueOnce(40)
      .mockResolvedValueOnce(80);

    const res = await service.getDashboardPreside();

    expect(res.totalElections).toBe(10);
    expect(res.totalVoters).toBe(100);
    expect(res.pendingApprovals).toBe(3);
    expect(res.totalActivitiesThisMonth).toBe(20);
  });

  // ===========================================================================
  // getRecentParticipation
  // ===========================================================================
  it('should return recent participation', async () => {
    const election = { _id: new Types.ObjectId(), title: 'Election A', endDate: new Date() };

    electionsModel.find.mockReturnValue(mockFindChain([election] as any));

    rolesModel.findOne.mockResolvedValue({ _id: new Types.ObjectId(), roleCode: USER_ROLE.VOTER });

    participantsModel.countDocuments.mockResolvedValue(10);

    participantsModel.find.mockResolvedValue([{ _id: new Types.ObjectId() }]);

    meetingAttendeeModel.findOne.mockResolvedValue({ attended: true });

    const res = await service.getRecentParticipation();
    expect(res.length).toBe(1);
    expect(res[0].totalParticipants).toBe(10);
    expect(res[0].totalVotersAttended).toBe(1);
  });

  // ===========================================================================
  // getBoardOfControlDashboard
  // ===========================================================================
  it('should return board of control dashboard', async () => {
    const electionId = new Types.ObjectId();

    electionsModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        _id: electionId,
        title: 'Election X',
      }),
    });

    votersModel.countDocuments
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(20);

    ballotsModel.countDocuments
      .mockResolvedValueOnce(80)
      .mockResolvedValueOnce(10);

    const res = await service.getBoardOfControlDashboard(electionId.toString());

    expect(res.electionName).toBe('Election X');
    expect(res.totalVotes).toBe(90);
    expect(res.totalValidVotes).toBe(80);
    expect(res.totalInvalidVotes).toBe(10);
  });

  // ===========================================================================
  // getSecretaryDashboard
  // ===========================================================================
  it('should return secretary dashboard stats', async () => {
    const electionId = new Types.ObjectId().toString();
    const userId = new Types.ObjectId().toString();

    votersModel.countDocuments.mockResolvedValue(100);
    delegationsModel.countDocuments.mockResolvedValue(6);
    participantsModel.countDocuments.mockResolvedValue(4);

    const res = await service.getSecretaryDashboard(electionId, userId);

    expect(res.totalVoters).toBe(100);
    expect(res.totalConfirmed).toBe(6);
    expect(res.totalElectionsParticipated).toBe(4);
  });

  // ===========================================================================
  // getCumulativeEntityResults
  // ===========================================================================
  it('should return cumulative entity results', async () => {
    const electionId = new Types.ObjectId();

    electionsModel.findById.mockResolvedValue({
      _id: electionId,
      votingMethodId: 'vm1',
    });

    votingMethodsModel.findById.mockResolvedValue({ methodCode: 'CUMULATIVE' });

    ballotsModel.aggregate.mockResolvedValue([
      { entityId: 'E1', entityTitle: 'Entity1', entityData: {}, totalVotes: 40 },
      { entityId: 'E2', entityTitle: 'Entity2', entityData: {}, totalVotes: 60 },
    ]);

    const res = await service.getCumulativeEntityResults(electionId.toString());

    expect(res.length).toBe(2);
    expect(res[0]).toHaveProperty('percentage');
  });

  // ===========================================================================
  // getYesNoEntityResults
  // ===========================================================================
  it('should return YES/NO/ABSTAIN results', async () => {
    const electionId = new Types.ObjectId();

    electionsModel.findById.mockResolvedValue({
      _id: electionId,
      votingMethodId: 'vm2',
    });

    votingMethodsModel.findById.mockResolvedValue({ methodCode: 'YES_NO_ABSTAIN' });

    ballotsModel.aggregate.mockResolvedValue([
      { _id: 1, total: 10 },
      { _id: 0, total: 5 },
      { _id: -1, total: 2 },
    ]);

    const res = await service.getYesNoEntityResults(electionId.toString());

    expect(res.agree.votes).toBe(10);
    expect(res.disagree.votes).toBe(5);
    expect(res.abstain.votes).toBe(2);
  });
});
