import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Put } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo một cuộc họp mới' })
  @ApiResponse({ status: 201, description: 'Cuộc họp đã được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(@Body() createMeeting: CreateMeetingDto): Promise<BaseResponse> {
    try {
      const resData = await this.meetingsService.create(createMeeting);
      return BaseResponse.success(resData, 'Tạo cuộc họp thành công', 201);
    } catch (error) {
      throw new HttpException(
        {message:error.message},
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  
  @Put(':id')
  @ApiOperation({summary: "Cập nhật cuộc họp"})
   @ApiResponse({ status: 201, description: 'Cuộc họp đã được cập nhật thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async update(@Param('id') id:string, @Body() updateMeeting:UpdateMeetingDto):Promise<BaseResponse>{
    try {
      const resData = await this.meetingsService.update(id, updateMeeting);
      return BaseResponse.success(resData, 'Cập nhật cuộc họp thành công', 200);
    } catch (error) {
      throw new HttpException(
        {message:error.message},
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
