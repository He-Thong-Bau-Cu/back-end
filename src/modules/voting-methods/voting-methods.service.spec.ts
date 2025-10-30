import { Test, TestingModule } from '@nestjs/testing';
import { VotingMethodsService } from './voting-methods.service';

describe('VotingMethodsService', () => {
  let service: VotingMethodsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VotingMethodsService],
    }).compile();

    service = module.get<VotingMethodsService>(VotingMethodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
