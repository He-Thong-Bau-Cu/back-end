import { PartialType } from '@nestjs/swagger';
import { CreateElectionDocumentDto } from './create-election-document.dto';

export class UpdateElectionDocumentDto extends PartialType(CreateElectionDocumentDto) {}
