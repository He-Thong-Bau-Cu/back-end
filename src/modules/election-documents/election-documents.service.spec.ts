import { Test, TestingModule } from '@nestjs/testing';
import { ElectionDocumentsService } from './election-documents.service';
import { getModelToken } from '@nestjs/mongoose';
import { ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import { Elections } from 'src/database/schemas/elections.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

// Helper to create valid ObjectId strings
const oid = () => new Types.ObjectId().toString();

jest.mock('src/common/dto/paignation', () => ({
  paginate: jest.fn().mockImplementation((data) => ({
    items: data,
    total: data.length,
    page: 1,
    limit: 10
  })),
}));

describe('ElectionDocumentsService', () => {
  let service: ElectionDocumentsService;

  let documentModel: any;
  let electionsModel: any;
  let participantsModel: any;

  beforeEach(async () => {
    documentModel = {
      exists: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    electionsModel = {
      exists: jest.fn(),
    };

    participantsModel = {
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionDocumentsService,
        {
          provide: getModelToken(ElectionDocuments.name),
          useValue: documentModel,
        },
        {
          provide: getModelToken(Elections.name),
          useValue: electionsModel,
        },
        {
          provide: getModelToken(ElectionsParticipants.name),
          useValue: participantsModel,
        },
      ],
    }).compile();

    service = module.get<ElectionDocumentsService>(ElectionDocumentsService);
    jest.clearAllMocks();
  });

  // =========================================================================
  // CREATE
  // =========================================================================
  describe('create', () => {
    it('should throw error if election does not exist', async () => {
      const electionId = oid();
      const preparedById = oid();
      const userId = oid();
      electionsModel.exists.mockResolvedValue(false);

      await expect(
        service.create(
          { electionId: electionId, preparedBy: preparedById } as any,
          userId
        )
      ).rejects.toThrow(MESSAGE.ELECTION_NOT_FOUND);
    });

    it('should throw error if preparedBy not found', async () => {
      const electionId = oid();
      const preparedById = oid();
      const userId = oid();
      electionsModel.exists.mockResolvedValue(true);
      participantsModel.exists.mockResolvedValue(false);

      await expect(
        service.create(
          { electionId: electionId, preparedBy: preparedById } as any,
          userId
        )
      ).rejects.toThrow(MESSAGE.ELECTION_PARTICIPANT_NOT_FOUND);
    });

    it('should create and return document', async () => {
      const electionId = oid();
      const preparedById = oid();
      const userId = oid();
      const documentId = oid();
      electionsModel.exists.mockResolvedValue(true);
      participantsModel.exists.mockResolvedValue(true);

      const mockCreated = { id: documentId };
      documentModel.create.mockResolvedValue(mockCreated);

      const result = await service.create(
        { electionId: electionId, preparedBy: preparedById } as any,
        userId
      );

      expect(result).toEqual(mockCreated);
      expect(documentModel.create).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // GET BY ID
  // =========================================================================
  describe('getById', () => {
    it('should throw if not exists', async () => {
      const documentId = oid();
      documentModel.exists.mockResolvedValue(false);

      await expect(service.getById(documentId)).rejects.toThrow(
        MESSAGE.ELECTION_DOCUMENT_NOT_FOUND
      );
    });

    it('should return populated document', async () => {
      const documentId = oid();
      documentModel.exists.mockResolvedValue(true);

      const mockDoc = { id: documentId, title: 'A' };

      documentModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDoc),
      });

      const result = await service.getById(documentId);

      expect(result).toEqual(mockDoc);
    });
  });

  // =========================================================================
  // GET BY ELECTION ID
  // =========================================================================
  describe('getByElectionId', () => {
    it('should throw if election does not exist', async () => {
      const electionId = oid();
      electionsModel.exists.mockResolvedValue(false);

      await expect(service.getByElectionId(electionId)).rejects.toThrow(
        MESSAGE.ELECTION_NOT_FOUND
      );
    });

    it('should return list of docs', async () => {
      const electionId = oid();
      const documentId = oid();
      electionsModel.exists.mockResolvedValue(true);

      const mockDocs = [{ id: documentId }];

      documentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDocs),
      });

      const result = await service.getByElectionId(electionId);

      expect(result).toEqual(mockDocs);
    });
  });

  // =========================================================================
  // UPDATE
  // =========================================================================
  describe('update', () => {
    it('should throw if document does not exist', async () => {
      const documentId = oid();
      const userId = oid();
      documentModel.exists.mockResolvedValue(false);

      await expect(
        service.update(documentId, {} as any, userId)
      ).rejects.toThrow(MESSAGE.ELECTION_DOCUMENT_NOT_FOUND);
    });

    it('should update and return document', async () => {
      const documentId = oid();
      const userId = oid();
      documentModel.exists.mockResolvedValue(true);

      const mockUpdated = { id: documentId, title: 'Updated' };

      documentModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUpdated),
      });

      const result = await service.update(documentId, { title: 'Updated' } as any, userId);

      expect(result).toEqual(mockUpdated);
    });
  });

  // =========================================================================
  // GET BY CREATED BY
  // =========================================================================
  describe('getByCreatedBy', () => {
    it('should return paginated result', async () => {
      const userId = oid();
      const documentId = oid();
      const mockDocs = [{ id: documentId }];

      documentModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockDocs),
      });

      const result = await service.getByCreatedBy(userId);

      expect((result as any).items.length).toBe(1);
      expect((result as any).total).toBe(1);
    });
  });
});
