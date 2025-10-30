import { Test, TestingModule } from '@nestjs/testing';
import { ElectionTypesService } from './election-types.service';

describe('ElectionTypesService', () => {
  let service: ElectionTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ElectionTypesService],
    }).compile();

    service = module.get<ElectionTypesService>(ElectionTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
