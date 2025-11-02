import {Module} from '@nestjs/common';
import {RoleService} from './role.service';
import {MongooseModule} from "@nestjs/mongoose";
import {Roles, RolesSchema} from "../../../database/schemas/roles.schema";
import {RolePermissions, RolePermissionsSchema} from "../../../database/schemas/rolePermissions.schema";
import {Permissions, PermissionsSchema} from "../../../database/schemas/permissions.schema";

@Module({
    imports: [
        MongooseModule.forFeature([
            {name: Roles.name, schema: RolesSchema},
            {name: RolePermissions.name, schema: RolePermissionsSchema},
            {name: Permissions.name, schema: PermissionsSchema},
        ])
    ],
    controllers: [],
    providers: [RoleService],
    exports: [RoleService],
})
export class RoleModule {
}
