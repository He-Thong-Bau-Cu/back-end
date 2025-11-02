import { Test, TestingModule } from '@nestjs/testing';
import { ElectionParticipantsController } from './election-participants.controller';
import { ElectionParticipantsService } from './election-participants.service';

describe('ElectionParticipantsController', () => {
  let controller: ElectionParticipantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectionParticipantsController],
      providers: [ElectionParticipantsService],
    }).compile();

    controller = module.get<ElectionParticipantsController>(ElectionParticipantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
