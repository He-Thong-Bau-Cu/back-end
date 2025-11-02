import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/database/schemas/users.schema';
import {Roles, RolesSchema} from "../../database/schemas/roles.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
        { name: User.name, schema: UserSchema },
        { name: Roles.name, schema: RolesSchema },
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
