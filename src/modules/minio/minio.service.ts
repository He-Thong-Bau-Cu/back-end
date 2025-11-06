import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';
import { Express } from 'express';
import { Readable } from 'stream';
import { FileResponseDto } from './dto/fileResponse.dto';
import { ConfigService } from '@nestjs/config';
import { FileType } from '../../common/enums/file-type.enum';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { decryptBuffer, encryptBuffer } from '../../common/utils/encryption';

@Injectable()
export class MinioService {
  private bucketName: string;
  private readonly minioEndpoint: string;
  private readonly encryptionKey: string;
  private readonly s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get('MINIO_BUCKET_NAME') || 'election-system';
    this.minioEndpoint = this.configService.get('MINIO_ENDPOINT') || 'http://localhost:9000';
    this.encryptionKey = this.configService.get('ENCRYPTION_KEY') || 'keysecret123';

    // Tạo S3Client với ConfigService
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT') || 'http://localhost:9000';
    const accessKeyId = this.configService.get<string>('MINIO_USERNAME');
    const secretAccessKey = this.configService.get<string>('MINIO_PASSWORD');

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('MINIO_USERNAME và MINIO_PASSWORD phải được cấu hình trong .env file');
    }

    this.s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: endpoint,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  /**
   * Generate file path based on file type and user ID
   * Format: {fileType}/{userId}/{fileName}
   */
  private generateFilePath(fileType: FileType, userId: string, fileName: string): string {
    // Sanitize fileName to prevent path traversal
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `${fileType}/${userId}/${sanitizedFileName}`;
  }

  /**
   * Generate unique file name with UUID
   */
  private generateUniqueFileName(originalName: string): string {
    return `${uuid()}-${originalName}`;
  }

  /**
   * Upload file to MinIO with encryption
   * @param fileType - Type of file (enum FileType)
   * @param userId - User ID
   * @param file - Express.Multer.File
   * @param isSignFile - Whether this is a signed file (optional)
   * @returns FileResponseDto with file information
   */
  async uploadFile(
    fileType: FileType,
    userId: string,
    file: Express.Multer.File,
    isSignFile = false,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    let key: string;
    const uniqueFileName = this.generateUniqueFileName(file.originalname);

    if (isSignFile) {
      // For signed files, use special prefix
      key = this.generateFilePath(FileType.SIGNED_DOCUMENT, userId, uniqueFileName);
    } else {
      // Normal file upload
      key = this.generateFilePath(fileType, userId, uniqueFileName);
    }

    // Encrypt file buffer
    const encryptedBuffer = encryptBuffer(file.buffer, this.encryptionKey);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: encryptedBuffer,
      ContentType: file.mimetype,
      Metadata: {
        'original-name': file.originalname,
        'content-type': file.mimetype,
        'file-size': file.size.toString(),
        'encrypted': 'true',
        'user-id': userId,
        'file-type': fileType,
      },
    });

    await this.s3Client.send(command);

    return new FileResponseDto({
      key,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadDate: new Date(),
      url: `${this.minioEndpoint}/${this.bucketName}/${key}`,
    });
  }

  /**
   * Upload signed PDF buffer
   * @param fileType - Type of file (enum FileType)
   * @param userId - User ID
   * @param key - File key (path)
   * @param signedPdfBytes - Signed PDF bytes
   * @returns boolean indicating success
   */
  async uploadSignedPdf(
    fileType: FileType,
    userId: string,
    key: string,
    signedPdfBytes: Uint8Array,
  ): Promise<boolean> {
    const encryptedBuffer = encryptBuffer(Buffer.from(signedPdfBytes), this.encryptionKey);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: encryptedBuffer,
      ContentType: 'application/pdf',
      Metadata: {
        encrypted: 'true',
        'user-id': userId,
        'file-type': fileType,
      },
    });

    const response = await this.s3Client.send(command);
    if (response.ETag) {
      console.log(`✅ File ghi đè thành công (đã mã hóa): ${key}, ETag: ${response.ETag}`);
      return true;
    }
    console.error(`❌ Upload không trả về ETag: ${key}`);
    return false;
  }

  /**
   * Delete file from MinIO
   * @param fileType - Type of file (enum FileType)
   * @param userId - User ID
   * @param fileName - File name (without path)
   */
  async deleteFile(fileType: FileType, userId: string, fileName: string): Promise<void> {
    const key = this.generateFilePath(fileType, userId, fileName);

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Delete file by full key
   * @param key - Full file key (path)
   */
  async deleteFileByKey(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Get file as stream
   * @param fileType - Type of file (enum FileType)
   * @param userId - User ID
   * @param fileName - File name (without path)
   * @returns Object with stream, contentType, and length
   */
  async getFile(
    fileType: FileType,
    userId: string,
    fileName: string,
  ): Promise<{ stream: Readable; contentType: string; length: number }> {
    const buffer = await this.getFileBuffer(fileType, userId, fileName);
    const stream = Readable.from(buffer);
    const contentType = this.getMimeType(fileName);
    const length = buffer.length;

    return {
      stream,
      contentType,
      length,
    };
  }

  /**
   * Get file by full key
   * @param key - Full file key (path)
   * @returns Object with stream, contentType, and length
   */
  async getFileByKey(key: string): Promise<{ stream: Readable; contentType: string; length: number }> {
    const buffer = await this.getFileBufferByKey(key);
    const stream = Readable.from(buffer);
    const contentType = this.getMimeType(key);
    const length = buffer.length;

    return {
      stream,
      contentType,
      length,
    };
  }

  /**
   * Get file buffer (decrypted)
   * @param fileType - Type of file (enum FileType)
   * @param userId - User ID
   * @param fileName - File name (without path)
   * @returns Decrypted file buffer
   */
  async getFileBuffer(fileType: FileType, userId: string, fileName: string): Promise<Buffer> {
    const key = this.generateFilePath(fileType, userId, fileName);
    return this.getFileBufferByKey(key);
  }

  /**
   * Get file buffer by full key (decrypted)
   * @param key - Full file key (path)
   * @returns Decrypted file buffer
   */
  async getFileBufferByKey(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

      const data = await this.s3Client.send(command);

    if (!data.Body) throw new NotFoundException('No file data received');

    const chunks: Buffer[] = [];
    for await (const chunk of data.Body as any) {
      chunks.push(chunk as Buffer);
    }
    const encryptedBuffer = Buffer.concat(chunks);

    return decryptBuffer(encryptedBuffer, this.encryptionKey);
  }

  /**
   * Get presigned URL for file access
   * @param fileType - Type of file (enum FileType)
   * @param userId - User ID
   * @param fileName - File name (without path)
   * @param expiresInSeconds - URL expiration time in seconds (default: 3600)
   * @returns Presigned URL
   */
  async getPresignedUrl(
    fileType: FileType,
    userId: string,
    fileName: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    const key = this.generateFilePath(fileType, userId, fileName);
    return this.getPresignedUrlByKey(key, expiresInSeconds);
  }

  /**
   * Get presigned URL by full key
   * @param key - Full file key (path)
   * @param expiresInSeconds - URL expiration time in seconds (default: 3600)
   * @returns Presigned URL
   */
  async getPresignedUrlByKey(key: string, expiresInSeconds = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });

      return url;
    } catch (e) {
      throw new BadRequestException(`Failed to generate presigned URL: ${e.message}`);
    }
  }

  /**
   * List all files for a user in a specific file type
   * @param fileType - Type of file (enum FileType)
   * @param userId - User ID
   * @returns Array of FileResponseDto
   */
  async listFiles(fileType: FileType, userId: string): Promise<FileResponseDto[]> {
    const prefix = `${fileType}/${userId}/`;

    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: prefix,
    });

    const response = await this.s3Client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    const files: FileResponseDto[] = [];

    for (const object of response.Contents) {
      if (!object.Key) continue;

      try {
        const headCommand = new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: object.Key,
        });

        const headResponse = await this.s3Client.send(headCommand);

        files.push(
          new FileResponseDto({
            key: object.Key,
            originalName: headResponse.Metadata?.['original-name'] || object.Key.split('/').pop() || '',
            mimeType: headResponse.ContentType || 'application/octet-stream',
            size: object.Size || 0,
            uploadDate: object.LastModified || new Date(),
            url: `${this.minioEndpoint}/${this.bucketName}/${object.Key}`,
          }),
        );
      } catch (error) {
        console.error(`Failed to get metadata for ${object.Key}:`, error);
      }
    }

    return files;
  }

  /**
   * Check if file exists
   * @param fileType - Type of file (enum FileType)
   * @param userId - User ID
   * @param fileName - File name (without path)
   * @returns true if file exists, false otherwise
   */
  async fileExists(fileType: FileType, userId: string, fileName: string): Promise<boolean> {
    try {
      const key = this.generateFilePath(fileType, userId, fileName);

      const headCommand = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(headCommand);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
        return false;
      }
      throw new BadRequestException(`Failed to check file existence: ${error.message}`);
    }
  }

  /**
   * Upload profile image for user
   * @param userId - User ID
   * @param file - Express.Multer.File
   * @returns FileResponseDto with file information (key should be saved to user.image)
   */
  async uploadProfileImage(userId: string, file: Express.Multer.File): Promise<FileResponseDto> {
    return this.uploadFile(FileType.PROFILE_IMAGE, userId, file, false);
  }

  /**
   * Get profile image URL (presigned URL)
   * @param userId - User ID
   * @param imageKey - Image key (saved in user.image field)
   * @param expiresIn - URL expiration time in seconds (default: 7 days for profile images)
   * @returns Presigned URL or null if key is empty
   */
  async getProfileImageUrl(
    userId: string,
    imageKey: string | null | undefined,
    expiresIn: number = 7 * 24 * 3600, // 7 days
  ): Promise<string | null> {
    if (!imageKey) {
      return null;
    }

    try {
      // Nếu imageKey là full key (có chứa profile-images/userId/), dùng trực tiếp
      if (imageKey.includes('/')) {
        return await this.getPresignedUrlByKey(imageKey, expiresIn);
      }

      // Nếu chỉ là filename, tạo full path
      return await this.getPresignedUrl(FileType.PROFILE_IMAGE, userId, imageKey, expiresIn);
    } catch (error) {
      console.error('Error getting profile image URL:', error);
      return null;
    }
  }

  /**
   * Get profile image URL from key (helper method)
   * @param imageKey - Full image key (path)
   * @param expiresIn - URL expiration time in seconds (default: 7 days)
   * @returns Presigned URL or null
   */
  async getProfileImageUrlFromKey(
    imageKey: string | null | undefined,
    expiresIn: number = 7 * 24 * 3600, // 7 days
  ): Promise<string | null> {
    if (!imageKey) {
      return null;
    }

    try {
      return await this.getPresignedUrlByKey(imageKey, expiresIn);
    } catch (error) {
      console.error('Error getting profile image URL from key:', error);
      return null;
    }
  }

  /**
   * Delete old profile image before uploading new one
   * @param userId - User ID
   * @param oldImageKey - Old image key to delete
   */
  async deleteProfileImage(userId: string, oldImageKey?: string | null): Promise<void> {
    if (!oldImageKey) {
      return;
    }

    try {
      // Nếu oldImageKey là full key, dùng trực tiếp
      if (oldImageKey.includes('/')) {
        await this.deleteFileByKey(oldImageKey);
      } else {
        // Nếu chỉ là filename, dùng fileType và userId
        await this.deleteFile(FileType.PROFILE_IMAGE, userId, oldImageKey);
      }
    } catch (error) {
      // Log error nhưng không throw để không ảnh hưởng đến upload mới
      console.error('Error deleting old profile image:', error);
    }
  }

  /**
   * Get MIME type from file name
   */
  private getMimeType(key: string): string {
    const lowerKey = key.toLowerCase();
    if (lowerKey.endsWith('.pdf')) return 'application/pdf';
    if (lowerKey.endsWith('.png')) return 'image/png';
    if (lowerKey.endsWith('.jpg') || lowerKey.endsWith('.jpeg')) return 'image/jpeg';
    if (lowerKey.endsWith('.txt')) return 'text/plain';
    if (lowerKey.endsWith('.doc') || lowerKey.endsWith('.docx')) return 'application/msword';
    if (lowerKey.endsWith('.xls') || lowerKey.endsWith('.xlsx')) return 'application/vnd.ms-excel';
    return 'application/octet-stream';
  }
}
