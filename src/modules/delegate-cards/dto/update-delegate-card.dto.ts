import { PartialType } from '@nestjs/swagger';
import { CreateDelegateCardDto } from './create-delegate-card.dto';

export class UpdateDelegateCardDto extends PartialType(CreateDelegateCardDto) {}
