import { Test, TestingModule } from '@nestjs/testing';
import { MeetingAttendeesService } from './meeting-attendees.service';

describe('MeetingAttendeesService', () => {
  let service: MeetingAttendeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MeetingAttendeesService],
    }).compile();

    service = module.get<MeetingAttendeesService>(MeetingAttendeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
