import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Reports, ReportsSchema } from 'src/database/schemas/reports.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { ElectionsParticipants, ElectionsParticipantsSchema } from 'src/database/schemas/electionParticipants.schema';
import { SigningService } from '../signature/signature.service';
import { MinioModule } from '../minio/minio.module';
import { SignatureModule } from '../signature/signature.module';
import { ElectionDocuments, ElectionDocumentSchema } from 'src/database/schemas/electionDocuments.schema';
import { MailModule } from '../mail/mail.module';
import { Users, UsersSchema } from 'src/database/schemas/users.schema';

@Module({
  imports:
    [MongooseModule.forFeature([
      { name: Reports.name, schema: ReportsSchema },
      { name: Elections.name, schema: ElectionsSchema },
      { name: ElectionsParticipants.name, schema: ElectionsParticipantsSchema },
      { name: ElectionDocuments.name, schema: ElectionDocumentSchema },
      { name: Users.name, schema: UsersSchema }
    ]),
      SignatureModule,
      MinioModule,
      MailModule
    ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule { }
