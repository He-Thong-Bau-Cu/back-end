import { Test, TestingModule } from '@nestjs/testing';
import { ElectionDocumentsService } from './election-documents.service';

describe('ElectionDocumentsService', () => {
  let service: ElectionDocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ElectionDocumentsService],
    }).compile();

    service = module.get<ElectionDocumentsService>(ElectionDocumentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
