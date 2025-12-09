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
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { Response } from 'express';
import { MESSAGE } from 'src/common/enums/message.enum';
import { ElectionsService } from './elections.service';
import { METHOD } from 'src/common/enums/method.enum';
import { ElectionsDocumentDto } from './dto/electionsDocument.dto';
import { CreateElectionDto } from './dto/create-elections-dto';
import { CreateElectionRequestDto } from './dto/create-election-request.dto';
import { SearchDTO } from 'src/common/dto/search.dto';
import { UpdateElectionDto } from './dto/update-elections-dto';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { ElectionDto } from './dto/election.dto';
import { BulkSaveDraftDto } from './dto/bulk-save-draft-dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiBearerAuth('access-token')
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
  async searchElections(@Body() req: SearchDTO & { electionId?: string }): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.searchElections(req);
      return BaseResponse.success(resData, MESSAGE.ELECTION_SEARCH_SUCCESS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/draft-data')
  @ApiOperation({ summary: 'Lấy dữ liệu draft của cuộc bầu cử' })
  @ApiParam({ name: 'id', description: 'ID của cuộc bầu cử', type: String })
  @ApiResponse({ status: 200, description: 'Lấy dữ liệu election thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getDraftData(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.getDraftData(id);
      return BaseResponse.success(resData, 'Lấy dữ liệu election thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id/voters-from-excel')
  @ApiOperation({ summary: 'Lấy danh sách cử tri từ file Excel đã import' })
  @ApiParam({ name: 'id', description: 'ID của cuộc bầu cử', type: String })
  @ApiResponse({ status: 200, description: 'Lấy danh sách cử tri từ Excel thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy file Excel hoặc cuộc bầu cử' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getVotersFromExcel(@Param('id') id: string): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.getVotersFromExcel(id);
      return BaseResponse.success(
        resData,
        'Lấy danh sách cử tri từ Excel thành công',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
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
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(`${METHOD.UPDATE}/:id`)
  @ApiOperation({ summary: 'Cập nhật thông tin kỳ bầu cử' })
  @ApiParam({ name: 'id', description: 'ID của kỳ bầu cử', type: String })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async updateElections(
    @Req() req: CustomRequest,
    @Param('id') id: string,
    @Body() body: UpdateElectionDto,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.updateElections(id, body, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.ELECTION_UPDATE_SUCCESS, HttpStatus.OK);
    } catch (e) {
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
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
      throw new HttpException({ message: e.message }, HttpStatus.INTERNAL_SERVER_ERROR);
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
  @ApiOperation({ summary: 'Tạo mới cuộc bầu cử' })
  @ApiResponse({ status: 200, description: 'Tạo mới cuộc bầu cử thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async createElection(
    @Req() req: CustomRequest,
    @Body() createElection: CreateElectionDto,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.createElection(createElection, req.user.sub);
      return BaseResponse.success(resData, MESSAGE.ELECTION_CREATE_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('user-request')
  @ApiOperation({ summary: 'Tạo yêu cầu cuộc bầu cử mới từ user (đề xuất cho chủ tịch hội đồng quản trị duyệt)' })
  @ApiResponse({ status: 201, description: 'Tạo yêu cầu cuộc bầu cử thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async createElectionRequest(
    @Req() req: CustomRequest,
    @Body() createElectionRequest: CreateElectionRequestDto,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.createElectionRequest(createElectionRequest, req.user.sub);
      return BaseResponse.success(resData, 'Tạo yêu cầu cuộc bầu cử thành công', HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('user-organizer')
  @ApiOperation({ summary: 'Lấy danh sách user để phân quyền cho cuộc bầu cử (không có trong bảng voter)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getElectionOrganizer(): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.getElectionOrganizerByTime(
        new Date(),
        new Date(),
      );
      return BaseResponse.success(resData, MESSAGE.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('my-requests')
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu tạo cuộc bầu cử của user (theo createBy và isUserCreate = true)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getMyElectionRequests(
    @Req() req: CustomRequest,
    @Body() searchDto: SearchDTO,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.getMyElectionRequests(req.user.sub, searchDto);
      return BaseResponse.success(resData, MESSAGE.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('user-voter/valid')
  @ApiOperation({ summary: 'Lấy danh sách user để nhập dữ liệu cử tri' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getuserVoterValid(): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.getUserIsVoter();
      return BaseResponse.success(resData, MESSAGE.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('bulk-save-draft')
  @ApiOperation({ summary: 'Lưu nháp hoặc gửi duyệt tài liệu bầu cử (tổng hợp)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async bulkSaveDraft(
    @Req() req: CustomRequest,
    @Body() body: BulkSaveDraftDto,
  ): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.bulkSaveDraft(body, req.user.sub);
      return BaseResponse.success(resData, resData.message, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(`${METHOD.APPROVE}`)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Duyệt và ký quyết định cuộc bầu cử' })
  @ApiResponse({ status: 200, description: 'Duyệt và ký thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async approveElection(
    @UploadedFile() fileP12: Express.Multer.File,
    @Body('electionId') electionId: string,
    @Body('password') password: string,
    @Req() req: CustomRequest,
  ) {
    try {
      const resData = await this.electionsService.approveAndSign(
        fileP12,
        electionId,
        password,
        req.user.sub,
      );
      return BaseResponse.success(
        resData,
        'Duyệt và ký thành công cuộc họp!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(`${METHOD.REJECT}`)
  @ApiOperation({ summary: 'Từ chối cuộc bầu cử' })
  @ApiResponse({ status: 200, description: 'Từ chối thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async rejectElection(
    @Body('electionId') electionId: string,
    @Body('rejectReason') rejectReason: string,
  ) {
    try {
      if (!rejectReason || !rejectReason.trim()) {
        throw new HttpException(
          { message: 'Vui lòng nhập lý do từ chối!' },
          HttpStatus.BAD_REQUEST,
        );
      }
      const resData = await this.electionsService.rejectElection(electionId, rejectReason);
      return BaseResponse.success(
        resData,
        'Từ chối cuộc bầu cử thành công!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('requests-for-approval')
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu cuộc bầu cử cần phê duyệt (isUserBasicCreate = true). Có thể truyền electionId để lấy theo cuộc bầu cử cụ thể' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getElectionRequestsForApproval(
    @Body() searchDto: SearchDTO & { electionId?: string },
  ): Promise<BaseResponse> {
    try {
      const { electionId, ...searchParams } = searchDto;
      const resData = await this.electionsService.getElectionRequestsForApproval(searchParams, electionId);
      return BaseResponse.success(resData, MESSAGE.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('approve-request')
  @ApiOperation({ summary: 'Duyệt yêu cầu cuộc bầu cử từ user (chuyển statusData thành WAIT_ENTER_DATA)' })
  @ApiResponse({ status: 200, description: 'Duyệt thành công' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async approveElectionRequest(
    @Req() req: CustomRequest,
    @Body() body: { electionId: string; secretaryId?: string; boardOfControlId?: string },
  ): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.approveElectionRequest(
        body.electionId,
        req.user.sub,
        body.secretaryId,
        body.boardOfControlId,
      );
      return BaseResponse.success(
        resData,
        'Duyệt yêu cầu cuộc bầu cử thành công!',
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('preview-pdf/:electionId')
  @ApiOperation({ summary: 'Xem preview PDF quyết định cuộc bầu cử' })
  @ApiResponse({ status: 200, description: 'Trả về PDF file' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async previewPdf(@Param('electionId') electionId: string, @Res() res: Response): Promise<void> {
    try {
      const pdfBuffer = await this.electionsService.previewElectionDecisionPdf(electionId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="preview-${electionId}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':electionId/end-voting-stage')
  @ApiOperation({ summary: 'Kết thúc giai đoạn bỏ phiếu' })
  @ApiResponse({ status: 200, description: 'Giai đoạn bỏ phiếu đã được kết thúc thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc bầu cử.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async endVotingStage(
    @Param('electionId') electionId: string,
    @Req() req: CustomRequest
  ): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.endVotingStage(electionId, req.user.sub);
      return BaseResponse.success(resData, 'Kết thúc giai đoạn bỏ phiếu thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':electionId/stages/:stage/start')
  @ApiOperation({ summary: 'Bắt đầu một giai đoạn' })
  @ApiResponse({ status: 200, description: 'Giai đoạn đã được bắt đầu thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc bầu cử.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async startStage(
    @Param('electionId') electionId: string,
    @Param('stage') stage: string,
    @Req() req: CustomRequest
  ): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.startStage(electionId, stage, req.user.sub);
      return BaseResponse.success(resData, 'Bắt đầu giai đoạn thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':electionId/stages/:stage/end')
  @ApiOperation({ summary: 'Kết thúc một giai đoạn' })
  @ApiResponse({ status: 200, description: 'Giai đoạn đã được kết thúc thành công.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc bầu cử.' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async endStage(
    @Param('electionId') electionId: string,
    @Param('stage') stage: string,
    @Req() req: CustomRequest
  ): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.endStage(electionId, stage, req.user.sub);
      return BaseResponse.success(resData, 'Kết thúc giai đoạn thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':electionId/current-stage')
  @ApiOperation({ summary: 'Lấy giai đoạn hiện tại của cuộc bầu cử' })
  @ApiParam({ name: 'electionId', description: 'ID của cuộc bầu cử', type: String })
  @ApiResponse({ status: 200, description: 'Lấy thông tin giai đoạn hiện tại thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc bầu cử' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async getCurrentStage(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try {
      const resData = await this.electionsService.getCurrentStage(electionId);
      return BaseResponse.success(resData, 'Lấy thông tin giai đoạn hiện tại thành công', HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
