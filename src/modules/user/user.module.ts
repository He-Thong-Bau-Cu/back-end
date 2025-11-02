import {Module} from '@nestjs/common';
import {UserService} from './user.service';
import {UserController} from './user.controller';
import {MongooseModule} from '@nestjs/mongoose';
import {User, UserSchema} from 'src/database/schemas/users.schema';
import {Roles, RolesSchema} from "../../database/schemas/roles.schema";
import {MailService} from "../mail/mail.service";
import {MailModule} from "../mail/mail.module";

@Module({
    imports: [
        MongooseModule.forFeature([
            {name: User.name, schema: UserSchema},
            {name: Roles.name, schema: RolesSchema},
        ]),
        MailModule
    ],
    providers: [UserService],
    controllers: [UserController],
})
export class UserModule {
}
