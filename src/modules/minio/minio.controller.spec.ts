import { Test, TestingModule } from '@nestjs/testing';
import { MinioController } from './minio.controller';
import { MinioService } from './minio.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { FileType } from '../../common/enums/file-type.enum';
import { Response } from 'express';

describe('MinioController', () => {
  let controller: MinioController;
  let service: MinioService;

  const mockService = {
    uploadFile: jest.fn(),
    getFile: jest.fn(),
    getFileBuffer: jest.fn(),
    getPresignedUrl: jest.fn(),
    listFiles: jest.fn(),
    fileExists: jest.fn(),
    deleteFile: jest.fn(),
    getFileByKey: jest.fn(),
    getPresignedUrlByKey: jest.fn(),
    uploadProfileImage: jest.fn(),
    getProfileImageUrl: jest.fn(),
  };

  const mockRes = () => {
    const res: Partial<Response> = {};
    res.set = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.status = jest.fn().mockReturnValue(res);
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MinioController],
      providers: [
        { provide: MinioService, useValue: mockService }
      ]
    }).compile();

    controller = module.get<MinioController>(MinioController);
    service = module.get<MinioService>(MinioService);

    jest.clearAllMocks();
  });

  // ===========================================
  // 1. UPLOAD FILE
  // ===========================================
  describe('uploadFile', () => {
    const mockFile = {
      originalname: 'test.pdf',
      buffer: Buffer.from('123'),
    } as Express.Multer.File;

    it('should upload file successfully', async () => {
      mockService.uploadFile.mockResolvedValue({ path: 'abc/test.pdf' });

      const result = await controller.uploadFile(
        mockFile,
        FileType.ELECTION_DOCUMENT,
        'U1',
        'false',
      );

      expect(service.uploadFile).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should throw if file missing', async () => {
      await expect(
        controller.uploadFile(null as any, FileType.ELECTION_DOCUMENT, 'U1')
      ).rejects.toThrow(HttpException);
    });

    it('should throw if invalid fileType', async () => {
      // @ts-ignore
      await expect(controller.uploadFile(mockFile, 'xxx', 'U1')).rejects.toThrow();
    });
  });

  // ===========================================
  // 2. GET FILE STREAM
  // ===========================================
  describe('getFile', () => {
    it('should stream file', async () => {
      const streamMock = { pipe: jest.fn() };
      mockService.getFile.mockResolvedValue({
        contentType: 'application/pdf',
        length: 100,
        stream: streamMock,
      });

      const res = mockRes();

      await controller.getFile(
        FileType.ELECTION_DOCUMENT,
        'U1',
        'abc.pdf',
        res
      );

      expect(streamMock.pipe).toHaveBeenCalledWith(res);
    });
  });

  // ===========================================
  // 3. GET FILE BUFFER
  // ===========================================
  describe('getFileBuffer', () => {
    it('should return buffer', async () => {
      const buffer = Buffer.from('123456');
      mockService.getFileBuffer.mockResolvedValue(buffer);

      const res = mockRes();

      await controller.getFileBuffer(FileType.PROFILE_IMAGE, 'U1', 'img.jpg', res);

      expect(res.send).toHaveBeenCalledWith(buffer);
    });
  });

  // ===========================================
  // 4. GET PRESIGNED URL
  // ===========================================
  describe('getPresignedUrl', () => {
    it('should return presigned url', async () => {
      mockService.getPresignedUrl.mockResolvedValue('http://signed-url');

      const result = await controller.getPresignedUrl(
        FileType.PROFILE_IMAGE,
        'U1',
        'pic.png',
        3600
      );

      expect((result as any).data.url).toBe('http://signed-url');
    });
  });

  // ===========================================
  // 5. LIST FILES
  // ===========================================
  describe('listFiles', () => {
    it('should list files', async () => {
      mockService.listFiles.mockResolvedValue([{ name: 'a.pdf' }]);

      const result = await controller.listFiles(FileType.PROFILE_IMAGE, 'U1');

      expect((result as any).data.length).toBe(1);
    });
  });

  // ===========================================
  // 6. FILE EXISTS
  // ===========================================
  describe('fileExists', () => {
    it('should return exists true', async () => {
      mockService.fileExists.mockResolvedValue(true);

      const result = await controller.fileExists(
        FileType.PROFILE_IMAGE,
        'U1',
        'a.pdf'
      ) as any;

      expect(result.data.exists).toBe(true);
    });
  });

  // ===========================================
  // 7. DELETE FILE
  // ===========================================
  describe('deleteFile', () => {
    it('should delete file', async () => {
      mockService.deleteFile.mockResolvedValue(true);

      const result = await controller.deleteFile(
        FileType.ELECTION_DOCUMENT,
        'U1',
        'remove.doc'
      );

      expect(service.deleteFile).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  // ===========================================
  // 8. GET FILE BY KEY
  // ===========================================
  describe('getFileByKey', () => {
    it('should stream file by key', async () => {
      const streamMock = { pipe: jest.fn() };

      mockService.getFileByKey.mockResolvedValue({
        contentType: 'image/png',
        length: 200,
        stream: streamMock,
      });

      const res = mockRes();

      await controller.getFileByKey('profile/U1/abc.png', res);

      expect(streamMock.pipe).toHaveBeenCalledWith(res);
    });
  });

  // ===========================================
  // 9. GET PRESIGNED URL BY KEY
  // ===========================================
  describe('getPresignedUrlByKey', () => {
    it('should return url', async () => {
      mockService.getPresignedUrlByKey.mockResolvedValue('http://signed-key-url');

      const result = await controller.getPresignedUrlByKey('profile/U1/a.png', 200);

      expect((result as any).data.url).toBe('http://signed-key-url');
    });
  });

  // ===========================================
  // 10. UPLOAD PROFILE IMAGE
  // ===========================================
  describe('uploadProfileImage', () => {
    const mockFile = {
      buffer: Buffer.from('aaa'),
      originalname: 'a.png',
    } as Express.Multer.File;

    it('should upload profile image', async () => {
      mockService.uploadProfileImage.mockResolvedValue({ key: 'x/y.png' });

      const result = await controller.uploadProfileImage(mockFile, 'U1');

      expect(service.uploadProfileImage).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should throw if file missing', async () => {
      await expect(controller.uploadProfileImage(null as any, 'U1')).rejects.toThrow();
    });
  });

  // ===========================================
  // 11. GET PROFILE IMAGE URL
  // ===========================================
  describe('getProfileImageUrl', () => {
    it('should return url', async () => {
      mockService.getProfileImageUrl.mockResolvedValue('http://img-url');

      const result = await controller.getProfileImageUrl('U1', 'x.png', 1000);

      expect((result as any).data.url).toBe('http://img-url');
    });

    it('should throw if url not found', async () => {
      mockService.getProfileImageUrl.mockResolvedValue(null);

      await expect(
        controller.getProfileImageUrl('U1', 'notfound.png')
      ).rejects.toThrow(HttpException);
    });
  });
});
