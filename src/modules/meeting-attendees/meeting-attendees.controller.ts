import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Put } from '@nestjs/common';
import { MeetingAttendeesService } from './meeting-attendees.service';
import { CreateMeetingAttendeeDto } from './dto/create-meeting-attendee.dto';
import { UpdateMeetingAttendeeDto } from './dto/update-meeting-attendee.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

@Controller('meeting-attendees')
export class MeetingAttendeesController {
  constructor(private readonly meetingAttendeesService: MeetingAttendeesService) { }


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

  @Post()
  @ApiOperation({ summary: "Tạo người tham gia trong cuộc họp" })
  @ApiResponse({ status: 200, description: "Tạo người tham gia trong cuộc họp thành công" })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiResponse({ status: 500, description: "Lỗi server" })
  async create(@Body() createMeetingAttendeeDto: CreateMeetingAttendeeDto) {
    try {
      const resData = await this.meetingAttendeesService.create(createMeetingAttendeeDto);
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
    @Body('attended') attended: boolean): Promise<BaseResponse> {
    try {
      const resData = await this.meetingAttendeesService.updateStatusAttendance(meetingId, participantId, attended);
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
  async update(@Param('id') id: string, @Body() updateMeetingAttendeeDto: UpdateMeetingAttendeeDto) {
    try {
      const resData = await this.meetingAttendeesService.update(id, updateMeetingAttendeeDto);
      return BaseResponse.success(resData, MESSAGE.MEETING_ATTENDEE_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
