import { Test, TestingModule } from '@nestjs/testing';
import { CaController } from './ca.controller';

describe('CaController', () => {
  let controller: CaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CaController],
    }).compile();

    controller = module.get<CaController>(CaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
