import { Test, TestingModule } from '@nestjs/testing';
import { DelegationsService } from './delegations.service';

describe('DelegationsService', () => {
  let service: DelegationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DelegationsService],
    }).compile();

    service = module.get<DelegationsService>(DelegationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
