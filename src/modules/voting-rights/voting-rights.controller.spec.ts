import { Test, TestingModule } from '@nestjs/testing';
import { VotingRightsController } from './voting-rights.controller';
import { VotingRightsService } from './voting-rights.service';

describe('VotingRightsController', () => {
  let controller: VotingRightsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotingRightsController],
      providers: [VotingRightsService],
    }).compile();

    controller = module.get<VotingRightsController>(VotingRightsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
