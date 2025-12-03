import { Test, TestingModule } from "@nestjs/testing";
import { MinioService } from "./minio.service";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand
} from "@aws-sdk/client-s3";
import { FileType } from "../../common/enums/file-type.enum";
import { encryptBuffer, decryptBuffer } from "../../common/utils/encryption";
import { Readable } from "stream";

jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn().mockResolvedValue("https://presigned-url.com")
}));
jest.mock("../../common/utils/encryption", () => ({
  encryptBuffer: jest.fn((b) => b),
  decryptBuffer: jest.fn((b) => b)
}));

describe("MinioService", () => {
  let service: MinioService;
  let s3Client: S3Client;

  const mockConfig = {
    get: jest.fn((key) => {
      if (key === "MINIO_USERNAME") return "test";
      if (key === "MINIO_PASSWORD") return "secret";
      return "";
    }),
  };

  beforeEach(async () => {
    (S3Client as any).mockImplementation(() => ({
      send: jest.fn(),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MinioService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<MinioService>(MinioService);
    s3Client = (service as any).s3Client;
  });

  // ----------------------------------------
  // UPLOAD FILE
  // ----------------------------------------
  describe("uploadFile", () => {
    const mockFile: any = {
      originalname: "demo.pdf",
      buffer: Buffer.from("123"),
      mimetype: "application/pdf",
      size: 10,
    };

    it("should upload file successfully", async () => {
      (s3Client as any).send.mockResolvedValue({});

      const result = await service.uploadFile(
        FileType.ELECTION_DOCUMENT,
        "U1",
        mockFile
      );

      expect(s3Client.send).toHaveBeenCalled();
      expect(result.key).toContain("election-documents/U1/");
      expect(encryptBuffer).toHaveBeenCalled();
    });

    it("should throw if file missing", async () => {
      await expect(
        service.uploadFile(FileType.ELECTION_DOCUMENT, "U1", null as any)
      ).rejects.toThrow("File is required");
    });

    it("should throw if user missing", async () => {
      await expect(
        service.uploadFile(FileType.ELECTION_DOCUMENT, "", mockFile)
      ).rejects.toThrow("User ID is required");
    });
  });

  // ----------------------------------------
  // DELETE FILE
  // ----------------------------------------
  describe("deleteFile", () => {
    it("should delete file", async () => {
      (s3Client as any).send.mockResolvedValue({});

      await service.deleteFile(FileType.ELECTION_DOCUMENT, "U1", "demo.pdf");

      expect(s3Client.send).toHaveBeenCalledWith(expect.any(DeleteObjectCommand));
    });
  });

  // ----------------------------------------
  // GET FILE BUFFER
  // ----------------------------------------
  describe("getFileBuffer", () => {
    it("should return decrypted buffer", async () => {
      const mockStream = Readable.from([Buffer.from("abc")]);

      (s3Client as any).send.mockResolvedValue({ Body: mockStream });

      const result = await service.getFileBuffer(
        FileType.PROFILE_IMAGE,
        "U1",
        "img.png"
      );

      expect(decryptBuffer).toHaveBeenCalled();
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it("should throw for missing Body", async () => {
      (s3Client as any).send.mockResolvedValue({ Body: null });

      await expect(
        service.getFileBuffer(FileType.PROFILE_IMAGE, "U1", "x.png")
      ).rejects.toThrow("No file data received");
    });
  });

  // ----------------------------------------
  // GET FILE
  // ----------------------------------------
  describe("getFile", () => {
    it("should return stream file", async () => {
      const buffer = Buffer.from("123");
      const mockStream = Readable.from([buffer]);

      (s3Client as any).send.mockResolvedValue({ Body: mockStream });

      const result = await service.getFile(
        FileType.ELECTION_DOCUMENT,
        "U1",
        "a.pdf"
      );

      expect(result.stream).toBeDefined();
      expect(result.contentType).toBe("application/pdf");
    });
  });

  // ----------------------------------------
  // PRESIGNED URL
  // ----------------------------------------
  describe("getPresignedUrl", () => {
    it("should return presigned url", async () => {
      const url = await service.getPresignedUrl(
        FileType.PROFILE_IMAGE,
        "U1",
        "avatar.png"
      );

      expect(url).toBe("https://presigned-url.com");
    });
  });

  // ----------------------------------------
  // FILE EXISTS
  // ----------------------------------------
  describe("fileExists", () => {
    it("should return true when exists", async () => {
      (s3Client as any).send.mockResolvedValue({});

      const exists = await service.fileExists(
        FileType.PROFILE_IMAGE,
        "U1",
        "a.png"
      );

      expect(exists).toBe(true);
    });

    it("should return false for NotFound", async () => {
      (s3Client as any).send.mockRejectedValue({ name: "NotFound" });

      const exists = await service.fileExists(
        FileType.PROFILE_IMAGE,
        "U1",
        "a.png"
      );

      expect(exists).toBe(false);
    });
  });
});
