import { Test, TestingModule } from '@nestjs/testing';
import { MeetingAttendeesController } from './meeting-attendees.controller';
import { MeetingAttendeesService } from './meeting-attendees.service';

describe('MeetingAttendeesController', () => {
  let controller: MeetingAttendeesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeetingAttendeesController],
      providers: [MeetingAttendeesService],
    }).compile();

    controller = module.get<MeetingAttendeesController>(MeetingAttendeesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
