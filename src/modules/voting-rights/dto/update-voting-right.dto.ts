import { PartialType } from '@nestjs/swagger';
import { CreateVotingRightDto } from './create-voting-right.dto';

export class UpdateVotingRightDto extends PartialType(CreateVotingRightDto) {}
