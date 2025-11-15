import { Module } from '@nestjs/common';
import { CaController } from './ca.controller';
import { CaService } from './ca.service';
import { MinioModule } from '../minio/minio.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MinioModule,
    MailModule
  ],
  controllers: [CaController],
  providers: [CaService],
})
export class CaModule {}
