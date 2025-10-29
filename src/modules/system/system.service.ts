import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { paginate } from 'src/common/dto/paignation';
import { SearchDTO } from 'src/common/dto/search.dto';
import { STATUS_SYSTEM } from 'src/common/enums/status.enum';
import { formatDateVN } from 'src/common/utils/format';
import { AuditLogs, AuditLogsDocument } from 'src/database/schemas/auditLogs.schema';
import { SystemLog, SystemLogDocument } from 'src/database/schemas/systemLog.schema';

@Injectable()
export class SystemService {
  constructor(
    @InjectModel(SystemLog.name) private readonly systemLogModel: Model<SystemLogDocument>,
    @InjectModel(AuditLogs.name) private readonly auditLogModel: Model<AuditLogsDocument>,
  ) {}

  async searchSystemLogs(req: SearchDTO) {
    try {
      let statusCodeRange: number[] = [];
      switch (req.status as string) {
        case STATUS_SYSTEM.SUCCESS:
          statusCodeRange = [200, 299];
          break;
        case STATUS_SYSTEM.CLIENT_ERROR:
          statusCodeRange = [400, 499];
          break;
        case STATUS_SYSTEM.SERVER_ERROR:
          statusCodeRange = [500, 599];
          break;
        case STATUS_SYSTEM.INFORMATION:
          statusCodeRange = [100, 199];
          break;
        case STATUS_SYSTEM.REDIRECTION:
          statusCodeRange = [300, 399];
          break;
        default:
          statusCodeRange = [200, 599];
      }
      let from = formatDateVN(req.fromDate);
      let to = formatDateVN(req.toDate);
      const systemLogData = await this.systemLogModel.find({
        createdAt: { $gte: from, $lte: to },
        statusCode: { $gte: statusCodeRange[0], $lte: statusCodeRange[1] },
      }).exec();
      return paginate(systemLogData, req.page, req.limit);
    } catch (e) {
      throw e;
    }
  }
}
