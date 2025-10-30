import { Test, TestingModule } from '@nestjs/testing';
import { VotingRightsService } from './voting-rights.service';

describe('VotingRightsService', () => {
  let service: VotingRightsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VotingRightsService],
    }).compile();

    service = module.get<VotingRightsService>(VotingRightsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
