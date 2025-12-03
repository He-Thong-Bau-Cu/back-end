import { Test, TestingModule } from '@nestjs/testing';
import { DelegationsService } from './delegations.service';
import { getModelToken } from '@nestjs/mongoose';

import { Delegations } from 'src/database/schemas/delegations.schema';
import { Elections } from 'src/database/schemas/elections.schema';
import { Users } from 'src/database/schemas/users.schema';
import { ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import { Voters } from 'src/database/schemas/voters.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { Roles } from 'src/database/schemas/roles.schema';
import { VotingRights } from 'src/database/schemas/votingRights.schema';
import { MeetingAttendees } from 'src/database/schemas/meetingAttendees.schema';
import { Meetings } from 'src/database/schemas/meetings.schema';
import { DelegateCard } from 'src/database/schemas/delegateCard.schema';

import { SigningService } from '../signature/signature.service';
import { MinioService } from '../minio/minio.service';
import { UsersService } from '../users/users.service';
import { NotificationService } from '../notification/notification.service';
import { DelegateCardsService } from '../delegate-cards/delegate-cards.service';

import { DELEGATION_TYPE, STATUS } from 'src/common/enums/status.enum';

import { Types } from 'mongoose';

describe('DelegationsService', () => {
  let service: DelegationsService;

  // Dùng ObjectId hợp lệ cho mọi test
  const VALID_ELECTION_ID = '507f1f77bcf86cd799439011';
  const VALID_DELEGATION_ID = '507f1f77bcf86cd799439012';
  const VALID_DELEGATION_ID_2 = '507f1f77bcf86cd799439013';
  const VALID_USER_ID = '507f1f77bcf86cd799439099';
  const VALID_DOC_ID = '507f1f77bcf86cd7994390aa';

  // =============== MOCK MODEL ===============
  const mockDelegationModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
    exists: jest.fn(),
  };

  const mockElectionModel: any = {
    exists: jest.fn(),
    findById: jest.fn(),
  };

  const mockUserModel: any = {
    exists: jest.fn(),
    findById: jest.fn(),
  };

  const mockDocumentModel: any = {
    exists: jest.fn(),
    findById: jest.fn(),
  };

  const mockVotersModel: any = {};
  const mockElectionParticipantsModel: any = {};
  const mockRoleModel: any = {};
  const mockVotingRightsModel: any = {};
  const mockMeetingAttendeesModel: any = {};
  const mockMeetingsModel: any = {};
  const mockDelegateCardModel: any = {};

  // =============== MOCK SERVICES ===============
  const mockSigningService = {};
  const mockMinioService = {};
  const mockUsersService = {};
  const mockNotificationService = {
    notifyUser: jest.fn(),
  };
  const mockDelegateCardsService = {
    create: jest.fn(),
    getByVoterId: jest.fn(),
  };

  const mockConnection = {
    startSession: jest.fn(),
  };

  // =============== HELPER: populate/lean/exec chain ===============
  const mockQueryChain = (returnValue: any) => {
    const exec = jest.fn().mockResolvedValue(returnValue);
    const chain: any = {
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      exec,
    };
    return chain;
  };

  // ======================================================
  // BOOTSTRAP TEST MODULE
  // ======================================================
  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DelegationsService,

        // --- MODELS ---
        { provide: getModelToken(Delegations.name), useValue: mockDelegationModel },
        { provide: getModelToken(Elections.name), useValue: mockElectionModel },
        { provide: getModelToken(Users.name), useValue: mockUserModel },
        { provide: getModelToken(ElectionDocuments.name), useValue: mockDocumentModel },
        { provide: getModelToken(Voters.name), useValue: mockVotersModel },
        { provide: getModelToken(ElectionsParticipants.name), useValue: mockElectionParticipantsModel },
        { provide: getModelToken(Roles.name), useValue: mockRoleModel },
        { provide: getModelToken(VotingRights.name), useValue: mockVotingRightsModel },
        { provide: getModelToken(MeetingAttendees.name), useValue: mockMeetingAttendeesModel },
        { provide: getModelToken(Meetings.name), useValue: mockMeetingsModel },
        { provide: getModelToken(DelegateCard.name), useValue: mockDelegateCardModel },

        // --- SERVICES ---
        { provide: SigningService, useValue: mockSigningService },
        { provide: MinioService, useValue: mockMinioService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: DelegateCardsService, useValue: mockDelegateCardsService },
        { provide: 'DatabaseConnection', useValue: mockConnection },
      ],
    }).compile();

    service = module.get<DelegationsService>(DelegationsService);
  });

  // ======================================================
  // TEST: getByElectionId
  // ======================================================
  describe('getByElectionId', () => {
    it('should return delegation list', async () => {
      const data = [{ _id: VALID_DELEGATION_ID, electionId: VALID_ELECTION_ID }];

      mockElectionModel.exists.mockResolvedValue(true);
      mockDelegationModel.find.mockReturnValue(mockQueryChain(data));

      const result = await service.getByElectionId(VALID_ELECTION_ID);

      expect(mockElectionModel.exists).toHaveBeenCalled();
      expect(mockDelegationModel.find).toHaveBeenCalled();
      expect(result).toEqual(data);
    });

    it('should throw when election does not exist', async () => {
      mockElectionModel.exists.mockResolvedValue(false);

      await expect(service.getByElectionId(VALID_ELECTION_ID)).rejects.toThrow(
        'Không tìm thấy cuộc bầu cử',
      );
    });
  });

  // ======================================================
  // TEST: getById
  // ======================================================
  describe('getById', () => {
    it('should return delegation', async () => {
      const data = { _id: VALID_DELEGATION_ID };

      mockDelegationModel.exists.mockResolvedValue(true);
      mockDelegationModel.findById.mockReturnValue(mockQueryChain(data));

      const result = await service.getById(VALID_DELEGATION_ID);

      expect(mockDelegationModel.exists).toHaveBeenCalled();
      expect(mockDelegationModel.findById).toHaveBeenCalled();
      expect(result).toEqual(data);
    });

    it('should throw when not found', async () => {
      mockDelegationModel.exists.mockResolvedValue(false);

      await expect(service.getById(VALID_DELEGATION_ID)).rejects.toThrow(
        'Không tìm thấy ủy quyền',
      );
    });
  });

  // ======================================================
  // TEST: getDelegationsPending
  // ======================================================
  describe('getDelegationsPending', () => {
    it('should return pending delegation', async () => {
      const delegation = {
        _id: VALID_DELEGATION_ID,
        status: STATUS.PENDING,
        documentId: new Types.ObjectId(VALID_DOC_ID),
      };

      const doc = {
        _id: VALID_DOC_ID,
        title: 'Doc title',
        file_url: 'file.pdf',
        status: STATUS.ACTIVE,
      };

      mockDelegationModel.findOne.mockReturnValue(mockQueryChain(delegation));
      mockDocumentModel.findById.mockReturnValue(mockQueryChain(doc));

      const result: any = await service.getDelegationsPending();

      expect(mockDelegationModel.findOne).toHaveBeenCalledWith({ status: STATUS.PENDING });
      expect(result).toBeDefined();
      expect(result.documentId).toEqual(doc);
    });

    it('should throw on DB error', async () => {
      mockDelegationModel.findOne.mockImplementation(() => {
        throw new Error('DB Error');
      });

      await expect(service.getDelegationsPending()).rejects.toThrow('DB Error');
    });
  });

  // ======================================================
  // TEST: create
  // ======================================================
  describe('create', () => {
    const userId = VALID_USER_ID;

    it('should create delegation successfully', async () => {
      const dto: any = {
        delegationType: DELEGATION_TYPE.LONG_TERM,
        electionId: VALID_ELECTION_ID,
        delegatorId: VALID_USER_ID,
        delegateInfo: {
          fullName: 'Delegate Name',
          email: 'delegate@example.com',
          citizenId: '123456789',
          phone: '0123456789',
          address: 'HN',
        },
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-02'),
      };

      // validateElection: delegationType LONG_TERM -> không check election
      // validateDelegateInfo: ok (delegateInfo đầy đủ)
      // validateCitizenId: citizenId không tồn tại -> false
      // validatePhone: phone không tồn tại -> false
      // validateEmail: email không tồn tại -> false
      // validateDelegator: delegator tồn tại -> true
      mockUserModel.exists
        .mockResolvedValueOnce(false) // validateCitizenId
        .mockResolvedValueOnce(false) // validatePhone
        .mockResolvedValueOnce(false) // validateEmail
        .mockResolvedValueOnce(true); // validateDelegator
      mockDelegationModel.findOne.mockResolvedValue(null); // không bị ủy quyền trùng

      const created = { _id: VALID_DELEGATION_ID, ...dto };
      mockDelegationModel.create.mockResolvedValue(created);

      const result = await service.create(dto, userId);

      expect(mockDelegationModel.create).toHaveBeenCalled();
      expect(result).toEqual(created);
    });

    it('should throw when election not found (delegationType = ELECTION)', async () => {
      const dto: any = {
        delegationType: DELEGATION_TYPE.ELECTION,
        electionId: VALID_ELECTION_ID,
        delegatorId: VALID_USER_ID,
        delegateInfo: {
          fullName: 'Delegate Name',
          email: 'delegate@example.com',
          citizenId: '123456789',
          phone: '0123456789',
          address: 'HN',
        },
      };

      mockElectionModel.findById.mockResolvedValue(null);

      await expect(service.create(dto, userId)).rejects.toThrow('Không tìm thấy cuộc bầu cử');
    });
  });

  // ======================================================
  // TEST: update
  // ======================================================
  describe('update', () => {
    const userId = VALID_USER_ID;

    it('should update delegation successfully', async () => {
      const updated = { _id: VALID_DELEGATION_ID, status: STATUS.CONFIRMED };

      mockDelegationModel.exists.mockResolvedValue(true);
      const execMock = jest.fn().mockResolvedValue(updated);
      mockDelegationModel.findByIdAndUpdate.mockReturnValue({ exec: execMock });

      const result = await service.update(
        VALID_DELEGATION_ID,
        { status: STATUS.CONFIRMED } as any,
        userId,
      );

      expect(mockDelegationModel.exists).toHaveBeenCalledWith({ _id: VALID_DELEGATION_ID });
      expect(mockDelegationModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(result).toEqual(updated);
    });

    it('should throw when delegation not found', async () => {
      mockDelegationModel.exists.mockResolvedValue(false);

      await expect(
        service.update(VALID_DELEGATION_ID_2, {} as any, userId),
      ).rejects.toThrow('Không tìm thấy ủy quyền');
    });

    it('should throw when DB fails', async () => {
      mockDelegationModel.exists.mockResolvedValue(true);
      mockDelegationModel.findByIdAndUpdate.mockImplementation(() => {
        throw new Error('Update failed');
      });

      await expect(
        service.update(VALID_DELEGATION_ID_2, {} as any, userId),
      ).rejects.toThrow('Update failed');
    });
  });
});
