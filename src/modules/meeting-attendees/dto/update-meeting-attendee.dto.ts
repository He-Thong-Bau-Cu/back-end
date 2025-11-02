import { PartialType } from '@nestjs/swagger';
import { CreateMeetingAttendeeDto } from './create-meeting-attendee.dto';

export class UpdateMeetingAttendeeDto extends PartialType(CreateMeetingAttendeeDto) {}
