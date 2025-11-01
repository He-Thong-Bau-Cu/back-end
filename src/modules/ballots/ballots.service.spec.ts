import { Test, TestingModule } from '@nestjs/testing';
import { BallotsService } from './ballots.service';

describe('BallotsService', () => {
  let service: BallotsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BallotsService],
    }).compile();

    service = module.get<BallotsService>(BallotsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
