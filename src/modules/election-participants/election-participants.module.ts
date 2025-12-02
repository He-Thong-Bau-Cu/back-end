import { Module } from '@nestjs/common';
import { ElectionParticipantsService } from './election-participants.service';
import { ElectionParticipantsController } from './election-participants.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ElectionsParticipants, ElectionsParticipantsSchema } from 'src/database/schemas/electionParticipants.schema';
import { Elections, ElectionsSchema } from 'src/database/schemas/elections.schema';
import { Users, UsersSchema } from 'src/database/schemas/users.schema';
import { Roles, RolesSchema } from 'src/database/schemas/roles.schema';
import { RolePermissions, RolePermissionsSchema } from 'src/database/schemas/rolePermissions.schema';
import { Voters, VotersSchema } from 'src/database/schemas/voters.schema';
import { Permissions, PermissionsSchema } from 'src/database/schemas/permissions.schema';
import { Meetings, MeetingsSchema } from 'src/database/schemas/meetings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ElectionsParticipants.name, schema: ElectionsParticipantsSchema },
      { name: Elections.name, schema: ElectionsSchema },
      { name: Users.name, schema: UsersSchema },
      { name: Roles.name, schema: RolesSchema },
      { name: RolePermissions.name, schema: RolePermissionsSchema },
      { name: Voters.name, schema: VotersSchema },
      { name: Permissions.name, schema: PermissionsSchema },
      { name: Meetings.name, schema: MeetingsSchema },
    ])
  ],
  controllers: [ElectionParticipantsController],
  providers: [ElectionParticipantsService],
})
export class ElectionParticipantsModule { }
