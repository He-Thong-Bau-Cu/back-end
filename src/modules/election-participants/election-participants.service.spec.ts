import { Test, TestingModule } from '@nestjs/testing';
import { ElectionParticipantsService } from './election-participants.service';

describe('ElectionParticipantsService', () => {
  let service: ElectionParticipantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ElectionParticipantsService],
    }).compile();

    service = module.get<ElectionParticipantsService>(ElectionParticipantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
