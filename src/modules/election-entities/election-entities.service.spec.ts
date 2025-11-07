import { Test, TestingModule } from '@nestjs/testing';
import { ElectionEntitiesService } from './election-entities.service';
import { getModelToken } from '@nestjs/mongoose';
import { ElectionEntities } from 'src/database/schemas/electionEntities.schema';
import { Elections } from 'src/database/schemas/elections.schema';
import { ElectionTypes } from 'src/database/schemas/electionTypes.schema';
import { ElectionsParticipants} from 'src/database/schemas/electionParticipants.schema';


describe('ElectionEntitiesService', () => {
  let service: ElectionEntitiesService;

  const mockModel = () => ({
    exists: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  });  

  const mockElectionModel = mockModel();
  const mockElectionTypesModel = mockModel();
  const mockElectionParticipantsModel = mockModel();
  const mockElectionEntitiesModel = mockModel();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElectionEntitiesService,
        { provide: getModelToken(ElectionEntities.name), useValue: mockElectionEntitiesModel },
        { provide: getModelToken(Elections.name), useValue: mockElectionModel },
        { provide: getModelToken(ElectionTypes.name), useValue: mockElectionTypesModel },
        { provide: getModelToken(ElectionsParticipants.name), useValue: mockElectionParticipantsModel },
      ],
    }).compile();

    service = module.get<ElectionEntitiesService>(ElectionEntitiesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      electionId: 'e1',
      electionTypeId: 't1',
      electionEntityId: 'ee1',
    };

    it('should throw if election not found', async () => {
      mockElectionModel.exists.mockResolvedValue(null);

      await expect(service.create(dto as any)).rejects.toThrow('Election not found');
    });

    it('should throw if election type not found', async () => {
      mockElectionModel.exists.mockResolvedValue(true);
      mockElectionTypesModel.exists.mockResolvedValue(null);

      await expect(service.create(dto as any)).rejects.toThrow('Election Type not found');
    });

    it('should throw if no participants linked', async () => {
      mockElectionModel.exists.mockResolvedValue(true);
      mockElectionTypesModel.exists.mockResolvedValue(true);
      mockElectionParticipantsModel.exists.mockResolvedValue(false);
    
      await expect(service.create(dto as any)).rejects.toThrow('No participants linked to this election');
    });
    

    it('should create entity successfully', async () => {
      mockElectionModel.exists.mockResolvedValue(true);
      mockElectionTypesModel.exists.mockResolvedValue(true);
      mockElectionParticipantsModel.exists.mockResolvedValue(true); // ✅ phải là true
    
      const mockEntity = { _id: 'entity1', name: 'Hội đồng A' };
      mockElectionEntitiesModel.create.mockResolvedValue(mockEntity);
    
      const result = await service.create(dto as any);
    
      expect(result).toEqual(mockEntity);
      expect(mockElectionEntitiesModel.create).toHaveBeenCalledWith(dto);
    });    
  });

  describe('update', () => {
    it('should update entity successfully', async () => {
      const id = '64b6f2b1c9f2f1a2b3c4d5e6'; // ✅ hợp lệ
      const dto = { name: 'Updated Name' };
      const updated = { _id: id, ...dto };
    
      mockElectionEntitiesModel.exec.mockResolvedValue(updated);
    
      const result = await service.update(id, dto as any);
      expect(result).toEqual(updated);
    });    
  });
});
