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
import { Roles } from './database/schemas/roles.schema';
import { RolesModule } from './modules/role/roles.module';

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
    MongooseModule.forFeature([{name: SystemLog.name, schema: SystemLogSchema}]),
    UserModule,
    MinioModule,
    ElectionsModule,
    SmsModule,
    SignatureModule,
    CaModule,
    AuthModule,
    RolesModule,
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
        { path: "sms/send", method: RequestMethod.POST },
        { path: "api", method: RequestMethod.GET },
        { path: "role", method: RequestMethod.GET },
        { path: "role/:id", method: RequestMethod.GET },
        { path: "role", method: RequestMethod.POST },
        { path: "role/:id", method: RequestMethod.PUT },
        { path: "role/:id", method: RequestMethod.DELETE },
      )
      .forRoutes("*");
  }
}
