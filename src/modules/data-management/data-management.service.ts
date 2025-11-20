import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Backups, BackupsDocument } from 'src/database/schemas/backups.schema';
import { SearchBackupDto } from './dto/search-backup.dto';
import { ImportBackupDto } from './dto/import-backup.dto';
import { paginate } from 'src/common/dto/paignation';
import { MinioService } from '../minio/minio.service';
import { FileType } from 'src/common/enums/file-type.enum';
import { ExportBackupQueryDto } from './dto/export-backup.dto';
import { FileResponseDto } from '../minio/dto/fileResponse.dto';
import { Express } from 'express';

interface ExportedBackupRecord {
  tableName: string;
  action: string;
  recordId?: number;
  actionBy?: string | null;
  filePath?: string | null;
  note?: string | null;
  createdAt: Date;
  dataBefore?: any;
  dataAfter?: any;
}

@Injectable()
export class DataManagementService {
  constructor(
    @InjectModel(Backups.name) private readonly backupModel: Model<BackupsDocument>,
    private readonly minioService: MinioService,
  ) {}

  async searchBackups(payload: SearchBackupDto) {
    const filter: Record<string, any> = {};

    if (payload.tableName) {
      filter.tableName = { $regex: payload.tableName, $options: 'i' };
    }

    if (payload.action) {
      filter.action = { $regex: payload.action, $options: 'i' };
    }

    if (payload.recordId) {
      filter.recordId = Number(payload.recordId);
    }

    if (payload.fromDate || payload.toDate) {
      filter.createdAt = {};
      if (payload.fromDate) filter.createdAt.$gte = new Date(payload.fromDate);
      if (payload.toDate) filter.createdAt.$lte = new Date(payload.toDate);
    }

    const query = this.backupModel
      .find(filter)
      .populate('actionBy', 'fullName email position')
      .sort({ createdAt: -1 });

    const data = await query.exec();
    return paginate(data, payload.page, payload.limit);
  }

  async importBackup(
    payload: ImportBackupDto,
    file: Express.Multer.File | undefined,
    userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('Thiếu thông tin người thực hiện thao tác');
    }

    if (!file) {
      throw new BadRequestException('Vui lòng đính kèm tệp dữ liệu để nhập');
    }

    const uploadResult = (await this.minioService.uploadFile(
      FileType.DATA_BACKUP,
      userId,
      file,
    )) as FileResponseDto;

    const normalizedPayload = {
      ...payload,
      dataBefore: this.parseJsonField(payload.dataBefore, 'dataBefore'),
      dataAfter: payload.dataAfter
        ? this.parseJsonField(payload.dataAfter, 'dataAfter')
        : this.tryParseFileContent(file),
    };

    const backup = await this.backupModel.create({
      tableName: normalizedPayload.tableName,
      action: (normalizedPayload.action || 'IMPORT').toUpperCase(),
      recordId: normalizedPayload.recordId ?? null,
      dataBefore: normalizedPayload.dataBefore,
      dataAfter: normalizedPayload.dataAfter,
      note: payload.note || null,
      filePath: uploadResult.key,
      actionBy: new Types.ObjectId(userId),
    });

    return backup.populate('actionBy', 'fullName email position');
  }

  async exportBackups(query: ExportBackupQueryDto) {
    const { fromDate, toDate } = this.resolveDateRange(query.fromDate, query.toDate);

    const filter: Record<string, any> = {};
    if (query.tableName) {
      filter.tableName = { $regex: query.tableName, $options: 'i' };
    }
    if (query.action) {
      filter.action = { $regex: query.action, $options: 'i' };
    }
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = fromDate;
      if (toDate) filter.createdAt.$lte = toDate;
    }

    const data = (await this.backupModel
      .find(filter)
      .populate('actionBy', 'fullName email')
      .sort({ createdAt: -1 })
      .lean<Backups[]>()) as Backups[];

    const mapped: ExportedBackupRecord[] = data.map((item) => ({
      tableName: item.tableName,
      action: item.action,
      recordId: item.recordId,
      actionBy:
        typeof item.actionBy === 'object' && item.actionBy
          ? ((item.actionBy as any).fullName as string) || (item.actionBy as any).email
          : null,
      filePath: item.filePath,
      note: item.note,
      createdAt: item.createdAt,
      dataBefore: item.dataBefore,
      dataAfter: item.dataAfter,
    }));

    if (query.format === 'json') {
      return {
        buffer: Buffer.from(JSON.stringify(mapped, null, 2), 'utf-8'),
        mimeType: 'application/json',
        fileName: `data-backups-${Date.now()}.json`,
      };
    }

    const csv = this.buildCsv(mapped);
    return {
      buffer: Buffer.from(csv, 'utf-8'),
      mimeType: 'text/csv; charset=utf-8',
      fileName: `data-backups-${Date.now()}.csv`,
    };
  }

  private resolveDateRange(from?: Date, to?: Date) {
    let fromDate = from ? new Date(from) : undefined;
    let toDate = to ? new Date(to) : undefined;

    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException('fromDate không thể lớn hơn toDate');
    }
    return { fromDate, toDate };
  }

  private parseJsonField(value: any, fieldName: string) {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value === 'object') {
      return value;
    }

    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (error) {
        throw new BadRequestException(`${fieldName} phải là chuỗi JSON hợp lệ`);
      }
    }

    throw new BadRequestException(`${fieldName} không hợp lệ`);
  }

  private tryParseFileContent(file: Express.Multer.File) {
    if (!file || !file.buffer) {
      return null;
    }

    const mime = file.mimetype;
    const content = file.buffer.toString('utf-8');

    if (mime.includes('json') || file.originalname.endsWith('.json')) {
      try {
        return JSON.parse(content);
      } catch (error) {
        // ignore, file may be binary
        return null;
      }
    }
    return null;
  }

  private buildCsv(records: ExportedBackupRecord[]) {
    const headers = [
      'tableName',
      'action',
      'recordId',
      'actionBy',
      'note',
      'filePath',
      'createdAt',
      'dataBefore',
      'dataAfter',
    ];

    const rows = [headers.join(',')];

    for (const record of records) {
      const row = headers
        .map((header) => {
          const value = (record as any)[header];
          if (value === null || value === undefined) {
            return '';
          }

          if (value instanceof Date) {
            return `"${value.toISOString()}"`;
          }

          if (typeof value === 'object') {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }

          const stringValue = String(value).replace(/"/g, '""');
          return `"${stringValue}"`;
        })
        .join(',');
      rows.push(row);
    }

    return rows.join('\n');
  }
}

