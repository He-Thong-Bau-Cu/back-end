import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, HttpException, Put } from '@nestjs/common';
import { ElectionDocumentsService } from './election-documents.service';
import { CreateElectionDocumentDto } from './dto/create-election-document.dto';
import { UpdateElectionDocumentDto } from './dto/update-election-document.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';

@Controller('election-documents')
export class ElectionDocumentsController {
  constructor(private readonly electionDocumentsService: ElectionDocumentsService) {}

  @Post()
  @ApiOperation({summary:"Tạo mới tài liệu của cuộc bầu cử"})
  @ApiResponse({status:201,description:"Tạo mới tài liệu của cuộc bầu cử thành công"})
  @ApiResponse({status:400,description:"Dữ liệu không hợp lệ"})
  @ApiResponse({status:500,description:"Lỗi server"})
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createElectionDocumentDto: CreateElectionDocumentDto):Promise<BaseResponse> {
   try {
    const resData = await this.electionDocumentsService.create(createElectionDocumentDto);
    return BaseResponse.success(resData,MESSAGE.ELECTION_DOCUMENT_CREATE_SUCCESS, HttpStatus.CREATED);
   } catch (error) {
    throw new HttpException(
      {message:error.message},
      HttpStatus.INTERNAL_SERVER_ERROR
    )
   }
  }

  @Get(':id')
  @ApiOperation({summary:"Lấy danh sách tài liệu của cuộc bầu cử"})
  @ApiResponse({status:200,description:"Lấy danh sách tài liệu của cuộc bầu cử thành công"})
  @ApiResponse({status:400,description:"Dữ liệu không hợp lệ"})
  @ApiResponse({status:500,description:"Lỗi server"})
  @HttpCode(HttpStatus.OK)
  async getById(@Param('id') id: string):Promise<BaseResponse> {
    try {
      const resData = await this.electionDocumentsService.getById(id);
      return BaseResponse.success(resData,MESSAGE.ELECTION_DOCUMENT_GET_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        {message:error.message},
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Get('elections/:id')
  @ApiOperation({summary:"Lấy danh sách tài liệu của cuộc bầu cử"})
  @ApiResponse({status:200,description:"Lấy danh sách tài liệu của cuộc bầu cử thành công"})
  @ApiResponse({status:400,description:"Dữ liệu không hợp lệ"})
  @ApiResponse({status:500,description:"Lỗi server"})
  @HttpCode(HttpStatus.OK)
  async getByElectionId(@Param('id') id: string):Promise<BaseResponse> {
    try {
      const resData = await this.electionDocumentsService.getByElectionId(id);
      return BaseResponse.success(resData,MESSAGE.ELECTION_DOCUMENT_GET_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        {message:error.message},
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Put(':id')
  @ApiOperation({summary:"Cập nhật tài liệu của cuộc bầu cử"})
  @ApiResponse({status:200,description:"Cập nhật tài liệu của cuộc bầu cử thành công"})
  @ApiResponse({status:400,description:"Dữ liệu không hợp lệ"})
  @ApiResponse({status:500,description:"Lỗi server"})
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() updateElectionDocumentDto: UpdateElectionDocumentDto):Promise<BaseResponse> {
    try {
      const resData = await this.electionDocumentsService.update(id, updateElectionDocumentDto);
      return BaseResponse.success(resData,MESSAGE.ELECTION_DOCUMENT_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        {message:error.message},
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

}
