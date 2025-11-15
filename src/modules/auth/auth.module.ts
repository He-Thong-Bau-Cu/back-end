import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Users, UsersSchema } from '../../database/schemas/users.schema';
import { Roles, RolesSchema } from '../../database/schemas/roles.schema';
import {
  RolePermissions,
  RolePermissionsSchema,
} from '../../database/schemas/rolePermissions.schema';
import { Permissions, PermissionsSchema } from '../../database/schemas/permissions.schema';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationModule } from '../notification/notification.module';
import { NotificationGateway } from '../notification/notification.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Users.name, schema: UsersSchema },
      { name: Roles.name, schema: RolesSchema },
      { name: RolePermissions.name, schema: RolePermissionsSchema },
      { name: Permissions.name, schema: PermissionsSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET') || 'supersecretkey',
        signOptions: { expiresIn: '24h' },
      }),
    }),
    MailModule,
    NotificationModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule { }
