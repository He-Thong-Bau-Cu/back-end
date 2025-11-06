import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { MinioModule } from './modules/minio/minio.module';
import { ElectionsModule } from './modules/elections/elections.module';
import { SmsModule } from './modules/sms/sms.module';
import { SignatureModule } from './modules/signature/signature.module';
import { CaModule } from './modules/ca/ca.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemLog, SystemLogSchema } from './database/schemas/systemLog.schema';

import { Roles } from './database/schemas/roles.schema';

import { AuditLogsMiddleware } from './common/middleware/audit-logs.middleware';
import { AuditLogs, AuditLogsSchema } from './database/schemas/auditLogs.schema';
import { SystemModule } from './modules/system/system.module';
import { ENDPOINT, METHOD } from './common/enums/method.enum';
import { ElectionTypesModule } from './modules/election-types/election-types.module';
import { ThresholdsModule } from './modules/thresholds/thresholds.module';
import { VotingMethodsModule } from './modules/voting-methods/voting-methods.module';
import { ElectionEntitiesModule } from './modules/election-entities/election-entities.module';
import { ElectionParticipantsModule } from './modules/election-participants/election-participants.module';
import { VotersModule } from './modules/voters/voters.module';
import { VotingRightsModule } from './modules/voting-rights/voting-rights.module';
import { VoterInvitationsModule } from './modules/voter-invitations/voter-invitations.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { DelegationsModule } from './modules/delegations/delegations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DelegateCardsModule } from './modules/delegate-cards/delegate-cards.module';
import { MeetingAttendeesModule } from './modules/meeting-attendees/meeting-attendees.module';
import { BallotsModule } from './modules/ballots/ballots.module';
import { ResultsModule } from './modules/results/results.module';
import { MailModule } from './modules/mail/mail.module';
import { ElectionDocumentsModule } from './modules/election-documents/election-documents.module';
import { UsersModule } from './modules/users/users.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 2000,
      },
    ]),
    DatabaseModule,
    MongooseModule.forFeature([
      { name: SystemLog.name, schema: SystemLogSchema },
      { name: AuditLogs.name, schema: AuditLogsSchema }
    ]),
    MinioModule,
    ElectionsModule,
    SmsModule,
    SignatureModule,
    CaModule,
    AuthModule,
    SystemModule,
    MailModule,
    ElectionTypesModule,
    ThresholdsModule,
    VotingMethodsModule,
    ElectionEntitiesModule,
    ElectionParticipantsModule,
    VotersModule,
    VotingRightsModule,
    VoterInvitationsModule,
    MeetingsModule,
    DelegationsModule,
    ReportsModule,
    DelegateCardsModule,
    MeetingAttendeesModule,
    BallotsModule,
    ResultsModule,
    ElectionDocumentsModule,
    UsersModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: "auth/login", method: RequestMethod.POST },
        { path: "auth/register", method: RequestMethod.POST },
        { path: `system/${ENDPOINT.SYSTEM_LOG}/${METHOD.SEARCH}`, method: RequestMethod.POST },
        { path: "api/docs", method: RequestMethod.GET },
        { path: "api/*", method: RequestMethod.GET },
        { path: "/system/roles/create", method: RequestMethod.POST },
        { path: "election-types/:code", method: RequestMethod.GET },
        { path: "thresholds/:code", method: RequestMethod.GET },
        { path: "voting-methods/:code", method: RequestMethod.GET },

        //electionEntities
        { path: "election-entities", method: RequestMethod.POST },
        { path: "election-entities/:id", method: RequestMethod.PUT },
        { path: "election-entities/elections/:electionId", method: RequestMethod.GET },
        { path: "election-entities/:id", method: RequestMethod.GET },

        //electionParticipants
        { path: "election-participants", method: RequestMethod.POST },
        { path: "election-participants/:id", method: RequestMethod.GET },
        { path: "election-participants/elections/:electionId", method: RequestMethod.GET },

        { path: "voters", method: RequestMethod.POST },
        { path: "voters/:id", method: RequestMethod.PUT },
        { path: "voters/:id", method: RequestMethod.GET },
        { path: "voting-rights", method: RequestMethod.POST },
        { path: "voting-rights/:id", method: RequestMethod.PUT },
        { path: "voting-rights/elections/:electionId", method: RequestMethod.GET },
        { path: "voting-rights/voters/:voterId", method: RequestMethod.GET },
        { path: "voting-rights/:id", method: RequestMethod.GET },

        //Voter Invitations
        { path: "voter-invitations", method: RequestMethod.POST },
        { path: "voter-invitations/:id", method: RequestMethod.PUT },
        { path: "voter-invitations/elections/:electionId", method: RequestMethod.GET },
        { path: "voter-invitations/voters/:voterId", method: RequestMethod.GET },
        { path: "voter-invitations/:id", method: RequestMethod.GET },

        //meetings
        { path: "meetings", method: RequestMethod.POST },
        { path: "meetings/:id", method: RequestMethod.PUT },
        { path: "meetings/:id", method: RequestMethod.GET },
        { path: "meetings/elections/:id", method: RequestMethod.GET },

        { path: "delegations/:id", method: RequestMethod.GET },
        { path: "delegations/pending", method: RequestMethod.GET },
        { path: "delegations/election/:electionId", method: RequestMethod.GET },
        { path: "delegations", method: RequestMethod.POST },
        { path: "delegations/:id", method: RequestMethod.PUT },
        { path: "reports/:id", method: RequestMethod.GET },
        { path: "reports", method: RequestMethod.GET },
        { path: "reports", method: RequestMethod.POST },
        { path: "reports/:id", method: RequestMethod.PUT },
        { path: "delegate-cards/active", method: RequestMethod.GET },

        //meetingAttendees
        { path: "meeting-attendees/:id", method: RequestMethod.PUT },
        { path: "meeting-attendees/meetings/:meetingId/participants/:participantId/attendance", method: RequestMethod.PATCH },
        { path: "meeting-attendees", method: RequestMethod.GET },
        { path: "meeting-attendees/:id", method: RequestMethod.GET },
        { path: "meeting-attendees/meetings/:meetingId", method: RequestMethod.GET },
        { path: "meeting-attendees/participants/:participantId", method: RequestMethod.GET },
        { path: "meeting-attendees", method: RequestMethod.POST },

        //Ballots
        { path: "ballots", method: RequestMethod.GET },
        { path: "ballots/elections/:electionId", method: RequestMethod.GET },
        { path: "ballots/voters/:voterId", method: RequestMethod.GET },
        { path: "ballots/:id", method: RequestMethod.GET },
        { path: "ballots/:id", method: RequestMethod.PUT },
        { path: "ballots", method: RequestMethod.POST },

        //Results
        { path: "results", method: RequestMethod.GET },
        { path: "results/elections/:electionId", method: RequestMethod.GET },
        { path: "results/:id", method: RequestMethod.GET },
        { path: "results/:id", method: RequestMethod.PUT },
        { path: "results", method: RequestMethod.POST },
        { path: "signing/doc", method: RequestMethod.POST },
        { path: "ca/init", method: RequestMethod.POST },
        { path: "ca/issue", method: RequestMethod.POST },
        { path: "ca/issue", method: RequestMethod.POST },
        { path: "users/:id", method: RequestMethod.GET },
        // { path: "user/create", method: RequestMethod.POST },
        // { path: "user/detail/:id", method: RequestMethod.GET },

        //Election Documents
        { path: "election-documents/elections/:electionId", method: RequestMethod.GET },
        { path: "election-documents/:id", method: RequestMethod.GET },
        { path: "election-documents/:id", method: RequestMethod.PUT },
        { path: "election-documents", method: RequestMethod.POST },

      )
      .forRoutes("*");
    consumer.apply(AuditLogsMiddleware).forRoutes("*");
  }
}
