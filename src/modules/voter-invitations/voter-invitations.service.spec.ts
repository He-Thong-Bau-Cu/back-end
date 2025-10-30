import { Test, TestingModule } from '@nestjs/testing';
import { VoterInvitationsService } from './voter-invitations.service';

describe('VoterInvitationsService', () => {
  let service: VoterInvitationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VoterInvitationsService],
    }).compile();

    service = module.get<VoterInvitationsService>(VoterInvitationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
