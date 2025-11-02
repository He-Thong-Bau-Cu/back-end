import { Module } from '@nestjs/common';
import { VoterInvitationsService } from './voter-invitations.service';
import { VoterInvitationsController } from './voter-invitations.controller';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { VoterInvitations, VoterInvitationsSchema } from 'src/database/schemas/voterInvitations.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Voters, VotersSchema } from 'src/database/schemas/voters.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name:VoterInvitations.name, schema:VoterInvitationsSchema},
      {name:Voters.name, schema:VotersSchema},
      {name:Elections.name, schema:ElectionsSchema},
    ]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory:(configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn:'24h',
        },
      }),
    }),
  ],
  controllers: [VoterInvitationsController],
  providers: [VoterInvitationsService],
})
export class VoterInvitationsModule {}
