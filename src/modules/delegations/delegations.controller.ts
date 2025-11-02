import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, Put } from '@nestjs/common';
import { DelegationsService } from './delegations.service';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { UpdateDelegationDto } from './dto/update-delegation.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';

@Controller('delegations')
export class DelegationsController {
  constructor(private readonly delegationsService: DelegationsService) { }

  //Get By ElectionId
  @Get('election/:electionId')
  @ApiOperation({ summary: "Lấy thông tin ủy quyền theo ID cuộc bầu cử" })
  @ApiResponse({ status: 200, description: "Lấy thông tin ủy quyền theo ID cuộc bầu cử thành công" })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getDelegationsByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.getByElectionId(electionId);
      return BaseResponse.success(resData, 'Lấy thông tin ủy quyền theo cuộc bầu cử thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  //Get Delegations has status=pending
  @Get('pending')
  @ApiOperation({ summary: "Lấy danh sách ủy quyền cần xác minh " })
  @ApiResponse({ status: 200, description: "Lấy danh sách ủy quyền cần xác minh thành công" })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getDelegationsStatusPending(): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.getDeletaionsPending();
      return BaseResponse.success(resData, 'Lấy danh sách ủy quyền cần xác minh', HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  //Get by DelegationId
  @Get(':id')
  @ApiOperation({ summary: "Lấy thông tin ủy quyền theo ID" })
  @ApiResponse({ status: 200, description: "Lấy thông tin ủy quyền theo ID thành công" })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getDelegationsById(@Param('id') id: string): Promise<BaseResponse> {
    try {

      const resData = await this.delegationsService.getById(id);
      return BaseResponse.success(resData, 'Lấy thông tin ủy quyền theo ID thành công.', HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới ủy quyền' })
  @ApiResponse({ status: 201, description: 'Tạo ủy quyền thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(@Body() createDelegation: CreateDelegationDto): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.create(createDelegation);
      return BaseResponse.success(resData, 'Tạo ủy quyền thành công', HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin ủy quyền' })
  @ApiResponse({ status: 200, description: 'Cập nhật ủy quyền thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ủy quyền' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async update(
    @Param('id') id: string,
    @Body() updateDelegation: UpdateDelegationDto,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.update(id, updateDelegation);
      return BaseResponse.success(resData, 'Cập nhật ủy quyền thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
