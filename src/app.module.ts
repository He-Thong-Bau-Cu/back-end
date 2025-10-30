import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
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
import { AuditLogsMiddleware } from './common/middleware/audit-logs.middleware';
import { AuditLogs, AuditLogsSchema } from './database/schemas/auditLogs.schema';
import { SystemModule } from './modules/system/system.module';
import { ENDPOINT, METHOD } from './common/enums/method.enum';
import { RolesModule } from './modules/role/roles.module';
import { ElectionTypesModule } from './modules/election-types/election-types.module';
import { ThresholdsModule } from './modules/thresholds/thresholds.module';
import { VotingMethodsModule } from './modules/voting-methods/voting-methods.module';
import { ElectionEntitiesModule } from './modules/election-entities/election-entities.module';
import { ElectionParticipantsModule } from './modules/election-participants/election-participants.module';
import { VotersModule } from './modules/voters/voters.module';
import { VoterInvitationsModule } from './modules/voter-invitations/voter-invitations.module';
import { VotingRightsModule } from './modules/voting-rights/voting-rights.module';


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
      {name: SystemLog.name, schema: SystemLogSchema},
      {name: AuditLogs.name, schema: AuditLogsSchema}
    ]),
    UserModule,
    MinioModule,
    ElectionsModule,
    SmsModule,
    SignatureModule,
    CaModule,
    AuthModule,
    SystemModule,
    RolesModule,
    ElectionTypesModule,
    ThresholdsModule,
    VotingMethodsModule,
    ElectionEntitiesModule,
    ElectionParticipantsModule,
    VotersModule,
    VotingRightsModule,
    VoterInvitationsModule,
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
        { path: "election-types/:code", method: RequestMethod.GET },
        { path: "thresholds/:code", method: RequestMethod.GET },
        { path: "voting-methods/:code", method: RequestMethod.GET },
        { path: "election-entities", method: RequestMethod.POST },
        { path: "election-entities/:id", method: RequestMethod.PUT },
        { path: "election-participants", method: RequestMethod.POST },
        { path: "voters", method: RequestMethod.POST },
        { path: "voters/:id", method: RequestMethod.PUT },
        { path: "voting-rights", method: RequestMethod.POST },
        { path: "voting-rights/:id", method: RequestMethod.PUT },
        
      )
      .forRoutes("*");
      // consumer.apply(AuditLogsMiddleware).forRoutes("*");
  }
}
