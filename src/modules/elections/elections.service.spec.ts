// ============================================================================
// elections.service.spec.ts  (CORE TEST VERSION - OPTION A)
// ============================================================================

// Mock pdfmake before imports
jest.mock('pdfmake', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    createPdfKitDocument: jest.fn().mockReturnValue({
      on: jest.fn((event, handler) => {
        if (event === 'data') {
          process.nextTick(() => handler(Buffer.from('pdf chunk')));
        }
        if (event === 'end') {
          process.nextTick(() => handler());
        }
      }),
      end: jest.fn(),
    }),
  })),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ElectionsService } from './elections.service';
import { STATUS } from 'src/common/enums/status.enum';
import { MESSAGE } from 'src/common/enums/message.enum';
import { USER_ROLE } from 'src/common/enums/config.enum';

import { Elections } from 'src/database/schemas/elections.schema';
import { ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import { ElectionTypes } from 'src/database/schemas/electionTypes.schema';
import { VotingMethods } from 'src/database/schemas/votingMethods.schema';
import { Thresholds } from 'src/database/schemas/thresholds.schema';
import { Users } from 'src/database/schemas/users.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { Roles } from 'src/database/schemas/roles.schema';
import { Voters } from 'src/database/schemas/voters.schema';
import { Delegations } from 'src/database/schemas/delegations.schema';
import { ElectionEntities } from 'src/database/schemas/electionEntities.schema';
import { Meetings } from 'src/database/schemas/meetings.schema';
import { VotingRights } from 'src/database/schemas/votingRights.schema';
import { MeetingAttendees } from 'src/database/schemas/meetingAttendees.schema';
import { SystemConfig } from 'src/database/schemas/systemConfig.schema';


import { SigningService } from '../signature/signature.service';
import { MinioService } from '../minio/minio.service';
import { NotificationService } from '../notification/notification.service';
import { MailService } from '../mail/mail.service';

jest.mock('src/common/utils/format', () => ({
  __esModule: true,
  default: jest.fn(),
  isValidateTimeline: jest.fn(),
  formatDateDMYVN: jest.fn().mockReturnValue('01/01/2024'),
}));

const createQueryMock = (data: any) => ({
  populate: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(data),
});

const createModelMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  exists: jest.fn(),
  updateOne: jest.fn(),
  updateMany: jest.fn(),
  deleteMany: jest.fn(),
  deleteOne: jest.fn(),
  create: jest.fn(),
});

const oid = () => new Types.ObjectId().toHexString();

// ============================================================================
// START TEST SUITE
// ============================================================================
describe('ElectionsService (CORE)', () => {
  let service: ElectionsService;

  let electionsModel: any;
  let electionDocumentsModel: any;
  let electionTypeModel: any;
  let votingMethodModel: any;
  let thresholdModel: any;
  let userModel: any;
  let electionParticipantsModel: any;
  let rolesModel: any;
  let voterModel: any;
  let delegationModel: any;
  let electionEntitiesModel: any;
  let meetingsModel: any;
  let votingRightsModel: any;
  let meetingAttendeesModel: any;
  let systemConfigModel: any;

  const signatureService = { signPdfWithP12: jest.fn() };
  const fileService = { uploadSignedPdf: jest.fn() };
  const notificationService = { notifyUser: jest.fn() };
  const mailService = { sendElectionApprovalEmail: jest.fn() };

  beforeEach(async () => {
    electionsModel = createModelMock();
    electionDocumentsModel = createModelMock();
    electionTypeModel = createModelMock();
    votingMethodModel = createModelMock();
    thresholdModel = createModelMock();
    userModel = createModelMock();
    electionParticipantsModel = createModelMock();
    rolesModel = createModelMock();
    voterModel = createModelMock();
    delegationModel = createModelMock();
    electionEntitiesModel = createModelMock();
    meetingsModel = createModelMock();
    votingRightsModel = createModelMock();
    meetingAttendeesModel = createModelMock();
    systemConfigModel = createModelMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionsService,
        { provide: getModelToken(Elections.name), useValue: electionsModel },
        { provide: getModelToken(ElectionDocuments.name), useValue: electionDocumentsModel },
        { provide: getModelToken(ElectionTypes.name), useValue: electionTypeModel },
        { provide: getModelToken(VotingMethods.name), useValue: votingMethodModel },
        { provide: getModelToken(Thresholds.name), useValue: thresholdModel },
        { provide: getModelToken(Users.name), useValue: userModel },
        { provide: getModelToken(ElectionsParticipants.name), useValue: electionParticipantsModel },
        { provide: getModelToken(Roles.name), useValue: rolesModel },
        { provide: getModelToken(Voters.name), useValue: voterModel },
        { provide: getModelToken(Delegations.name), useValue: delegationModel },
        { provide: getModelToken(ElectionEntities.name), useValue: electionEntitiesModel },
        { provide: getModelToken(Meetings.name), useValue: meetingsModel },
        { provide: getModelToken(VotingRights.name), useValue: votingRightsModel },
        { provide: getModelToken(MeetingAttendees.name), useValue: meetingAttendeesModel },
        { provide: getModelToken(SystemConfig.name), useValue: systemConfigModel },
        { provide: getModelToken('Ballots'), useValue: createModelMock() },
        { provide: SigningService, useValue: signatureService },
        { provide: MinioService, useValue: fileService },
        { provide: NotificationService, useValue: notificationService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<ElectionsService>(ElectionsService);
  });

  // ============================================================================
  // searchElections
  // ============================================================================
  it('should search elections successfully', async () => {
    electionsModel.find.mockReturnValue(
      createQueryMock([{ _id: oid(), title: 'A' }]),
    );

    const res: any = await service.searchElections({
      textSearch: 'A',
      page: 1,
      limit: 10,
    } as any);

    expect(electionsModel.find).toHaveBeenCalled();
    expect(res.content.length).toBe(1);
  });

  // ============================================================================
  // createElection
  // ============================================================================
  it('should create election successfully', async () => {
    electionTypeModel.exists.mockResolvedValue(true);
    votingMethodModel.exists.mockResolvedValue(true);
    thresholdModel.exists.mockResolvedValue(true);
    electionsModel.find.mockResolvedValue([]);

    electionsModel.create.mockResolvedValue({ _id: oid(), title: 'Test' });

    // Start and end date must be on the same day, and endDate must be at least 20 days after creation
    const now = new Date();
    const start = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000); // 21 days from now
    start.setHours(8, 0, 0, 0);
    const end = new Date(start);
    end.setHours(18, 0, 0, 0);

    const res = await service.createElection({
      title: 'Test',
      typeId: oid(),
      votingMethodId: oid(),
      thresholdId: oid(),
      startDate: start,
      endDate: end,
    } as any, oid());

    expect(res.title).toBe('Test');
  });

  // ============================================================================
  // getElectionById
  // ============================================================================
  it('should get election by id', async () => {
    const validId = oid();
    electionsModel.exists.mockResolvedValue(true);
    electionsModel.findById.mockReturnValue(createQueryMock({ _id: validId, title: 'X' }));

    const res = await service.getElectionById(validId);
    expect((res as any).title).toBe('X');
  });

  // ============================================================================
  // updateElections
  // ============================================================================
  it('should update election successfully', async () => {
    electionTypeModel.exists.mockResolvedValue(true);
    votingMethodModel.exists.mockResolvedValue(true);
    thresholdModel.exists.mockResolvedValue(true);
    electionsModel.find.mockResolvedValue([]);

    electionsModel.findByIdAndUpdate.mockReturnValue(
      createQueryMock({ _id: oid(), title: 'Updated', createdAt: new Date() }),
    );

    // Start and end date must be on the same day, and endDate must be at least 20 days after creation
    const now = new Date();
    const start = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000); // 21 days from now
    start.setHours(8, 0, 0, 0);
    const end = new Date(start);
    end.setHours(18, 0, 0, 0);

    const res = await service.updateElections(
      oid(),
      { title: 'Updated', typeId: oid(), votingMethodId: oid(), thresholdId: oid(),
        startDate: start, endDate: end },
      oid(),
    );

    expect((res as any).title).toBe('Updated');
  });

  // ============================================================================
  // deleteElection
  // ============================================================================
  it('should delete election by marking CLOSED', async () => {
    const fake = {
      _id: oid(),
      status: STATUS.ACTIVE,
      save: jest.fn().mockResolvedValue(true),
    };

    electionsModel.findById.mockReturnValue(createQueryMock(fake));

    await service.deleteElection(fake._id);

    expect(fake.status).toBe(STATUS.CLOSED);
    expect(fake.save).toHaveBeenCalled();
  });

  // ============================================================================
  // rejectElection
  // ============================================================================
  it('should reject election with reason', async () => {
    const fake = {
      _id: oid(),
      statusData: STATUS.WAIT_APPROVAL,
      rejectReason: '',
      updatedBy: oid(),
      save: jest.fn().mockResolvedValue(true),
      title: 'Election A',
    };

    electionsModel.findById.mockReturnValue(createQueryMock(fake));

    const res = await service.rejectElection(fake._id, 'Sai hồ sơ');

    expect(res.rejectReason).toBe('Sai hồ sơ');
    expect(fake.save).toHaveBeenCalled();
  });

  // ============================================================================
  // approveAndSign
  // ============================================================================
  it('should approve and sign election', async () => {
    const electionId = oid();
    
    // Create fresh model mocks for this test
    const testMeetingsModel = createModelMock();
    const meetingQueryMock = createQueryMock(null);
    testMeetingsModel.findOne.mockImplementation(() => meetingQueryMock);
    
    // Create a proper constructor mock for electionDocumentsModel
    const documentId = oid();
    const mockDocumentInstance = {
      save: jest.fn().mockResolvedValue({ _id: documentId }),
    };
    
    // Create model mock with all methods first
    const baseModelMock = createModelMock();
    
    // Create constructor function that will be used when calling 'new'
    const MockDocumentConstructor = function(this: any, data: any) {
      Object.assign(this, data);
      this.save = mockDocumentInstance.save;
      return this;
    } as any;
    
    // Copy all model methods to the constructor
    Object.assign(MockDocumentConstructor, baseModelMock);
    
    // Setup model methods on the constructor
    MockDocumentConstructor.findOne = jest.fn().mockReturnValue(createQueryMock(null));
    MockDocumentConstructor.deleteOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 0 }),
    });
    MockDocumentConstructor.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    
    // Use the constructor as the model
    const testElectionDocumentsModel = MockDocumentConstructor;
    
    // Setup all mocks
    electionsModel.findById.mockReturnValue(
      createQueryMock({
        _id: electionId,
        title: 'E1',
        statusData: STATUS.WAIT_APPROVAL,
      }),
    );

    systemConfigModel.findOne.mockReturnValue(createQueryMock({ configValue: { name: 'AVG' } }));

    // Mock electionParticipantsModel.find with populate chain (called twice in service)
    const participantsQueryMock = {
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    electionParticipantsModel.find.mockReturnValue(participantsQueryMock);
    electionParticipantsModel.findOne.mockReturnValue(createQueryMock(null));
    electionParticipantsModel.updateMany.mockResolvedValue({ modifiedCount: 1 });
    
    // Mock update methods
    electionsModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
    voterModel.updateMany.mockResolvedValue({ modifiedCount: 1 });
    votingRightsModel.updateMany.mockResolvedValue({ modifiedCount: 1 });
    electionEntitiesModel.updateMany.mockResolvedValue({ modifiedCount: 1 });

    signatureService.signPdfWithP12.mockResolvedValue(Buffer.from('signed'));
    fileService.uploadSignedPdf.mockResolvedValue({ key: 'signed.pdf' });
    notificationService.notifyUser.mockResolvedValue(undefined);
    mailService.sendElectionApprovalEmail.mockResolvedValue(undefined);

    // Recreate service with fresh mocks
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionsService,
        { provide: getModelToken(Elections.name), useValue: electionsModel },
        { provide: getModelToken(ElectionDocuments.name), useValue: testElectionDocumentsModel },
        { provide: getModelToken(ElectionTypes.name), useValue: electionTypeModel },
        { provide: getModelToken(VotingMethods.name), useValue: votingMethodModel },
        { provide: getModelToken(Thresholds.name), useValue: thresholdModel },
        { provide: getModelToken(Users.name), useValue: userModel },
        { provide: getModelToken(ElectionsParticipants.name), useValue: electionParticipantsModel },
        { provide: getModelToken(Roles.name), useValue: rolesModel },
        { provide: getModelToken(Voters.name), useValue: voterModel },
        { provide: getModelToken(Delegations.name), useValue: delegationModel },
        { provide: getModelToken(ElectionEntities.name), useValue: electionEntitiesModel },
        { provide: getModelToken(Meetings.name), useValue: testMeetingsModel },
        { provide: getModelToken(VotingRights.name), useValue: votingRightsModel },
        { provide: getModelToken(MeetingAttendees.name), useValue: meetingAttendeesModel },
        { provide: getModelToken(SystemConfig.name), useValue: systemConfigModel },
        { provide: getModelToken('Ballots'), useValue: createModelMock() },
        { provide: SigningService, useValue: signatureService },
        { provide: MinioService, useValue: fileService },
        { provide: NotificationService, useValue: notificationService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    const testService = module.get<ElectionsService>(ElectionsService);

    const uploaded = await testService.approveAndSign(
      { buffer: Buffer.from('p12') } as any,
      electionId,
      '123',
      oid(),
    );

    expect(uploaded.key).toBe('signed.pdf');
  });

  // ============================================================================
  // getElectionOrganizerByTime
  // ============================================================================
  it('should return organizer list', async () => {
    electionsModel.find.mockReturnValue(createQueryMock([{ _id: oid() }]));
    electionParticipantsModel.find.mockReturnValue(createQueryMock([]));

    rolesModel.find.mockReturnValue(createQueryMock([]));
    rolesModel.findOne.mockReturnValue(createQueryMock({ _id: oid(), roleCode: USER_ROLE.VOTER }));

    userModel.find.mockReturnValue(createQueryMock([{ _id: oid() }]));
    voterModel.find.mockReturnValue(createQueryMock([]));
    electionParticipantsModel.find.mockReturnValue(createQueryMock([]));

    const res = await service.getElectionOrganizerByTime(new Date(), new Date());
    expect(res.length).toBe(1);
  });

  // ============================================================================
  // getUserIsVoter
  // ============================================================================
  it('should get users who are voters', async () => {
    rolesModel.findOne.mockResolvedValueOnce({ _id: oid(), roleCode: USER_ROLE.VOTER });
    rolesModel.findOne.mockResolvedValueOnce({ _id: oid(), roleCode: USER_ROLE.USER });

    userModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([{ _id: oid(), fullName: 'A' }]),
    });

    delegationModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });
    
    voterModel.findOne.mockResolvedValue({ userId: oid() });
    electionParticipantsModel.findOne.mockResolvedValue(null);

    const res = await service.getUserIsVoter();
    expect(res.length).toBe(1);
  });

  // ============================================================================
  // getDraftData
  // ============================================================================
  it('should get draft data', async () => {
    electionsModel.exists.mockResolvedValue(true);
    electionsModel.findById.mockReturnValue(createQueryMock({ _id: oid(), title: 'E', createdBy: null }));

    meetingsModel.findOne.mockReturnValue(createQueryMock(null));
    electionEntitiesModel.find.mockReturnValue(createQueryMock([]));
    electionDocumentsModel.find.mockReturnValue(createQueryMock([]));
    voterModel.find.mockReturnValue(createQueryMock([]));
    electionParticipantsModel.find.mockReturnValue(createQueryMock([]));
    votingRightsModel.find.mockReturnValue(createQueryMock([]));

    const res = await service.getDraftData(oid());
    expect(res.election).toBeDefined();
  });
});
