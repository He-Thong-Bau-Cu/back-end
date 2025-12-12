import { Module } from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { ElectionsController } from './elections.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Elections,
  ElectionsSchema,
} from 'src/database/schemas/elections.schema';
import {
  ElectionDocuments,
  ElectionDocumentSchema,
} from 'src/database/schemas/electionDocuments.schema';
import { ElectionTypes, ElectionTypesSchema } from 'src/database/schemas/electionTypes.schema';
import { VotingMethods, VotingMethodsSchema } from 'src/database/schemas/votingMethods.schema';
import { Thresholds, ThresholdsSchema } from 'src/database/schemas/thresholds.schema';
import { Users, UsersSchema } from 'src/database/schemas/users.schema';
import { ElectionsParticipants, ElectionsParticipantsSchema } from 'src/database/schemas/electionParticipants.schema';
import { Roles, RolesSchema } from 'src/database/schemas/roles.schema';
import { Voters, VotersSchema } from 'src/database/schemas/voters.schema';
import { Delegations, DelegationsSchema } from 'src/database/schemas/delegations.schema';
import { ElectionEntities, ElectionEntitiesSchema } from 'src/database/schemas/electionEntities.schema';
import { Meetings, MeetingsSchema } from 'src/database/schemas/meetings.schema';
import { VotingRights, VotingRightsSchema } from 'src/database/schemas/votingRights.schema';
import { MeetingAttendees, MeetingAttendeesSchema } from 'src/database/schemas/meetingAttendees.schema';
import { SystemConfig, SystemConfigSchema } from 'src/database/schemas/systemConfig.schema';
import { Ballots, BallotsSchema } from 'src/database/schemas/ballots.schema';
import { DelegateCard, DelegateCardSchema } from 'src/database/schemas/delegateCard.schema';
import { SignatureModule } from '../signature/signature.module';
import { MinioModule } from '../minio/minio.module';
import { NotificationModule } from '../notification/notification.module';
import { MailModule } from '../mail/mail.module';
import { ResultsModule } from '../results/results.module';
import { VotersModule } from '../voters/voters.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Elections.name, schema: ElectionsSchema },
      { name: ElectionDocuments.name, schema: ElectionDocumentSchema },
      { name: ElectionTypes.name, schema: ElectionTypesSchema },
      { name: VotingMethods.name, schema: VotingMethodsSchema },
      { name: Thresholds.name, schema: ThresholdsSchema },
      { name: Users.name, schema: UsersSchema },
      { name: ElectionsParticipants.name, schema: ElectionsParticipantsSchema },
      { name: Roles.name, schema: RolesSchema },
      { name: Voters.name, schema: VotersSchema },
      { name: Delegations.name, schema: DelegationsSchema },
      { name: ElectionEntities.name, schema: ElectionEntitiesSchema },
      { name: Meetings.name, schema: MeetingsSchema },
      { name: VotingRights.name, schema: VotingRightsSchema },
      { name: MeetingAttendees.name, schema: MeetingAttendeesSchema },
      { name: SystemConfig.name, schema: SystemConfigSchema },
      { name: Ballots.name, schema: BallotsSchema },
      { name: DelegateCard.name, schema: DelegateCardSchema },
    ]),
    SignatureModule,
    MinioModule,
    NotificationModule,
    MailModule,
    ResultsModule,
    VotersModule,
    UsersModule,
  ],
  providers: [ElectionsService],
  controllers: [ElectionsController],
})
export class ElectionsModule { }
