import { Test, TestingModule } from '@nestjs/testing';
import { DelegateCardsController } from './delegate-cards.controller';
import { DelegateCardsService } from './delegate-cards.service';

describe('DelegateCardsController', () => {
  let controller: DelegateCardsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DelegateCardsController],
      providers: [DelegateCardsService],
    }).compile();

    controller = module.get<DelegateCardsController>(DelegateCardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
