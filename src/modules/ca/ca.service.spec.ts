import { Test, TestingModule } from '@nestjs/testing';
import { CaService } from './ca.service';

describe('CaService', () => {
  let service: CaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CaService],
    }).compile();

    service = module.get<CaService>(CaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
