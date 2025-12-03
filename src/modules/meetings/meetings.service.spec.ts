import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { MeetingsService } from './meetings.service';
import { NotificationService } from '../notification/notification.service';
import { MESSAGE } from 'src/common/enums/message.enum';

// Helper to create valid ObjectId strings
const oid = () => new Types.ObjectId().toString();

// ===== MOCK QUERY CHAIN =====
const mockQuery = () => ({
  populate: jest.fn().mockReturnThis(),
  exec: jest.fn(),
});

// ===== MOCK MODEL =====
const mockModel = () => ({
  findById: jest.fn(() => mockQuery()),
  find: jest.fn(() => mockQuery()),
  findOne: jest.fn(() => mockQuery()),
  exists: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(() => mockQuery()),
});

describe('MeetingsService', () => {
  let service: MeetingsService;

  const meetingsModel = mockModel();
  const electionsModel = mockModel();
  const meetingAttendeesModel = mockModel();
  const ballotsModel = mockModel();
  const mockNotificationService = {
    transferDataRealTime: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingsService,
        { provide: getModelToken('Meetings'), useValue: meetingsModel },
        { provide: getModelToken('Elections'), useValue: electionsModel },
        { provide: getModelToken('MeetingAttendees'), useValue: meetingAttendeesModel },
        { provide: getModelToken('Ballots'), useValue: ballotsModel },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<MeetingsService>(MeetingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =======================================================
  // 1. getById
  // =======================================================
  describe('getById', () => {
    it('should return meeting when found', async () => {
      const meetingId = oid();
      const mockRes = { id: meetingId };
      
      const queryMock = mockQuery();
      queryMock.exec.mockResolvedValue(mockRes);
      meetingsModel.findById.mockReturnValue(queryMock);

      const result = await service.getById(meetingId);
      expect(result).toEqual(mockRes);
    });

    it('should throw MEETING_NOT_FOUND', async () => {
      const meetingId = oid();
      
      const queryMock = mockQuery();
      queryMock.exec.mockResolvedValue(null);
      meetingsModel.findById.mockReturnValue(queryMock);

      await expect(service.getById(meetingId)).rejects.toThrow(
        MESSAGE.MEETING_NOT_FOUND,
      );
    });

    it('should rethrow DB errors', async () => {
      const meetingId = oid();
      
      const queryMock = mockQuery();
      queryMock.exec.mockRejectedValue(new Error('DB FAIL'));
      meetingsModel.findById.mockReturnValue(queryMock);

      await expect(service.getById(meetingId)).rejects.toThrow('DB FAIL');
    });
  });

  // =======================================================
  // 2. getByElectionId
  // =======================================================
  describe('getByElectionId', () => {
    it('should throw ELECTION_NOT_FOUND if election not exists', async () => {
      electionsModel.exists.mockResolvedValue(false);

      await expect(service.getByElectionId('E1')).rejects.toThrow(
        MESSAGE.ELECTION_NOT_FOUND,
      );
    });

    it('should return meetings when election exists', async () => {
      const electionId = oid();
      const meetingId = oid();
      const mockMeetings = [{ id: meetingId }];

      electionsModel.exists.mockResolvedValue(true);
      
      const queryMock = mockQuery();
      queryMock.exec.mockResolvedValue(mockMeetings);
      meetingsModel.find.mockReturnValue(queryMock);

      const result = await service.getByElectionId(electionId);

      expect(result).toEqual(mockMeetings);
      expect(meetingsModel.find).toHaveBeenCalled();
    });
  });

  // =======================================================
  // 3. create
  // =======================================================
  describe('create', () => {
    const electionId = oid();
    const userId = oid();
    const dto = {
      title: 'Meeting ABC',
      electionId: electionId,
    };

    it('should throw ELECTION_NOT_FOUND', async () => {
      electionsModel.exists.mockResolvedValue(false);

      await expect(service.create(dto as any, userId)).rejects.toThrow(
        MESSAGE.ELECTION_NOT_FOUND,
      );
    });

    it('should throw MEETING_ALREADY_EXISTS', async () => {
      electionsModel.exists.mockResolvedValue(true);
      meetingsModel.exists.mockResolvedValue(true);

      await expect(service.create(dto as any, userId)).rejects.toThrow(
        MESSAGE.MEETING_ALREADY_EXISTS,
      );
    });

    it('should create meeting successfully', async () => {
      const meetingId = oid();
      electionsModel.exists.mockResolvedValue(true);
      meetingsModel.exists.mockResolvedValue(false);

      const created = { _id: meetingId, ...dto };
      meetingsModel.create.mockResolvedValue(created);

      const result = await service.create(dto as any, userId);

      expect(result).toEqual(created);
      expect(meetingsModel.create).toHaveBeenCalled();
    });
  });

  // =======================================================
  // 4. update
  // =======================================================
  describe('update', () => {
    const meetingId = oid();
    const electionId = oid();
    const userId = oid();
    const dto = { title: 'Updated title', electionId: electionId };

    it('should throw MEETING_NOT_FOUND when not exists', async () => {
      meetingsModel.exists.mockResolvedValue(false);

      await expect(service.update(meetingId, dto as any, userId)).rejects.toThrow(
        MESSAGE.MEETING_NOT_FOUND,
      );
    });

    it('should update successfully', async () => {
      meetingsModel.exists.mockResolvedValue(true);

      const updated = { _id: meetingId, ...dto };
      
      const queryMock = mockQuery();
      queryMock.exec.mockResolvedValue(updated);
      meetingsModel.findByIdAndUpdate.mockReturnValue(queryMock);

      const result = await service.update(meetingId, dto as any, userId);

      expect(result).toEqual(updated);
    });

    it('should throw MEETING_NOT_FOUND after update returns null', async () => {
      meetingsModel.exists.mockResolvedValue(true);
      meetingsModel.findByIdAndUpdate().exec.mockResolvedValue(null);

      await expect(service.update(meetingId, dto as any, userId)).rejects.toThrow(
        MESSAGE.MEETING_NOT_FOUND,
      );
    });
  });

  // =======================================================
  // 5. search
  // =======================================================
  describe('search', () => {
    it('should return merged meetings', async () => {
      const dto: any = { keyword: 'abc' };
      const electionId = oid();
      const meetingId = oid();

      // Mock electionsModel.find().exec() to return array
      const electionsQueryMock = mockQuery();
      electionsQueryMock.exec.mockResolvedValue([{ _id: electionId }]);
      electionsModel.find.mockReturnValue(electionsQueryMock);

      // Mock meetingsModel.find().exec() to return array (called twice in service)
      const meetingsQueryMock1 = mockQuery();
      meetingsQueryMock1.exec.mockResolvedValue([{ _id: meetingId }]);
      const meetingsQueryMock2 = mockQuery();
      meetingsQueryMock2.exec.mockResolvedValue([{ id: meetingId }]);
      
      // First call returns meetings by electionIds, second call returns final result
      meetingsModel.find
        .mockReturnValueOnce(meetingsQueryMock1)
        .mockReturnValueOnce(meetingsQueryMock2);

      const result = await service.search(dto);

      expect(result).toEqual([{ id: meetingId }]);
      expect(electionsModel.find).toHaveBeenCalled();
      expect(meetingsModel.find).toHaveBeenCalled();
    });

    it('should handle search with no results', async () => {
      const dto: any = { keyword: 'xyz' };

      // Mock electionsModel.find().exec() to return empty array
      const electionsQueryMock = mockQuery();
      electionsQueryMock.exec.mockResolvedValue([]);
      electionsModel.find.mockReturnValue(electionsQueryMock);

      // Mock meetingsModel.find().exec() to return empty array (called twice)
      const meetingsQueryMock1 = mockQuery();
      meetingsQueryMock1.exec.mockResolvedValue([]);
      const meetingsQueryMock2 = mockQuery();
      meetingsQueryMock2.exec.mockResolvedValue([]);
      
      meetingsModel.find
        .mockReturnValueOnce(meetingsQueryMock1)
        .mockReturnValueOnce(meetingsQueryMock2);

      const result = await service.search(dto);

      expect(result).toEqual([]);
    });

    it('should throw internal errors', async () => {
      // Mock electionsModel.find().exec() to reject
      const electionsQueryMock = mockQuery();
      electionsQueryMock.exec.mockRejectedValue(new Error('FAIL'));
      electionsModel.find.mockReturnValue(electionsQueryMock);

      await expect(service.search({ keyword: 'x' } as any)).rejects.toThrow(
        'FAIL',
      );
    });
  });
});
