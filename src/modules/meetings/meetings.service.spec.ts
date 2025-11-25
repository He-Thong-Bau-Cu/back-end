import { Test, TestingModule } from '@nestjs/testing';
import { MeetingsService } from './meetings.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';

describe('MeetingsService', () => {
  let service: MeetingsService;
  let meetingsModel: jest.Mocked<Model<any>>;
  let electionsModel: jest.Mocked<Model<any>>;

  const mockModel = () => ({
    exists: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingsService,
        { provide: getModelToken('Meetings'), useValue: mockModel() },
        { provide: getModelToken('Elections'), useValue: mockModel() },
      ],
    }).compile();

    service = module.get<MeetingsService>(MeetingsService);
    meetingsModel = module.get(getModelToken('Meetings'));
    electionsModel = module.get(getModelToken('Elections'));
  });

  afterEach(() => jest.clearAllMocks());

  const dto: CreateMeetingDto = {
    electionId: 'e001',
    name: 'Cuộc họp HĐQT',
    date: new Date(),
  } as any;

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw if election not found', async () => {
    electionsModel.exists.mockResolvedValue(null as any);

    await expect(service.create(dto)).rejects.toThrow('Election not found');
    expect(electionsModel.exists).toHaveBeenCalledWith({ _id: dto.electionId });
  });

  it('should create meeting successfully', async () => {
    electionsModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });
    meetingsModel.create.mockResolvedValue({ id: 'm001', ...dto } as any);

    const result = await service.create(dto);

    expect(result).toEqual({ id: 'm001', ...dto });
    expect(meetingsModel.create).toHaveBeenCalledWith(dto);
  });

  it('should update meeting successfully', async () => {
    const id = '64b1d2e7b4b9c5a9f3a5d9b0';
    const updateDto: UpdateMeetingDto = { name: 'Cuộc họp cập nhật' } as any;

    meetingsModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });
    meetingsModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id, ...updateDto }),
    } as any);

    const result = await service.update(id, updateDto);

    expect(result).toEqual({ id, ...updateDto });
    expect(meetingsModel.findByIdAndUpdate).toHaveBeenCalledWith(
      new Types.ObjectId(id),
      updateDto,
      { new: true },
    );
  });

  it('should throw if meeting not found on update', async () => {
    meetingsModel.exists.mockResolvedValue(null as any);
    await expect(
      service.update('fake-id', {} as any),
    ).rejects.toThrow('Meeting not found');
  });
});
