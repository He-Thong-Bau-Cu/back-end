import { PartialType } from '@nestjs/swagger';
import { CreateVotingMethodDto } from './create-voting-method.dto';

export class UpdateVotingMethodDto extends PartialType(CreateVotingMethodDto) {}
