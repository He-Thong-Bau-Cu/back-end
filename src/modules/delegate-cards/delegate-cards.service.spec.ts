// Mock các module native trước khi import
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt'),
}));

jest.mock('pdfmake', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    createPdfKitDocument: jest.fn().mockReturnValue({
      pipe: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    }),
  })),
}));

jest.mock('fs', () => ({
  createWriteStream: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  promises: {
    readFile: jest.fn().mockResolvedValue(''),
    writeFile: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
    stat: jest.fn().mockResolvedValue({ isFile: () => true }),
  },
}));

jest.mock('os', () => ({
  tmpdir: jest.fn().mockReturnValue('C:/tmp'),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/')),
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { DelegateCardsService } from './delegate-cards.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { MailService } from '../mail/mail.service';
import { MinioService } from '../minio/minio.service';
import { STATUS } from 'src/common/enums/status.enum';
import * as path from 'path';
import * as fs from 'fs';

describe('DelegateCardsService', () => {
  let service: DelegateCardsService;

  const mockDelegateCardModel = {
    create: jest.fn(),
    findById: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    exists: jest.fn(),
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockDelegationModel = {
    findOne: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockElectionModel = {
    findById: jest.fn().mockReturnThis(),
    exists: jest.fn(),
    exec: jest.fn(),
  };

  const mockVoterModel = {
    findOne: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    }),
    exec: jest.fn(),
  };

  const mockVotingRightModel = {
    findOne: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('TOKEN_ABC'),
  };

  const mockAuth = {
    generateQRCode: jest.fn().mockResolvedValue({ qrCode: 'QR_BASE64' }),
  };

  const mockMinio = {
    getProfileImageUrl: jest.fn().mockResolvedValue('AVATAR_BASE64'),
  };

  const mockMail = {
    sendMailDelegateCard: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DelegateCardsService,
        { provide: getModelToken('DelegateCard'), useValue: mockDelegateCardModel },
        { provide: getModelToken('Delegations'), useValue: mockDelegationModel },
        { provide: getModelToken('Elections'), useValue: mockElectionModel },
        { provide: getModelToken('Voters'), useValue: mockVoterModel },
        { provide: getModelToken('VotingRights'), useValue: mockVotingRightModel },
        { provide: JwtService, useValue: mockJwt },
        { provide: AuthService, useValue: mockAuth },
        { provide: MinioService, useValue: mockMinio },
        { provide: MailService, useValue: mockMail },
      ],
    }).compile();

    service = module.get<DelegateCardsService>(DelegateCardsService);

    jest.clearAllMocks();
  });

  // ======================================================================
  it('should create delegate card successfully', async () => {
    const { Types } = require('mongoose');
    const validUserId = new Types.ObjectId().toString();
    const validElectionId = new Types.ObjectId().toString();
    const validVoterId = new Types.ObjectId().toString();

    // Mock fs.createWriteStream for PDF generation
    (fs.createWriteStream as any).mockReturnValue({
      on: jest.fn().mockImplementation((event, cb) => {
        if (event === 'finish') cb();
      }),
    });

    mockElectionModel.findById().exec.mockResolvedValue({ title: 'Test Election' });

    const mockPopulate = jest.fn().mockReturnThis();
    const mockExec = jest.fn().mockResolvedValue({
      userId: { fullName: 'A', citizenId: 'B', email: 'E', address: 'H', image: 'img.jpg', _id: validUserId },
    });
    mockVoterModel.findById.mockReturnValue({
      populate: mockPopulate,
      exec: mockExec,
    });

    mockVotingRightModel.findOne().exec.mockResolvedValue({ shares: 10 });

    mockDelegateCardModel.exists.mockResolvedValue(false);
    mockDelegateCardModel.create.mockResolvedValue({
      _id: 'DC123',
      token: 'TOKEN_ABC',
    });

    const result = await service.create(
      { electionId: validElectionId, voterId: validVoterId } as any,
      validUserId
    );

    expect(result._id).toBe('DC123');
  });

  // ======================================================================
  it('should get delegate card by token', async () => {
    const mockPopulate = jest.fn().mockReturnThis();
    const mockExec = jest.fn().mockResolvedValue({ _id: 'DC555', token: 'xyz' });
  
    mockDelegateCardModel.findOne.mockReturnValue({
      populate: mockPopulate,
      exec: mockExec,
    });
  
    const result = await service.getByToken('xyz');
  
    expect(mockDelegateCardModel.findOne).toHaveBeenCalledWith({ token: 'xyz' });
    expect(result._id).toBe('DC555');
  });
  

  // ======================================================================
  it('should auto-create delegate card for eligible user', async () => {
    const { Types } = require('mongoose');
    const validElectionId = new Types.ObjectId().toString();
    const validUserId = new Types.ObjectId().toString();
    const validVoterId = new Types.ObjectId().toString();

    // Mock fs.createWriteStream for PDF generation
    (fs.createWriteStream as any).mockReturnValue({
      on: jest.fn().mockImplementation((event, cb) => {
        if (event === 'finish') cb();
      }),
    });

    // Mock for autoCreateDelegateCardForUser
    mockElectionModel.findById().exec.mockResolvedValue({ 
      _id: validElectionId,
      delegationEndDate: new Date(Date.now() + 86400000), // tomorrow
    });

    mockVoterModel.findOne().exec.mockResolvedValue({
      _id: validVoterId,
      eligible: true,
      userId: validUserId,
    });

    mockDelegateCardModel.findOne().exec.mockResolvedValue(null);
    mockDelegationModel.findOne().exec.mockResolvedValue(null);

    // Mock for create() method that will be called
    const mockPopulate = jest.fn().mockReturnThis();
    const mockExec = jest.fn().mockResolvedValue({
      userId: { 
        fullName: 'Test User', 
        citizenId: '123456789', 
        email: 'test@example.com', 
        address: 'Test Address', 
        image: 'test.jpg', 
        _id: validUserId 
      },
    });
    mockVoterModel.findById.mockReturnValue({
      populate: mockPopulate,
      exec: mockExec,
    });

    mockVotingRightModel.findOne().exec.mockResolvedValue({ shares: 10 });
    mockDelegateCardModel.exists.mockResolvedValue(false);
    mockDelegateCardModel.create.mockResolvedValue({ 
      _id: 'AUTO1',
      token: 'TOKEN_ABC',
    });

    const res = await service.autoCreateDelegateCardForUser(validUserId, validElectionId);

    expect(res.created).toBe(true);
    expect(res.delegateCard._id).toBe('AUTO1');
  });

  // ======================================================================
  it('should generate PDF path', async () => {
    const fakeTmp = "C:/tmp";
    (fs.createWriteStream as any).mockReturnValue({
      on: jest.fn().mockImplementation((event, cb) => {
        if (event === 'finish') cb();
      }),
    });

    (path.join as any).mockReturnValue(fakeTmp + "/delegate-card-test.pdf");

    const result = await service.generateDelegateCardPDF(
      'A', 'B', '01-01-2024', 'HN', 1, 'DC1', 'AV', 'QR'
    );

    expect(result).toContain('delegate-card');
  });
});
