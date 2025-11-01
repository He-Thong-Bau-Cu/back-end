import { Test, TestingModule } from '@nestjs/testing';
import { DelegateCardsService } from './delegate-cards.service';

describe('DelegateCardsService', () => {
  let service: DelegateCardsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DelegateCardsService],
    }).compile();

    service = module.get<DelegateCardsService>(DelegateCardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
