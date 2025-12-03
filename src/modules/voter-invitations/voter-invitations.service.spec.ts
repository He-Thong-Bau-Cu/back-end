import { Test, TestingModule } from '@nestjs/testing';
import { VoterInvitationsService } from './voter-invitations.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { Types } from 'mongoose';
import { STATUS } from 'src/common/enums/status.enum';
import { MESSAGE } from 'src/common/enums/message.enum';

// Tạo ObjectId hợp lệ
const oid = () => new Types.ObjectId().toString();

describe('VoterInvitationsService', () => {
  let service: VoterInvitationsService;

  const mockVoterInvitationsModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
  };

  const mockVotersModel = {
    findById: jest.fn(),
    exists: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockElectionsModel = {
    exists: jest.fn(),
  };

  const mockUsersModel = {
    findByIdAndUpdate: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
    decode: jest.fn(),
  };

  const mockMailService = {
    sendMailInvitation: jest.fn(),
  };

  const mockUsersService = {
    getById: jest.fn(),
    generateRandomPassword: jest.fn().mockReturnValue('Abc12345'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoterInvitationsService,
        { provide: getModelToken('VoterInvitations'), useValue: mockVoterInvitationsModel },
        { provide: getModelToken('Voters'), useValue: mockVotersModel },
        { provide: getModelToken('Elections'), useValue: mockElectionsModel },
        { provide: getModelToken('Users'), useValue: mockUsersModel },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<VoterInvitationsService>(VoterInvitationsService);

    jest.clearAllMocks();
  });

  // --------------------------------------------------------
  // TEST create()
  // --------------------------------------------------------
  it('should create voter invitation successfully', async () => {
    const voterId = oid();
    const electionId = oid();
    const createdBy = oid();
    const userId = oid();

    mockVotersModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({
        _id: voterId,
        electionId,
        userId: {
          _id: userId,
          email: 'test@gmail.com',
          fullName: 'Test User',
          username: 'testuser',
        },
      }),
    });

    mockElectionsModel.exists.mockResolvedValue(true);

    mockUsersModel.findByIdAndUpdate.mockResolvedValue(true);

    mockMailService.sendMailInvitation.mockResolvedValue(true);

    mockVotersModel.findByIdAndUpdate.mockResolvedValue(true);

    mockVoterInvitationsModel.create.mockResolvedValue({
      id: oid(),
      voterId,
      electionId,
    });

    const result = await service.create(
      {
        voterId,
        electionId,
        status: STATUS.INVITED, // hoặc PENDING tùy DTO
      },
      createdBy
    );
    

    expect(result.voterId.toString()).toBe(voterId);
    expect(mockMailService.sendMailInvitation).toHaveBeenCalled();
  });

  // --------------------------------------------------------
  // TEST confirm()
  // --------------------------------------------------------
  it('should confirm invitation successfully', async () => {
    const voterId = oid();
    const electionId = oid();
    const userId = oid();

    mockJwtService.decode.mockReturnValue({ voterId, electionId });

    mockVoterInvitationsModel.findOne.mockResolvedValue({ id: oid() });

    mockVotersModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ userId }),
    });

    mockUsersService.getById.mockResolvedValue({ id: userId });

    const result = await service.confirmationVoterInvitation('token');

    expect(result.valid).toBe(true);
    expect((result as any).user.id).toBe(userId);
  });

  it('should return invalid when invitation not found', async () => {
    mockJwtService.decode.mockReturnValue({ voterId: oid(), electionId: oid() });
    mockVoterInvitationsModel.findOne.mockResolvedValue(null);

    const result = await service.confirmationVoterInvitation('token');

    expect(result.valid).toBe(false);
  });

  // --------------------------------------------------------
  // GET BY ELECTION ID
  // --------------------------------------------------------
  it('should get invitations by election id', async () => {
    const electionId = oid();

    mockElectionsModel.exists.mockResolvedValue(true);
    mockVoterInvitationsModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([{ id: oid(), electionId }]),
    });

    const result = await service.getByElectionId(electionId);

    expect(result.length).toBe(1);
  });

  // --------------------------------------------------------
  // GET BY VOTER ID
  // --------------------------------------------------------
  it('should get invitations by voter id', async () => {
    const voterId = oid();

    mockVotersModel.exists.mockResolvedValue(true);
    mockVoterInvitationsModel.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([{ id: oid(), voterId }]),
    });

    const result = await service.getByVoterId(voterId);

    expect(result.length).toBe(1);
  });

  // --------------------------------------------------------
  // GET BY ID
  // --------------------------------------------------------
  it('should get invitation by id', async () => {
    const id = oid();

    mockVoterInvitationsModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ id }),
    });

    const result = await service.getById(id);

    expect(result.id).toBe(id);
  });
});
