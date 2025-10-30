import { Test, TestingModule } from '@nestjs/testing';
import { ElectionTypesController } from './election-types.controller';
import { ElectionTypesService } from './election-types.service';

describe('ElectionTypesController', () => {
  let controller: ElectionTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectionTypesController],
      providers: [ElectionTypesService],
    }).compile();

    controller = module.get<ElectionTypesController>(ElectionTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
