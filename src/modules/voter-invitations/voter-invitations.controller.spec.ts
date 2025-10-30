import { Test, TestingModule } from '@nestjs/testing';
import { VoterInvitationsController } from './voter-invitations.controller';
import { VoterInvitationsService } from './voter-invitations.service';

describe('VoterInvitationsController', () => {
  let controller: VoterInvitationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoterInvitationsController],
      providers: [VoterInvitationsService],
    }).compile();

    controller = module.get<VoterInvitationsController>(VoterInvitationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
