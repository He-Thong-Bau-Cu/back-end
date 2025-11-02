import { Test, TestingModule } from '@nestjs/testing';
import { ThresholdsService } from './thresholds.service';

describe('ThresholdsService', () => {
  let service: ThresholdsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThresholdsService],
    }).compile();

    service = module.get<ThresholdsService>(ThresholdsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
