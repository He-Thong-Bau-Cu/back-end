import { Test, TestingModule } from '@nestjs/testing';
import { BallotsController } from './ballots.controller';
import { BallotsService } from './ballots.service';

describe('BallotsController', () => {
  let controller: BallotsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BallotsController],
      providers: [BallotsService],
    }).compile();

    controller = module.get<BallotsController>(BallotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
