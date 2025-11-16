import { Module } from '@nestjs/common';
import { DelegationsService } from './delegations.service';
import { DelegationsController } from './delegations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Delegations, DelegationsSchema } from 'src/database/schemas/delegations.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { Users, UsersSchema } from 'src/database/schemas/users.schema';
import { ElectionDocuments, ElectionDocumentSchema } from 'src/database/schemas/electionDocuments.schema';
import { UsersModule } from '../users/users.module';
import { SignatureModule } from '../signature/signature.module';
import { Voters, VotersSchema } from 'src/database/schemas/voters.schema';
import { MinioModule } from '../minio/minio.module';
import { ElectionsParticipants, ElectionsParticipantsSchema } from 'src/database/schemas/electionParticipants.schema';
import { Roles, RolesSchema } from 'src/database/schemas/roles.schema';
import { VotingRights, VotingRightsSchema } from 'src/database/schemas/votingRights.schema';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Delegations.name, schema: DelegationsSchema },
      { name: Elections.name, schema: ElectionsSchema },
      { name: Users.name, schema: UsersSchema },
      { name: ElectionDocuments.name, schema: ElectionDocumentSchema },
      { name: Voters.name, schema: VotersSchema },
      { name: ElectionsParticipants.name, schema: ElectionsParticipantsSchema },
      { name: Roles.name, schema: RolesSchema },
      { name: VotingRights.name, schema: VotingRightsSchema },
    ]),
    UsersModule,
    SignatureModule,
    MinioModule,
    NotificationModule
  ],
  controllers: [DelegationsController],
  providers: [DelegationsService],
})
export class DelegationsModule { }
