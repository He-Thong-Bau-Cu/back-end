import { PartialType } from '@nestjs/swagger';
import { CreateElectionDto } from './create-elections-dto';


export class UpdateElectionDto extends PartialType(CreateElectionDto) { }
