import {Module} from '@nestjs/common';
import {AuthService} from './auth.service';
import {AuthController} from './auth.controller';
import {MongooseModule} from "@nestjs/mongoose";
import {User, UserSchema} from "../../database/schemas/users.schema";
import {Roles, RolesSchema} from "../../database/schemas/roles.schema";
import {RolePermissions, RolePermissionsSchema} from "../../database/schemas/rolePermissions.schema";
import {Permissions, PermissionsSchema} from "../../database/schemas/permissions.schema";

@Module({
    imports: [
        MongooseModule.forFeature([
            {name: User.name, schema: UserSchema},
            {name: Roles.name, schema: RolesSchema},
            {name: RolePermissions.name, schema: RolePermissionsSchema},
            {name: Permissions.name, schema: PermissionsSchema}
        ])
    ],
    providers: [AuthService],
    controllers: [AuthController]
})
export class AuthModule {
}
