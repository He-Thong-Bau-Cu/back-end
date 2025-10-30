import { Test, TestingModule } from '@nestjs/testing';
import { VotingMethodsController } from './voting-methods.controller';
import { VotingMethodsService } from './voting-methods.service';

describe('VotingMethodsController', () => {
  let controller: VotingMethodsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotingMethodsController],
      providers: [VotingMethodsService],
    }).compile();

    controller = module.get<VotingMethodsController>(VotingMethodsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
