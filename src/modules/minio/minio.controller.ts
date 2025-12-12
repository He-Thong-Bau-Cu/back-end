import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBody, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MinioService } from './minio.service';
import { FileType } from '../../common/enums/file-type.enum';
import { FileResponseDto } from './dto/fileResponse.dto';
import { Response } from 'express';
import { BaseResponse } from '../../common/dto/base-response.dto';
import { MESSAGE_STATUS } from '../../common/enums/status.enum';

@ApiBearerAuth('access-token')
@ApiTags('MinIO - File Management')
@Controller('minio')
export class MinioController {
  constructor(private readonly minioService: MinioService) { }

  @ApiOperation({ summary: 'Upload file to MinIO' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        fileType: {
          type: 'string',
          enum: Object.values(FileType),
          description: 'Type of file (election-documents, profile-images, etc.)',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
        isSignFile: {
          type: 'boolean',
          description: 'Whether this is a signed file',
          default: false,
        },
      },
      required: ['file', 'fileType', 'userId'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File uploaded successfully',
    type: FileResponseDto,
  })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('fileType') fileType: FileType,
    @Body('userId') userId: string,
    @Body('isSignFile') isSignFile?: string,
    @Body('fileHash') fileHash?: string,
  ) {
    try {
      if (!file) {
        throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
      }

      if (!fileType || !Object.values(FileType).includes(fileType as FileType)) {
        throw new HttpException('Invalid file type', HttpStatus.BAD_REQUEST);
      }

      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const isSigned = isSignFile === 'true' || isSignFile === '1';

      const result = await this.minioService.uploadFile(
        fileType as FileType,
        userId,
        file,
        isSigned,
        fileHash,
      );

      return BaseResponse.success(result, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Get file from MinIO' })
  @ApiParam({ name: 'fileType', enum: FileType, description: 'Type of file' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'fileName', description: 'File name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File retrieved successfully',
  })
  @Get('file/:fileType/:userId/:fileName')
  async getFile(
    @Param('fileType') fileType: FileType,
    @Param('userId') userId: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    try {
      const fileData = await this.minioService.getFile(fileType, userId, fileName);

      res.set({
        'Content-Type': fileData.contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileData.length.toString(),
      });

      fileData.stream.pipe(res);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Get file buffer from MinIO' })
  @ApiParam({ name: 'fileType', enum: FileType, description: 'Type of file' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'fileName', description: 'File name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File buffer retrieved successfully',
  })
  @Get('buffer/:fileType/:userId/:fileName')
  async getFileBuffer(
    @Param('fileType') fileType: FileType,
    @Param('userId') userId: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    try {
      const buffer = await this.minioService.getFileBuffer(fileType, userId, fileName);

      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      });

      res.send(buffer);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Get presigned URL for file access' })
  @ApiParam({ name: 'fileType', enum: FileType, description: 'Type of file' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'fileName', description: 'File name' })
  @ApiQuery({ name: 'expiresIn', required: false, type: Number, description: 'Expiration time in seconds (default: 3600)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Presigned URL generated successfully',
  })
  @Get('url/:fileType/:userId/:fileName')
  async getPresignedUrl(
    @Param('fileType') fileType: FileType,
    @Param('userId') userId: string,
    @Param('fileName') fileName: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    try {
      const url = await this.minioService.getPresignedUrl(
        fileType,
        userId,
        fileName,
        expiresIn || 3600,
      );

      return BaseResponse.success({ url }, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'List all files for a user in a specific file type' })
  @ApiParam({ name: 'fileType', enum: FileType, description: 'Type of file' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Files listed successfully',
    type: [FileResponseDto],
  })
  @Get('list/:fileType/:userId')
  async listFiles(
    @Param('fileType') fileType: FileType,
    @Param('userId') userId: string,
  ) {
    try {
      const files = await this.minioService.listFiles(fileType, userId);

      return BaseResponse.success(files, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Check if file exists' })
  @ApiParam({ name: 'fileType', enum: FileType, description: 'Type of file' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'fileName', description: 'File name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File existence checked',
  })
  @Get('exists/:fileType/:userId/:fileName')
  async fileExists(
    @Param('fileType') fileType: FileType,
    @Param('userId') userId: string,
    @Param('fileName') fileName: string,
  ) {
    try {
      const exists = await this.minioService.fileExists(fileType, userId, fileName);

      return BaseResponse.success({ exists }, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Delete file from MinIO' })
  @ApiParam({ name: 'fileType', enum: FileType, description: 'Type of file' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'fileName', description: 'File name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File deleted successfully',
  })
  @Delete('file/:fileType/:userId/:fileName')
  async deleteFile(
    @Param('fileType') fileType: FileType,
    @Param('userId') userId: string,
    @Param('fileName') fileName: string,
  ) {
    try {
      await this.minioService.deleteFile(fileType, userId, fileName);

      return BaseResponse.success(
        { message: 'File deleted successfully' },
        MESSAGE_STATUS.SUCCESS,
        HttpStatus.OK,
      );
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Get file by full key' })
  @ApiQuery({ name: 'key', description: 'Full file key (path)', required: true })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File retrieved successfully',
  })
  @Get('key')
  async getFileByKey(@Query('key') key: string, @Res() res: Response) {
    try {
      const fileData = await this.minioService.getFileByKey(key);

      res.set({
        'Content-Type': fileData.contentType,
        'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`,
        'Content-Length': fileData.length.toString(),
      });

      fileData.stream.pipe(res);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Get presigned URL by full key' })
  @ApiQuery({ name: 'key', description: 'Full file key (path)', required: true })
  @ApiQuery({ name: 'expiresIn', required: false, type: Number, description: 'Expiration time in seconds (default: 3600)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Presigned URL generated successfully',
  })
  @Get('url/key')
  async getPresignedUrlByKey(
    @Query('key') key: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    try {
      const url = await this.minioService.getPresignedUrlByKey(key, expiresIn || 3600);

      return BaseResponse.success({ url }, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Upload profile image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['file', 'userId'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile image uploaded successfully',
    type: FileResponseDto,
  })
  @Post('profile-image/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
  ) {
    try {
      if (!file) {
        throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
      }

      if (!userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const result = await this.minioService.uploadProfileImage(userId, file);

      return BaseResponse.success(result, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Get profile image URL' })
  @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
  @ApiQuery({ name: 'imageKey', required: true, description: 'Image key (saved in user.image field)' })
  @ApiQuery({ name: 'expiresIn', required: false, type: Number, description: 'Expiration time in seconds (default: 7 days)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile image URL generated successfully',
  })
  @Get('profile-image/url')
  async getProfileImageUrl(
    @Query('userId') userId: string,
    @Query('imageKey') imageKey: string,
    @Query('expiresIn') expiresIn?: number,
  ) {
    try {
      const url = await this.minioService.getProfileImageUrl(userId, imageKey, expiresIn);

      if (!url) {
        throw new HttpException('Image not found', HttpStatus.NOT_FOUND);
      }

      return BaseResponse.success({ url }, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Check file hash to detect duplicate files' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fileHash: {
          type: 'string',
          description: 'SHA-256 hash of the file',
        },
        fileType: {
          type: 'string',
          description: 'Type of file (election-documents, election-entities)',
        },
        electionId: {
          type: 'string',
          description: 'Election ID (optional)',
        },
      },
      required: ['fileHash', 'fileType'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'File hash checked successfully',
  })
  @Post('check-hash')
  async checkFileHash(
    @Body('fileHash') fileHash: string,
    @Body('fileType') fileType: string,
    @Body('electionId') electionId?: string,
  ) {
    try {
      if (!fileHash) {
        throw new HttpException('File hash is required', HttpStatus.BAD_REQUEST);
      }

      if (!fileType) {
        throw new HttpException('File type is required', HttpStatus.BAD_REQUEST);
      }

      const result = await this.minioService.checkFileHash(fileHash, fileType, electionId);

      return BaseResponse.success(result, MESSAGE_STATUS.SUCCESS, HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
