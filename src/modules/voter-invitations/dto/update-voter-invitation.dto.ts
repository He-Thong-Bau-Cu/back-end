import { PartialType } from '@nestjs/swagger';
import { CreateVoterInvitationDto } from './create-voter-invitation.dto';

export class UpdateVoterInvitationDto extends PartialType(CreateVoterInvitationDto) {}
