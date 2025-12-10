import { Module } from '@nestjs/common';
import { CaController } from './ca.controller';
import { CaService } from './ca.service';
import { MinioModule } from '../minio/minio.module';
import { MailModule } from '../mail/mail.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Users, UsersSchema } from 'src/database/schemas/users.schema';

@Module({
  imports: [
    MinioModule,
    MailModule,
    MongooseModule.forFeature([
      {name: Users.name, schema: UsersSchema}
    ]),
    MinioModule
  ],
  controllers: [CaController],
  providers: [CaService],
})
export class CaModule {}
