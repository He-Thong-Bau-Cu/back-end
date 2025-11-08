import { Module } from '@nestjs/common';
import { DelegationsService } from './delegations.service';
import { DelegationsController } from './delegations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Delegations, DelegationsSchema } from 'src/database/schemas/delegations.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { Users, UsersSchema } from 'src/database/schemas/users.schema';
import { ElectionDocuments, ElectionDocumentSchema } from 'src/database/schemas/electionDocuments.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Delegations.name, schema: DelegationsSchema },
      { name: Elections.name, schema: ElectionsSchema },
      { name: Users.name, schema: UsersSchema },
      { name: ElectionDocuments.name, schema: ElectionDocumentSchema },
    ]),
    UsersModule
  ],
  controllers: [DelegationsController],
  providers: [DelegationsService],
})
export class DelegationsModule { }
