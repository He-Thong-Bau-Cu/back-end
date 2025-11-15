import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Put, Req } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';

@ApiBearerAuth('access-token')
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) { }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin cuộc họp theo ID' })
  @ApiResponse({ status: 200, description: 'Thông tin cuộc họp đã được lấy thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc họp.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getById(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.meetingsService.getById(id);
      return BaseResponse.success(resData, MESSAGE.MEETING_GET_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('elections/:electionId')
  @ApiOperation({ summary: 'Lấy danh sách cuộc họp theo ID cuộc bầu cử' })
  @ApiResponse({ status: 200, description: 'Danh sách cuộc họp đã được lấy thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc bầu cử.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getByElecionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.meetingsService.getByElectionId(electionId);
      return BaseResponse.success(resData, MESSAGE.MEETING_GET_BY_ELECTION_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }

  }



  @Post()
  @ApiOperation({ summary: 'Tạo một cuộc họp mới' })
  @ApiResponse({ status: 201, description: 'Cuộc họp đã được tạo thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(
    @Body() createMeeting: CreateMeetingDto,
    @Req() req: CustomRequest): Promise<BaseResponse> {
    try {
      const resData = await this.meetingsService.create(createMeeting, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.MEETING_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }


  @Put(':id')
  @ApiOperation({ summary: "Cập nhật cuộc họp" })
  @ApiResponse({ status: 201, description: 'Cuộc họp đã được cập nhật thành công.' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async update(
    @Param('id') id: string,
    @Body() updateMeeting: UpdateMeetingDto,
    @Req() req: CustomRequest): Promise<BaseResponse> {
    try {
      const resData = await this.meetingsService.update(id, updateMeeting, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.MEETING_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('search')
  @ApiOperation({ summary: 'Tìm kiếm cuộc họp' })
  @ApiResponse({ status: 200, description: 'Kết quả tìm kiếm cuộc họp.' })
  async search(@Body() req: BaseSearchDTO): Promise<BaseResponse> {
    try {
      const resData = await this.meetingsService.search(req);
      return BaseResponse.success(resData, MESSAGE.MEETING_SEARCH_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}