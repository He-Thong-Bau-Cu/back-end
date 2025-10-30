import { PartialType } from '@nestjs/swagger';
import { CreateElectionTypeDto } from './create-election-type.dto';

export class UpdateElectionTypeDto extends PartialType(CreateElectionTypeDto) {}
