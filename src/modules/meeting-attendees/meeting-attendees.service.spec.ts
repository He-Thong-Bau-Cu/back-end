import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { MeetingAttendeesService } from './meeting-attendees.service';
import { MeetingAttendees } from 'src/database/schemas/meetingAttendees.schema';
import { Meetings } from 'src/database/schemas/meetings.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { Elections } from 'src/database/schemas/elections.schema';
import { Ballots } from 'src/database/schemas/ballots.schema';
import { Voters } from 'src/database/schemas/voters.schema';
import { NotificationGateway } from '../notification/notification.gateway';
import { paginate } from 'src/common/dto/paignation';
import { MESSAGE } from 'src/common/enums/message.enum';

// Mock paginate
jest.mock('src/common/dto/paignation', () => ({
  paginate: (data: any) => ({ data })
}));

// Helper
const oid = () => new Types.ObjectId().toHexString();

// Populate chain mock
const mockPopulateChain = (result: any) => {
  const chain: any = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result)
  };
  return chain;
};

// Model mock
const createModel = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOneAndUpdate: jest.fn(),
  exists: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn()
});

// Gateway mock
const mockGateway = {
  dataToElectionId: jest.fn()
};

describe('MeetingAttendeesService', () => {
  let service: MeetingAttendeesService;
  let mockMeetingAttendeesModel: any;
  let mockMeetingsModel: any;
  let mockParticipantsModel: any;
  let mockElectionsModel: any;
  let mockBallotsModel: any;
  let mockVotersModel: any;

  beforeEach(async () => {
    mockMeetingAttendeesModel = createModel();
    mockMeetingsModel = createModel();
    mockParticipantsModel = createModel();
    mockElectionsModel = createModel();
    mockBallotsModel = createModel();
    mockVotersModel = createModel();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingAttendeesService,
        { provide: getModelToken(MeetingAttendees.name), useValue: mockMeetingAttendeesModel },
        { provide: getModelToken(Meetings.name), useValue: mockMeetingsModel },
        { provide: getModelToken(ElectionsParticipants.name), useValue: mockParticipantsModel },
        { provide: getModelToken(Elections.name), useValue: mockElectionsModel },
        { provide: getModelToken(Ballots.name), useValue: mockBallotsModel },
        { provide: getModelToken(Voters.name), useValue: mockVotersModel },
        { provide: NotificationGateway, useValue: mockGateway }
      ]
    }).compile();

    service = module.get<MeetingAttendeesService>(MeetingAttendeesService);
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------
  it('should return all meeting attendees', async () => {
    const data = [{ _id: oid() }];

    mockMeetingAttendeesModel.find.mockReturnValue(mockPopulateChain(data));

    const res = await service.findAll();

    expect((res as any).data).toEqual(data);
  });

  // -------------------------------------------------------------
  it('should return one attendee', async () => {
    const expected = { _id: oid() };

    mockMeetingAttendeesModel.findById.mockReturnValue(
      mockPopulateChain(expected)
    );

    const res = await service.findOne(oid());

    expect(res).toEqual(expected);
  });

  // -------------------------------------------------------------
  it('should create attendee successfully', async () => {
    const meetingId = oid();
    const participantId = oid();
    const userId = oid();

    mockMeetingsModel.exists.mockResolvedValue(true);
    mockParticipantsModel.exists.mockResolvedValue(true);

    const created = { _id: oid() };

    mockMeetingAttendeesModel.create.mockResolvedValue(created);
    mockMeetingAttendeesModel.findById.mockReturnValue(
      mockPopulateChain(created)
    );

    // FIX: Add lean()
    mockMeetingsModel.findById.mockReturnValue({
      lean: () => ({ electionId: new Types.ObjectId() })
    });

    mockMeetingAttendeesModel.countDocuments
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(4); // attended

    const res = await service.create(
      {
        meetingId,
        participantId
      } as any,
      userId
    );

    expect(res._id).toBe(created._id);
    expect(mockGateway.dataToElectionId).toHaveBeenCalled();
  });

  // -------------------------------------------------------------
  it('should throw meeting not found on create', async () => {
    mockMeetingsModel.exists.mockResolvedValue(false);

    await expect(
      service.create({ meetingId: 'x', participantId: 'y' } as any, 'u')
    ).rejects.toThrow(MESSAGE.MEETING_NOT_FOUND);
  });

  // -------------------------------------------------------------
  it('should update attendance status', async () => {
    const meetingId = oid();
    const participantId = oid();
    const userId = oid();

    mockMeetingsModel.exists.mockResolvedValue(true);
    mockParticipantsModel.exists.mockResolvedValue(true);

    const updated = { _id: oid(), attended: true };

    mockMeetingAttendeesModel.findOneAndUpdate.mockReturnValue(
      mockPopulateChain(updated)
    );

    // FIX: Add lean()
    mockMeetingsModel.findById.mockReturnValue({
      lean: () => ({ electionId: new Types.ObjectId() })
    });

    mockMeetingAttendeesModel.countDocuments
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2);

    const res = await service.updateStatusAttendance(
      meetingId,
      participantId,
      true,
      userId
    );

    expect(res.attended).toBe(true);
    expect(mockGateway.dataToElectionId).toHaveBeenCalled();
  });

  // -------------------------------------------------------------
  it('should throw meeting not found on updateStatusAttendance', async () => {
    mockMeetingsModel.exists.mockResolvedValue(false);

    await expect(
      service.updateStatusAttendance('m1', 'p1', true, 'user')
    ).rejects.toThrow(MESSAGE.MEETING_NOT_FOUND);
  });

  // -------------------------------------------------------------
  it('should throw attendee not found on updateStatusAttendance', async () => {
    mockMeetingsModel.exists.mockResolvedValue(true);
    mockParticipantsModel.exists.mockResolvedValue(true);
    mockMeetingAttendeesModel.findOneAndUpdate.mockReturnValue(
      mockPopulateChain(null)
    );

    await expect(
      service.updateStatusAttendance(oid(), oid(), true, oid())
    ).rejects.toThrow(MESSAGE.MEETING_ATTENDEE_NOT_FOUND);
  });

  // -------------------------------------------------------------
  it('should update meeting attendee', async () => {
    const id = oid();
    const updated = { _id: id, ok: true };

    mockMeetingAttendeesModel.exists.mockResolvedValue(true);
    mockMeetingAttendeesModel.findByIdAndUpdate.mockReturnValue(
      mockPopulateChain(updated)
    );

    const res = await service.update(id, {} as any, oid());

    expect(res._id).toBe(id);
  });

  // -------------------------------------------------------------
  it('should throw attendee not found on update()', async () => {
    mockMeetingAttendeesModel.exists.mockResolvedValue(false);

    await expect(
      service.update(oid(), {} as any, oid())
    ).rejects.toThrow(MESSAGE.MEETING_ATTENDEE_NOT_FOUND);
  });

  // -------------------------------------------------------------
  it('should return attendees by meetingId', async () => {
    mockMeetingsModel.exists.mockResolvedValue(true);

    mockMeetingAttendeesModel.find.mockReturnValue(
      mockPopulateChain([{ _id: oid() }])
    );

    const res = await service.getByMeetingId(oid());
    expect(res.length).toBe(1);
  });

  // -------------------------------------------------------------
  it('should return attendees by participantId', async () => {
    mockParticipantsModel.exists.mockResolvedValue(true);

    mockMeetingAttendeesModel.find.mockReturnValue(
      mockPopulateChain([{ _id: oid() }])
    );

    const res = await service.getByParticipantId(oid());
    expect(res.length).toBe(1);
  });

  // -------------------------------------------------------------
  it('should return not attended participants', async () => {
    const electionId = oid();

    mockElectionsModel.exists.mockResolvedValue(true);

    mockMeetingsModel.findOne.mockResolvedValue({
      _id: oid()
    });

    mockMeetingAttendeesModel.find.mockReturnValue(
      mockPopulateChain([{ _id: oid() }])
    );

    const res = await service.getParticipantsNotAttended(electionId);

    expect((res as any).data.length).toBe(1);
  });

  // -------------------------------------------------------------
  it('should return attended participants', async () => {
    const electionId = oid();

    mockElectionsModel.exists.mockResolvedValue(true);
    mockMeetingsModel.findOne.mockResolvedValue({ _id: oid() });

    mockMeetingAttendeesModel.find.mockReturnValue(
      mockPopulateChain([{ _id: oid() }])
    );

    const res = await service.getParticipantsAttended(electionId);

    expect((res as any).data.length).toBe(1);
  });
});
