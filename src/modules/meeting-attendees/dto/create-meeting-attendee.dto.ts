import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";


export class CreateMeetingAttendeeDto {
    @ApiProperty({
        description:'ID của cuộc họp', 
        example: '60f7c0c2b4d1c826d8f0e6b1'
    })
    @IsNotEmpty()
    @IsString()
    meetingId: string

    @ApiProperty({
        description:'ID của người tham gia', 
        example: '60f7c0c2b4d1c826d8f0e6b2'
    })
    @IsNotEmpty()
    @IsString()
    participantId: string

    @ApiProperty({
        description:'Thời gian checkin', 
        example: '2022-01-01T00:00:00.000Z'
    })
    @IsNotEmpty()
    @IsString()
    checkInTime: Date

    @ApiProperty({
        description:'Trạng thái tham gia', 
        example: true
    })
    @IsNotEmpty()
    attended: boolean

}
