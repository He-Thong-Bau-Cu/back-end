import { PartialType } from '@nestjs/swagger';
import { CreateBallotDto } from './create-ballot.dto';

export class UpdateBallotDto extends PartialType(CreateBallotDto) {}
