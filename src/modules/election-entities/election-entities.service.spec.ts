import { Test, TestingModule } from '@nestjs/testing';
import { ElectionEntitiesService } from './election-entities.service';

describe('ElectionEntitiesService', () => {
  let service: ElectionEntitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ElectionEntitiesService],
    }).compile();

    service = module.get<ElectionEntitiesService>(ElectionEntitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
