import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { MinioModule } from './modules/minio/minio.module';
import { ElectionsModule } from './modules/elections/elections.module';
import { SignatureModule } from './modules/signature/signature.module';
import { CaModule } from './modules/ca/ca.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    UserModule,
    MinioModule,
    ElectionsModule,
    SignatureModule,
    CaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
