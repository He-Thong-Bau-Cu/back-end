import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Users } from 'src/database/schemas/users.schema';
import { UsersSchema } from 'src/database/schemas/users.schema';
import { Roles } from 'src/database/schemas/roles.schema';
import { RolesSchema } from 'src/database/schemas/roles.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Users.name, schema: UsersSchema },
    { name: Roles.name, schema: RolesSchema },
  ])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
