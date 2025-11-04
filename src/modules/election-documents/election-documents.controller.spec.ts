import { Test, TestingModule } from '@nestjs/testing';
import { ElectionDocumentsController } from './election-documents.controller';
import { ElectionDocumentsService } from './election-documents.service';

describe('ElectionDocumentsController', () => {
  let controller: ElectionDocumentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ElectionDocumentsController],
      providers: [ElectionDocumentsService],
    }).compile();

    controller = module.get<ElectionDocumentsController>(ElectionDocumentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
