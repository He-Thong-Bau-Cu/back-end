import { Test, TestingModule } from '@nestjs/testing';
import { ElectionEntitiesController } from './election-entities.controller';
import { ElectionEntitiesService } from './election-entities.service';

describe('ElectionEntitiesController', () => {
  let controller: ElectionEntitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectionEntitiesController],
      providers: [ElectionEntitiesService],
    }).compile();

    controller = module.get<ElectionEntitiesController>(ElectionEntitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
