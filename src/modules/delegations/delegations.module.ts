import { Module } from '@nestjs/common';
import { DelegationsService } from './delegations.service';
import { DelegationsController } from './delegations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Delegations, DelegationsSchema } from 'src/database/schemas/delegations.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { User, UserSchema } from 'src/database/schemas/users.schema';
import { ElectionDocuments, ElectionDocumentSchema  } from 'src/database/schemas/electionDocuments.schema';

@Module({
  imports:[
    MongooseModule.forFeature([
      {name:Delegations.name, schema:DelegationsSchema},
      {name:Elections.name, schema:ElectionsSchema},
      {name:User.name, schema:UserSchema},
      {name:ElectionDocuments.name, schema:ElectionDocumentSchema},    
    ])
  ],
  controllers: [DelegationsController],
  providers: [DelegationsService],
})
export class DelegationsModule {}
