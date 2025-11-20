import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response, Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CustomRequest } from 'src/common/middleware/auth.middleware';
import { DataManagementService } from './data-management.service';
import { SearchBackupDto } from './dto/search-backup.dto';
import { ImportBackupDto } from './dto/import-backup.dto';
import { ExportBackupQueryDto } from './dto/export-backup.dto';

@ApiBearerAuth('access-token')
@ApiTags('Data Management')
@Controller('data-management')
export class DataManagementController {
  constructor(private readonly dataManagementService: DataManagementService) {}

  @Post('search')
  @ApiOperation({ summary: 'Tìm kiếm/hiển thị danh sách dữ liệu sao lưu' })
  @ApiResponse({ status: 200, description: MESSAGE.BACKUP_SEARCH_SUCCESS })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async searchBackups(@Body() body: SearchBackupDto) {
    try {
      const resData = await this.dataManagementService.searchBackups(body);
      return BaseResponse.success(resData, MESSAGE.BACKUP_SEARCH_SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Nhập dữ liệu từ file sao lưu' })
  @ApiResponse({ status: 201, description: MESSAGE.BACKUP_IMPORT_SUCCESS })
  @ApiResponse({ status: 400, description: 'Thiếu thông tin bắt buộc' })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async importBackup(
    @Body() body: ImportBackupDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: CustomRequest,
  ) {
    try {
      const userId = req.user?.sub;
      const resData = await this.dataManagementService.importBackup(body, file, userId);
      return BaseResponse.success(resData, MESSAGE.BACKUP_IMPORT_SUCCESS, HttpStatus.CREATED);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('export')
  @ApiOperation({ summary: 'Xuất danh sách dữ liệu sao lưu' })
  @ApiResponse({ status: 200, description: MESSAGE.BACKUP_EXPORT_SUCCESS })
  @ApiResponse({ status: 500, description: 'Lỗi server' })
  async exportBackup(@Query() query: ExportBackupQueryDto, @Res() res: Response) {
    try {
      const file = await this.dataManagementService.exportBackups(query);
      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.fileName}"`,
      });
      res.status(HttpStatus.OK).send(file.buffer);
    } catch (error) {
      throw new HttpException({ message: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

