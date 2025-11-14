import {IsOptional} from "class-validator";

export class NotificationDto {
    @IsOptional()
    userId: string;

    @IsOptional()
    notificationId: string;
}
