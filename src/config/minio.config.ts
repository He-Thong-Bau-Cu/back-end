import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

// Factory function để tạo S3Client với ConfigService
export function createS3Client(configService: ConfigService): S3Client {
  const endpoint = configService.get<string>('MINIO_ENDPOINT') || 'http://localhost:9000';
  const accessKeyId = configService.get<string>('MINIO_USERNAME');
  const secretAccessKey = configService.get<string>('MINIO_PASSWORD');

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('MINIO_USERNAME và MINIO_PASSWORD phải được cấu hình trong .env file');
  }

  return new S3Client({
    region: 'us-east-1',
    endpoint: endpoint,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    forcePathStyle: true,
  });
}

// Fallback cho trường hợp không có ConfigService (sẽ được thay thế)
export const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: process.env.MINIO_USERNAME || 'minioadmin',
    secretAccessKey: process.env.MINIO_PASSWORD || 'minioadmin',
  },
  forcePathStyle: true,
});
