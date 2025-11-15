import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Put, Request, Req } from '@nestjs/common';
import { MeetingAttendeesService } from './meeting-attendees.service';
import { CreateMeetingAttendeeDto } from './dto/create-meeting-attendee.dto';
import { UpdateMeetingAttendeeDto } from './dto/update-meeting-attendee.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';

@ApiBearerAuth('access-token')
@Controller('meeting-attendees')
export class MeetingAttendeesController {
  constructor(private readonly meetingAttendeesService: MeetingAttendeesService) { }

  @Get()
  @ApiOperation({ summary: "Lấy danh sách người tham gia trong cuộc họp" })
  @ApiResponse({ status: 200, description: "Lấy danh sách người tham gia trong cuộc họp thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async getAll() {
    try {
      const resData = await this.meetingAttendeesService.findAll();
      return BaseResponse.success(resData, MESSAGE.MEETING_ATTENDEE_GET_ALL_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  @Get(':id')
  @ApiOperation({ summary: "Lấy thông tin người tham gia trong cuộc họp theo ID" })
  @ApiResponse({ status: 200, description: "Lấy thông tin người tham gia trong cuộc họp theo ID thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async getById(@Param('id') id: string) {
    try {
      const resData = await this.meetingAttendeesService.findOne(id);
      return BaseResponse.success(resData, MESSAGE.MEETING_ATTENDEE_GET_BY_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }



  @Get('meetings/:meetingId')
  @ApiOperation({ summary: "Lấy danh sách người tham gia trong cuộc họp theo ID cuộc họp" })
  @ApiResponse({ status: 200, description: "Lấy danh sách người tham gia trong cuộc họp theo ID cuộc họp thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async getByMeetingId(@Param('meetingId') meetingId: string) {
    try {
      const resData = await this.meetingAttendeesService.getByMeetingId(meetingId);
      return BaseResponse.success(resData, MESSAGE.MEETING_ATTENDEE_GET_BY_MEETING_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('participants/:participantId')
  @ApiOperation({ summary: "Lấy danh sách người tham gia trong cuộc họp theo ID người tham gia" })
  @ApiResponse({ status: 200, description: "Lấy danh sách người tham gia trong cuộc họp theo ID người tham gia thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async getByParticipantId(@Param('participantId') participantId: string) {
    try {
      const resData = await this.meetingAttendeesService.getByParticipantId(participantId);
      return BaseResponse.success(resData, MESSAGE.MEETING_ATTENDEE_GET_BY_PARTICIPANT_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('not-attended/elections/:electionId')
  @ApiOperation({ summary: "Lấy danh sách người tham gia chưa tham dự cuộc họp theo ID cuộc bầu cử" })
  @ApiResponse({ status: 200, description: "Lấy danh sách người tham gia chưa tham dự cuộc họp theo ID cuộc bầu cử thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async getNotAttendedByElectionId(@Param('electionId') electionId: string) {
    try {
      const resData = await this.meetingAttendeesService.getParticipantsNotAttended(electionId);
      return BaseResponse.success(resData, MESSAGE.MEETING_ATTENDEE_GET_NOT_ATTENDED_BY_ELECTION_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('attended/elections/:electionId')
  @ApiOperation({ summary: "Lấy danh sách người tham gia đã tham dự cuộc họp theo ID cuộc bầu cử" })
  @ApiResponse({ status: 200, description: "Lấy danh sách người tham gia đã tham dự cuộc họp theo ID cuộc bầu cử thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async getAttendedByElectionId(@Param('electionId') electionId: string) {
    try {
      const resData = await this.meetingAttendeesService.getParticipantsAttended(electionId);
      return BaseResponse.success(resData, MESSAGE.MEETING_ATTENDEE_GET_ATTENDED_BY_ELECTION_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  @Post()
  @ApiOperation({ summary: "Tạo người tham gia trong cuộc họp" })
  @ApiResponse({ status: 200, description: "Tạo người tham gia trong cuộc họp thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async create(
    @Body() createMeetingAttendeeDto: CreateMeetingAttendeeDto,
    @Req() req: CustomRequest) {
    try {
      const resData = await this.meetingAttendeesService.create(createMeetingAttendeeDto, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.MEETING_ATTENDEE_CREATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }



  @Patch("/meetings/:meetingId/participants/:participantId/attendance")
  @ApiOperation({ summary: "Cập nhật trạng thái tham gia cuộc họp" })
  @ApiResponse({ status: 200, description: "Cập nhật trạng thái tham gia cuộc họp thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async updateStatusAttendance(
    @Param('meetingId') meetingId: string,
    @Param('participantId') participantId: string,
    @Body('attended') attended: boolean,
    @Req() req: CustomRequest): Promise<BaseResponse> {
    try {
      const resData = await this.meetingAttendeesService.updateStatusAttendance(meetingId, participantId, attended, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.MEETING_ATTENDEE_UPDATE_STATUS_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: "Cập nhật thông tin người tham gia trong cuộc họp" })
  @ApiResponse({ status: 200, description: "Cập nhật thông tin người tham gia trong cuộc họp thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async update(
    @Param('id') id: string,
    @Body() updateMeetingAttendeeDto: UpdateMeetingAttendeeDto,
    @Req() req: CustomRequest) {
    try {
      const resData = await this.meetingAttendeesService.update(id, updateMeetingAttendeeDto, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.MEETING_ATTENDEE_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
