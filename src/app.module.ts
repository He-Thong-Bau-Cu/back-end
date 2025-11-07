import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
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
import { RedisModule } from './modules/redis/redis.module';
import { TwilioModule } from './modules/twilio/twilio.module';


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
    UsersModule,
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
    RedisModule,
    TwilioModule,
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
        { path: "auth/2fa/setup", method: RequestMethod.POST },
        { path: "auth/2fa/login", method: RequestMethod.POST },
        { path: "auth/2fa/verify", method: RequestMethod.POST },
        { path: "auth/send-otp", method: RequestMethod.POST },
        { path: "auth/verify-otp", method: RequestMethod.POST },
        { path: "auth/forward-password", method: RequestMethod.POST },

      )
      .forRoutes("*");

    // AuditLogsMiddleware chỉ exclude các route auth (không cần log các action auth)
    consumer
      .apply(AuditLogsMiddleware)
      .exclude(
        { path: "auth/login", method: RequestMethod.POST },
        { path: "auth/register", method: RequestMethod.POST },
        { path: "auth/2fa/setup", method: RequestMethod.POST },
        { path: "auth/2fa/login", method: RequestMethod.POST },
        { path: "auth/2fa/verify", method: RequestMethod.POST },
        { path: "auth/send-otp", method: RequestMethod.POST },
        { path: "auth/verify-otp", method: RequestMethod.POST },
        { path: "auth/forward-password", method: RequestMethod.POST },
        { path: "auth/change-password", method: RequestMethod.POST },
      )
      .forRoutes("*");
  }
}
