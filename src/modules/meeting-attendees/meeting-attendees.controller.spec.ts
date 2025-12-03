import { Test, TestingModule } from '@nestjs/testing';
import { MeetingAttendeesController } from './meeting-attendees.controller';
import { MeetingAttendeesService } from './meeting-attendees.service';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MESSAGE } from 'src/common/enums/message.enum';

describe('MeetingAttendeesController', () => {
  let controller: MeetingAttendeesController;
  let service: MeetingAttendeesService;

  const mockReq = { user: { sub: 'USER123' } };

  const mockService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    getByMeetingId: jest.fn(),
    getByParticipantId: jest.fn(),
    getParticipantsNotAttended: jest.fn(),
    getParticipantsAttended: jest.fn(),
    create: jest.fn(),
    updateStatusAttendance: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeetingAttendeesController],
      providers: [
        {
          provide: MeetingAttendeesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<MeetingAttendeesController>(
      MeetingAttendeesController,
    );
    service = module.get<MeetingAttendeesService>(MeetingAttendeesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ============================================================
  // 1. getAll
  // ============================================================
  describe('getAll', () => {
    it('should return list successfully', async () => {
      const mockData = [{ id: 1 }];
      mockService.findAll.mockResolvedValue(mockData);

      const result = await controller.getAll();

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.MEETING_ATTENDEE_GET_ALL_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.findAll).toHaveBeenCalled();
    });

    it('should throw HttpException on error', async () => {
      mockService.findAll.mockRejectedValue(new Error('Fail'));

      await expect(controller.getAll()).rejects.toThrow(HttpException);
    });
  });

  // ============================================================
  // 2. getById
  // ============================================================
  describe('getById', () => {
    it('should return attendee by id', async () => {
      const mockData = { id: 'A1' };
      mockService.findOne.mockResolvedValue(mockData);

      const result = await controller.getById('A1');

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.MEETING_ATTENDEE_GET_BY_ID_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.findOne).toHaveBeenCalledWith('A1');
    });

    it('should throw HttpException on error', async () => {
      mockService.findOne.mockRejectedValue(new Error('Fail'));

      await expect(controller.getById('A1')).rejects.toThrow(HttpException);
    });
  });

  // ============================================================
  // 3. getByMeetingId
  // ============================================================
  describe('getByMeetingId', () => {
    it('should return attendees by meeting id', async () => {
      mockService.getByMeetingId.mockResolvedValue([]);

      const result = await controller.getByMeetingId('M1');

      expect(result).toEqual(
        BaseResponse.success(
          [],
          MESSAGE.MEETING_ATTENDEE_GET_BY_MEETING_ID_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.getByMeetingId).toHaveBeenCalledWith('M1');
    });

    it('should throw HttpException on error', async () => {
      mockService.getByMeetingId.mockRejectedValue(new Error('Fail'));

      await expect(controller.getByMeetingId('M1')).rejects.toThrow(
        HttpException,
      );
    });
  });

  // ============================================================
  // 4. getByParticipantId
  // ============================================================
  describe('getByParticipantId', () => {
    it('should return attendees by participant id', async () => {
      mockService.getByParticipantId.mockResolvedValue([]);

      const result = await controller.getByParticipantId('P1');

      expect(result).toEqual(
        BaseResponse.success(
          [],
          MESSAGE.MEETING_ATTENDEE_GET_BY_PARTICIPANT_ID_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.getByParticipantId).toHaveBeenCalledWith('P1');
    });

    it('should throw HttpException on error', async () => {
      mockService.getByParticipantId.mockRejectedValue(new Error('Fail'));

      await expect(
        controller.getByParticipantId('P1'),
      ).rejects.toThrow(HttpException);
    });
  });

  // ============================================================
  // 5. getNotAttendedByElectionId
  // ============================================================
  describe('getNotAttendedByElectionId', () => {
    it('should return not-attended list', async () => {
      mockService.getParticipantsNotAttended.mockResolvedValue([]);

      const result = await controller.getNotAttendedByElectionId('E1');

      expect(result).toEqual(
        BaseResponse.success(
          [],
          MESSAGE.MEETING_ATTENDEE_GET_NOT_ATTENDED_BY_ELECTION_ID_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.getParticipantsNotAttended).toHaveBeenCalledWith('E1');
    });

    it('should throw HttpException on error', async () => {
      mockService.getParticipantsNotAttended.mockRejectedValue(
        new Error('Fail'),
      );

      await expect(
        controller.getNotAttendedByElectionId('E1'),
      ).rejects.toThrow(HttpException);
    });
  });

  // ============================================================
  // 6. getAttendedByElectionId
  // ============================================================
  describe('getAttendedByElectionId', () => {
    it('should return attended list', async () => {
      mockService.getParticipantsAttended.mockResolvedValue([]);

      const result = await controller.getAttendedByElectionId('E1');

      expect(result).toEqual(
        BaseResponse.success(
          [],
          MESSAGE.MEETING_ATTENDEE_GET_ATTENDED_BY_ELECTION_ID_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.getParticipantsAttended).toHaveBeenCalledWith('E1');
    });

    it('should throw HttpException on error', async () => {
      mockService.getParticipantsAttended.mockRejectedValue(
        new Error('Fail'),
      );

      await expect(
        controller.getAttendedByElectionId('E1'),
      ).rejects.toThrow(HttpException);
    });
  });

  // ============================================================
  // 7. create
  // ============================================================
  describe('create', () => {
    it('should create attendee', async () => {
      const dto = { meetingId: 'M1', participantId: 'U1' };
      const mockData = { id: 'A1', ...dto };
      mockService.create.mockResolvedValue(mockData);

      const result = await controller.create(dto as any, mockReq as any);

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.MEETING_ATTENDEE_CREATE_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.create).toHaveBeenCalledWith(dto, 'USER123');
    });

    it('should throw HttpException on error', async () => {
      mockService.create.mockRejectedValue(new Error('Fail'));

      await expect(
        controller.create({} as any, mockReq as any),
      ).rejects.toThrow(HttpException);
    });
  });

  // ============================================================
  // 8. updateStatusAttendance
  // ============================================================
  describe('updateStatusAttendance', () => {
    it('should update status', async () => {
      const mockData = { updated: true };
      mockService.updateStatusAttendance.mockResolvedValue(mockData);

      const result = await controller.updateStatusAttendance(
        'M1',
        'P1',
        true as any,
        mockReq as any,
      );

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.MEETING_ATTENDEE_UPDATE_STATUS_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.updateStatusAttendance).toHaveBeenCalledWith(
        'M1',
        'P1',
        true,
        'USER123',
      );
    });

    it('should throw HttpException on error', async () => {
      mockService.updateStatusAttendance.mockRejectedValue(
        new Error('Fail'),
      );

      await expect(
        controller.updateStatusAttendance('M1', 'P1', true as any, mockReq as any),
      ).rejects.toThrow(HttpException);
    });
  });

  // ============================================================
  // 9. update
  // ============================================================
  describe('update', () => {
    it('should update attendee', async () => {
      const dto = { attended: true };
      const mockData = { id: 'A1', ...dto };
      mockService.update.mockResolvedValue(mockData);

      const result = await controller.update('A1', dto as any, mockReq as any);

      expect(result).toEqual(
        BaseResponse.success(
          mockData,
          MESSAGE.MEETING_ATTENDEE_UPDATE_SUCCESS,
          HttpStatus.OK,
        ),
      );
      expect(service.update).toHaveBeenCalledWith('A1', dto, 'USER123');
    });

    it('should throw HttpException on error', async () => {
      mockService.update.mockRejectedValue(new Error('Fail'));

      await expect(
        controller.update('A1', {} as any, mockReq as any),
      ).rejects.toThrow(HttpException);
    });
  });
});
