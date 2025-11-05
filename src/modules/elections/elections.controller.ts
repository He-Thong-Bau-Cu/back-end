import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { ElectionsService } from './elections.service';
import { METHOD } from 'src/common/enums/method.enum';
import { ElectionsDocumentDto } from './dto/electionsDocument.dto';
import { CreateElectionDto } from './dto/create-elections-dto';
import { SearchDTO } from 'src/common/dto/search.dto';
import { UpdateElectionDto } from './dto/update-elections-dto';

@ApiTags('Elections')
@Controller('elections')
export class ElectionsController {
  constructor(private readonly electionsService: ElectionsService) { }

  @Post(METHOD.SEARCH)
  @ApiOperation({ summary: 'Tìm kiếm danh sách kỳ bầu cử' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách kỳ bầu cử trả về thành công.',
  })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async searchElections(@Body() req: SearchDTO): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.searchElections(req);
      return BaseResponse.success(resData, MESSAGE.ELECTION_SEARCH_SUCCESS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException(
        { message: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(`${METHOD.GET}/:id`)
  @ApiOperation({ summary: 'Lấy thông tin kỳ bầu cử theo ID' })
  @ApiParam({ name: 'id', description: 'ID của kỳ bầu cử', type: String })
  @ApiResponse({ status: 200, description: 'Thông tin kỳ bầu cử' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getElectionById(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.getElectionById(id);
      return BaseResponse.success(resData, MESSAGE.ELECTION_GET_BY_ID_SUCCESS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException(
        { message: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }




  @Put(`${METHOD.UPDATE}/:id`)
  @ApiOperation({ summary: 'Cập nhật thông tin kỳ bầu cử' })
  @ApiParam({ name: 'id', description: 'ID của kỳ bầu cử', type: String })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async updateElections(
    @Param('id') id: string,
    @Body() req: UpdateElectionDto,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.updateElections(id, req);
      return BaseResponse.success(resData, MESSAGE.ELECTION_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException(
        { message: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(`${METHOD.DELETE}/:id`)
  @ApiOperation({ summary: 'Xoá một kỳ bầu cử theo ID' })
  @ApiParam({ name: 'id', description: 'ID của kỳ bầu cử', type: String })
  @ApiResponse({ status: 200, description: 'Xoá thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async deleteElection(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.deleteElection(id);
      return BaseResponse.success(resData, MESSAGE.ELECTION_DELETE_SUCCESS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException(
        { message: e.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Post(`/document/${METHOD.CREATE}`)
  // @ApiOperation({ summary: 'Tạo tài liệu cho một kỳ bầu cử' })
  // @ApiResponse({ status: 201, description: 'Tạo tài liệu thành công' })
  // @ApiResponse({ status: 500, description: 'Lỗi server' })
  // async createElectionDocuments(
  //   @Body() req: ElectionsDocumentDto,
  // ): Promise<BaseResponse> {
  //   try {
  //     const resData = await this.electionsService.createElectionDocuments(req);
  //     return BaseResponse.success(resData, MESSAGE.ELECTION_DOCUMENT_CREATE_SUCCESS, HttpStatus.OK);
  //   } catch (e) {
  //     throw new HttpException(
  //       { message: e.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  // @Delete(`/document/${METHOD.DELETE}/:electionId`)
  // @ApiOperation({ summary: 'Xoá tất cả tài liệu theo ElectionId' })
  // @ApiParam({
  //   name: 'electionId',
  //   description: 'ID của kỳ bầu cử',
  //   type: String,
  // })
  // @ApiResponse({ status: 200, description: 'Xoá tài liệu thành công' })
  // @ApiResponse({ status: 500, description: 'Lỗi server' })
  // async deleteDocumentByElectionId(
  //   @Param('electionId') electionId: string,
  // ): Promise<BaseResponse> {
  //   try {
  //     const resData =
  //       await this.electionsService.deleteDocumentByElectionId(electionId);
  //     return BaseResponse.success(resData, MESSAGE.ELECTION_DOCUMENT_DELETE_SUCCESS, HttpStatus.OK);
  //   } catch (e) {
  //     throw new HttpException(
  //       { message: e.message },
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  @Post('')
  @ApiOperation({ summary: "Tạo mới cuộc bầu cử" })
  @ApiResponse({ status: 200, description: 'Tạo mới cuộc bầu cử thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async createElection(@Body() createElection: CreateElectionDto): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.createElection(createElection);
      return BaseResponse.success(resData, MESSAGE.ELECTION_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
