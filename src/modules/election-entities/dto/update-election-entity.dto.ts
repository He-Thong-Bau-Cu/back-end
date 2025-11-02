import { PartialType } from '@nestjs/swagger';
import { CreateElectionEntityDto } from './create-election-entity.dto';

export class UpdateElectionEntityDto extends PartialType(CreateElectionEntityDto) {}
