import { Module } from '@nestjs/common';
import { DelegateCardsService } from './delegate-cards.service';
import { DelegateCardsController } from './delegate-cards.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { DelegateCard, DelegateCardSchema } from 'src/database/schemas/delegateCard.schema';
import { Delegations, DelegationsSchema } from 'src/database/schemas/delegations.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { Voters, VotersSchema } from 'src/database/schemas/voters.schema';
import { VotingRights, VotingRightsSchema } from 'src/database/schemas/votingRights.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DelegateCard.name, schema: DelegateCardSchema },
      { name: Delegations.name, schema: DelegationsSchema },
      { name: Elections.name, schema: ElectionsSchema },
      { name: Voters.name, schema: VotersSchema },
      { name: VotingRights.name, schema: VotingRightsSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '24h',
        },
      }),
    }),
    AuthModule,
    MailModule,
    MinioModule

  ],
  controllers: [DelegateCardsController],
  providers: [DelegateCardsService],
  exports: [DelegateCardsService],
})
export class DelegateCardsModule { }
