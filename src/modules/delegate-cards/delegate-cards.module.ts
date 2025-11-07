import { Module } from '@nestjs/common';
import { DelegateCardsService } from './delegate-cards.service';
import { DelegateCardsController } from './delegate-cards.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DelegateCard, DelegateCardSchema } from 'src/database/schemas/delegateCard.schema';
import { Delegations, DelegationsSchema } from 'src/database/schemas/delegations.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { Voters, VotersSchema } from 'src/database/schemas/voters.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DelegateCard.name, schema: DelegateCardSchema },
      { name: Delegations.name, schema: DelegationsSchema },
      { name: Elections.name, schema: ElectionsSchema },
      { name: Voters.name, schema: VotersSchema },
    ])
  ],
  controllers: [DelegateCardsController],
  providers: [DelegateCardsService],
})
export class DelegateCardsModule { }
