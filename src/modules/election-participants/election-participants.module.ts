import { Module } from '@nestjs/common';
import { ElectionParticipantsService } from './election-participants.service';
import { ElectionParticipantsController } from './election-participants.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ElectionsParticipants, ElectionsParticipantsSchema } from 'src/database/schemas/electionParticipants.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { User, UserSchema } from 'src/database/schemas/users.schema';
import { Roles, RolesSchema } from 'src/database/schemas/roles.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name:ElectionsParticipants.name, schema:ElectionsParticipantsSchema}, 
      {name:Elections.name, schema:ElectionsSchema},
      {name:User.name, schema:UserSchema},
      {name:Roles.name, schema:RolesSchema},
    ])
  ],
  controllers: [ElectionParticipantsController],
  providers: [ElectionParticipantsService],
})
export class ElectionParticipantsModule {}
