import { Module } from '@nestjs/common';
import { VoterInvitationsService } from './voter-invitations.service';
import { VoterInvitationsController } from './voter-invitations.controller';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { VoterInvitations, VoterInvitationsSchema } from 'src/database/schemas/voterInvitations.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{name:VoterInvitations.name, schema:VoterInvitationsSchema}]),

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
