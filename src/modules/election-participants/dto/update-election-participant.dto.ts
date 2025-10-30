import { PartialType } from '@nestjs/swagger';
import { CreateElectionParticipantDto } from './create-election-participant.dto';

export class UpdateElectionParticipantDto extends PartialType(CreateElectionParticipantDto) {}
