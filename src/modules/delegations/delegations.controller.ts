import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  Put,
  Req,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { DelegationsService } from './delegations.service';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { UpdateDelegationDto } from './dto/update-delegation.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';
import { Response } from 'express';
import { DelegationDto } from './dto/delegation.dto';
import { METHOD } from 'src/common/enums/method.enum';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiBearerAuth('access-token')
@Controller('delegations')
export class DelegationsController {
  constructor(private readonly delegationsService: DelegationsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Lấy danh sách ủy quyền theo trạng thái' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách ủy quyền theo trạng thái thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getByStatus(@Query('status') status: string): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.getByStatus(status);
      return BaseResponse.success(resData, MESSAGE.DELEGATION_GET_BY_STATUS_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('search')
  @ApiOperation({ summary: 'Tìm kiếm thông tin ủy quyền' })
  @ApiResponse({ status: 200, description: 'Tìm kiếm thông tin ủy quyền thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async searchDelegations(@Body() req: BaseSearchDTO): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.searchDelegations(req);
      return BaseResponse.success(resData, MESSAGE.DELEGATION_SEARCH_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //Get By DelegatorId And ElectionId
  @Get('delegator/:delegatorId/elections/:electionId')
  @ApiOperation({ summary: 'Lấy thông tin ủy quyền theo ID người ủy quyền và ID cuộc bầu cử' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin ủy quyền theo ID người ủy quyền và ID cuộc bầu cử thành công',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getDelegationsByDelegatorIdAndElectionId(
    @Param('delegatorId') delegatorId: string,
    @Param('electionId') electionId: string,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.getDelegatorIdAndElectionId(
        delegatorId,
        electionId,
      );
      return BaseResponse.success(
        resData,
        MESSAGE.DELEGATION_GET_BY_DELEGATOR_AND_ELECTION_SUCCESS,
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //Get By ElectionId
  @Get('election/:electionId')
  @ApiOperation({ summary: 'Lấy thông tin ủy quyền theo ID cuộc bầu cử' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin ủy quyền theo ID cuộc bầu cử thành công',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getDelegationsByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.getByElectionId(electionId);
      return BaseResponse.success(
        resData,
        MESSAGE.DELEGATION_GET_BY_ELECTION_SUCCESS,
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //Get By DelegateId
  @Get('delegate/users/:delegateId')
  @ApiOperation({ summary: 'Lấy thông tin ủy quyền theo ID người được ủy quyền' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin ủy quyền theo ID người được ủy quyền thành công',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getDelegationsByDelegateId(@Param('delegateId') delegateId: string): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.getByDelegate(delegateId);
      return BaseResponse.success(
        resData,
        MESSAGE.DELEGATION_GET_BY_DELEGATE_SUCCESS,
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('delegator/users/:delegatorId')
  @ApiOperation({ summary: 'Lấy thông tin ủy quyền theo ID người ủy quyền' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin ủy quyền theo ID người ủy quyền thành công',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getDelegationsByDelegatorId(
    @Param('delegatorId') delegatorId: string,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.getByDelegator(delegatorId);
      return BaseResponse.success(
        resData,
        MESSAGE.DELEGATION_GET_BY_DELEGATOR_SUCCESS,
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('status-active')
  @ApiOperation({ summary: 'Lấy danh sách ủy quyền theo trạng thái' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách ủy quyền theo trạng thái thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getDelegationsByStatus(): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.getStatusActive();
      return BaseResponse.success(resData, MESSAGE.DELEGATION_GET_BY_STATUS_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //Get Delegations has status=pending
  @Get('pending')
  @ApiOperation({ summary: 'Lấy danh sách ủy quyền cần xác minh ' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách ủy quyền cần xác minh thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getDelegationsStatusPending(): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.getDelegationsPending();
      return BaseResponse.success(resData, MESSAGE.DELEGATION_GET_PENDING_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //Get by DelegationId
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin ủy quyền theo ID' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin ủy quyền theo ID thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getDelegationsById(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.getById(id);
      return BaseResponse.success(resData, MESSAGE.DELEGATION_GET_BY_ID_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới ủy quyền' })
  @ApiResponse({ status: 201, description: 'Tạo ủy quyền thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async create(
    @Body() createDelegation: CreateDelegationDto,
    @Req() req: CustomRequest,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.create(createDelegation, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.DELEGATION_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
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
    @Req() req: CustomRequest,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.delegationsService.update(id, updateDelegation, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.DELEGATION_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({ summary: 'Lấy tổng hợp dữ liệu ủy quyền của tất cả cuộc bầu cử' })
  @ApiResponse({ status: 200, description: 'Lấy tổng hợp dữ liệu tất cả ủy quyền thành công' })
  @ApiResponse({ status: 500, description: 'Dữ liệu không hợp lệ' })
  @Post('summary/preside/all')
  async getSummaryAll(@Body() req: DelegationDto) {
    const resData = await this.delegationsService.getSummaryDelegatesForChair(req);
    return BaseResponse.success(resData, MESSAGE.SUCCESS, HttpStatus.OK);
  }

  @ApiOperation({ summary: 'Lấy chi tiết tổng hợp ủy quyền theo cuộc bầu cử' })
  @ApiResponse({ status: 200, description: 'Lấy tổng hợp dữ liệu ủy quyền thành công' })
  @ApiResponse({ status: 500, description: 'Dữ liệu không hợp lệ' })
  @Post('summary/pdf')
  async getDelegationPdf(@Body() req: DelegationDto, @Res() res: Response) {
    const pdfBuffer = await this.delegationsService.generateDelegationPdf(
      req.secretaryId,
      req.recipient,
      req.electionId,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="bao-cao-uy-quyen.pdf"',
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Post(`${METHOD.APPROVE}`)
  @UseInterceptors(FileInterceptor('file'))
  async approveDelegation(
    @UploadedFile() fileP12: Express.Multer.File,
    @Body('electionId') electionId: string,
    @Body('password') password: string,
    @Req() req: CustomRequest,
  ) {
    try {
      const resData = await this.delegationsService.approvedAndSign(fileP12, req.user.sub, electionId, password);
      return BaseResponse.success(
        resData,
        'Duyệt và ký thành công tổng hợp dữ liệu ủy quyền!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
