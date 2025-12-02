import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { PaginationResult } from 'src/common/dto/paignation';
import { SearchDTO } from 'src/common/dto/search.dto';
import { STATUS, STATUS_SYSTEM } from 'src/common/enums/status.enum';
import { formatDateVN, getCurrentDateVN } from 'src/common/utils/format';
import { AuditLogs, AuditLogsDocument } from 'src/database/schemas/auditLogs.schema';
import { Elections, ElectionsDocument } from 'src/database/schemas/elections.schema';
import { Results, ResultsDocument } from 'src/database/schemas/results.schema';
import { Users, UserDocument } from 'src/database/schemas/users.schema';
import { Voters, VotersDocument } from 'src/database/schemas/voters.schema';
import { SystemLog, SystemLogDocument } from 'src/database/schemas/systemLog.schema';
import {
  ElectionsParticipants,
  ElectionsParticipantsDocument,
} from 'src/database/schemas/electionParticipants.schema';
import * as ExcelJS from 'exceljs';

@Injectable()
export class SystemService {
  constructor(
    @InjectModel(AuditLogs.name) private readonly auditLogsModel: Model<AuditLogsDocument>,
    @InjectModel(Elections.name) private readonly electionsModel: Model<ElectionsDocument>,
    @InjectModel(Voters.name) private readonly votersModel: Model<VotersDocument>,
    @InjectModel(Users.name) private readonly usersModel: Model<UserDocument>,
    @InjectModel(Results.name) private readonly resultsModel: Model<ResultsDocument>,
    @InjectModel(SystemLog.name) private readonly systemLogModel: Model<SystemLogDocument>,
    @InjectModel(Users.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(AuditLogs.name) private readonly auditLogModel: Model<AuditLogsDocument>,
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipantsModel: Model<ElectionsParticipantsDocument>,
  ) {}

  async searchSystemLogs(req: SearchDTO) {
    try {
      const page = req.page ?? 1;
      const limit = req.limit ?? 10;
      const skip = (page - 1) * limit;

      const filter: FilterQuery<SystemLogDocument> = {};

      if (req.status) {
        const statusCodeRange = this.getStatusCodeRange(req.status as string);
        if (statusCodeRange) {
          filter.statusCode = {
            $gte: statusCodeRange[0],
            $lte: statusCodeRange[1],
          };
        }
      }

      if (req.textSearch) {
        const regex = new RegExp(req.textSearch, 'i');
        filter.$or = [{ method: regex }, { url: regex }, { ipAddress: regex }];
      }

      const createdAtFilter: FilterQuery<SystemLogDocument>['createdAt'] = {};
      if (req.fromDate) {
        createdAtFilter.$gte = new Date(req.fromDate);
      }
      if (req.toDate) {
        const toDate = new Date(req.toDate);
        toDate.setHours(23, 59, 59, 999);
        createdAtFilter.$lte = toDate;
      }
      if (Object.keys(createdAtFilter).length) {
        filter.createdAt = createdAtFilter;
      }

      const [logs, totalItems] = await Promise.all([
        this.systemLogModel
          .find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.systemLogModel.countDocuments(filter),
      ]);

      return this.buildPagination(logs, page, limit, totalItems);
    } catch (e) {
      throw e;
    }
  }

  async searchAuditLogs(req: SearchDTO) {
    try {
      const page = req.page ?? 1;
      const limit = req.limit ?? 10;
      const skip = (page - 1) * limit;

      const filter: FilterQuery<AuditLogsDocument> = {};

      if (req.textSearch) {
        const regex = new RegExp(req.textSearch, 'i');
        filter.$or = [{ module: regex }, { action: regex }];
      }

      if (req.type) {
        filter.module = req.type;
      }

      const createdAtFilter: FilterQuery<AuditLogsDocument>['createdAt'] = {};
      if (req.fromDate) {
        createdAtFilter.$gte = new Date(req.fromDate);
      }
      if (req.toDate) {
        const toDate = new Date(req.toDate);
        toDate.setHours(23, 59, 59, 999);
        createdAtFilter.$lte = toDate;
      }
      if (Object.keys(createdAtFilter).length) {
        filter.createdAt = createdAtFilter;
      }

      const [auditLogs, totalItems] = await Promise.all([
        this.auditLogModel
          .find(filter)
          .populate('userId', 'fullName email position')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.auditLogModel.countDocuments(filter),
      ]);

      return this.buildPagination(auditLogs, page, limit, totalItems);
    } catch (e) {
      throw e;
    }
  }

  private getStatusCodeRange(status?: string): number[] | null {
    switch (status) {
      case STATUS_SYSTEM.SUCCESS:
        return [200, 299];
      case STATUS_SYSTEM.CLIENT_ERROR:
        return [400, 499];
      case STATUS_SYSTEM.SERVER_ERROR:
        return [500, 599];
      case STATUS_SYSTEM.INFORMATION:
        return [100, 199];
      case STATUS_SYSTEM.REDIRECTION:
        return [300, 399];
      default:
        return null;
    }
  }

  private buildPagination<T>(
    content: T[],
    page: number,
    limit: number,
    totalItems: number,
  ): PaginationResult<T> {
    return {
      content,
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    };
  }

  async getStatisticsCards() {
    const totalElections = await this.electionsModel.countDocuments();
    const totalVoters = await this.electionParticipantsModel.countDocuments({
      roleId: new Types.ObjectId('6906ebaf3bb016c908c61ba0'),
    });

    const completedElections = await this.electionsModel.countDocuments({
      status: STATUS.COMPLETED,
    });

    const eligibleVoters = await this.votersModel.countDocuments({ eligible: true });
    const votedVoters = await this.votersModel.countDocuments({ status: STATUS.ACTIVE });
    const participationRate = eligibleVoters > 0 ? (votedVoters / eligibleVoters) * 100 : 0;

    return [
      {
        icon: 'poll',
        title: 'Tổng số bầu cử',
        value: totalElections,
        diff: 2, // Sẽ cập nhật logic sau
        diff_type: 'increase',
      },
      {
        icon: 'people',
        title: 'Tổng số cử tri',
        value: totalVoters,
        diff: 45, // Sẽ cập nhật logic sau
        diff_type: 'increase',
      },
      {
        icon: 'how_to_vote',
        title: 'Tỷ lệ tham gia',
        value: participationRate,
        unit: '%',
        diff: 5, // Sẽ cập nhật logic sau
        diff_type: 'increase',
      },
      {
        icon: 'done_all',
        title: 'Hoàn thành',
        value: completedElections,
        diff: 1, // Sẽ cập nhật logic sau
        diff_type: 'increase',
      },
    ];
  }

  async getParticipationRateChart() {
    const participationData = await this.electionParticipantsModel.aggregate([
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          total: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    const lineData = participationData.map((item) => ({
      month: `Th${item._id.month}`,
      rate: item.total,
    }));

    return lineData;
  }

  async getResultDistributionChart() {
    const userData = await this.usersModel.find().exec();
    let userActive = userData.filter((user) => user.status === STATUS.ACTIVE).length;
    let userInactive = userData.filter((user) => user.status === STATUS.INACTIVE).length;
    return {
      active: userActive,
      inactive: userInactive,
    };
  }

  async getOngoingPolls() {
    const ongoingPolls = await this.electionsModel.find().sort({ startDate: 1 });

    return ongoingPolls.map((poll) => {
      const remainingTime = poll.createdAt ? formatDateVN(new Date(poll.createdAt)) : 'N/A';
      return {
        name: poll.title,
        remainingTime: remainingTime,
        statusData: poll.statusData,
        status: poll.status,
      };
    });
  }

  async getRecentActivities() {
    const recentActivities = await this.auditLogsModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'fullName');
    return recentActivities.map((activity) => {
      const timeAgo = formatDateVN(new Date(activity.createdAt));
      return {
        activity: `${(activity.userId as any).fullName} ${activity.action} in ${activity.module}`,
        time: timeAgo,
      };
    });
  }

  async getSystemLogStatistics(type: 'week' | 'month' | 'year') {
    try {
      const now = getCurrentDateVN();
      let startDate: Date;

      switch (type) {
        case 'week': {
          const day = now.getDay() === 0 ? 7 : now.getDay(); // Chủ nhật = 7
          startDate = new Date(now);
          startDate.setDate(now.getDate() - (day - 1));
          break;
        }
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          throw new Error('Invalid type, must be week | month | year');
      }

      const logs = await this.systemLogModel
        .find({
          createdAt: { $gte: startDate, $lte: now },
        })
        .exec();

      const grouped: Record<string, any> = {};

      logs.forEach((log) => {
        const date = new Date(log.createdAt);
        let key: string;

        if (type === 'week') {
          // Thống kê từng ngày trong tuần
          const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
          key = days[date.getDay()];
        } else if (type === 'month') {
          // Thống kê theo tuần trong tháng
          const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
          const dayOfMonth = date.getDate();
          const weekNumber = Math.ceil((dayOfMonth + firstDay.getDay()) / 7);
          key = `Tuần ${weekNumber}`;
        } else {
          // type === 'year'
          key = `Th${date.getMonth() + 1}`;
        }

        if (!grouped[key]) {
          grouped[key] = {
            time: key,
            requests: 0,
            errors: 0,
            totalResponseTime: 0,
          };
        }

        grouped[key].requests += 1;
        grouped[key].totalResponseTime += log.responseTime || 0;
        if (log.statusCode >= 400) grouped[key].errors += 1;
      });

      const data = Object.values(grouped).map((item: any) => ({
        time: item.time,
        requests: item.requests,
        errors: item.errors,
        avgResponseTime: item.requests > 0 ? Math.round(item.totalResponseTime / item.requests) : 0,
      }));

      // Tính tổng metadata
      const totalRequests = data.reduce((acc, i) => acc + i.requests, 0);
      const totalErrors = data.reduce((acc, i) => acc + i.errors, 0);
      const avgResponseTime = totalRequests
        ? Math.round(
            data.reduce((acc, i) => acc + i.avgResponseTime * i.requests, 0) / totalRequests,
          )
        : 0;
      const errorRate = totalRequests > 0 ? +(totalErrors / totalRequests).toFixed(2) : 0;

      return {
        data: data.sort((a, b) => a.time.localeCompare(b.time, 'vi', { numeric: true })),
        metadata: {
          totalRequests,
          totalErrors,
          avgResponseTime,
          errorRate,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async exportSystemLogsToExcel(req: SearchDTO) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('System Logs');

      worksheet.columns = [
        { header: 'STT', key: 'index', width: 6 },
        { header: 'Phương thức', key: 'method', width: 12 },
        { header: 'URL', key: 'url', width: 50 },
        { header: 'Mã trạng thái', key: 'statusCode', width: 12 },
        { header: 'Địa chỉ IP', key: 'ipAddress', width: 18 },
        { header: 'Thời gian phản hồi (ms)', key: 'responseTime', width: 20 },
        { header: 'Ngày tạo', key: 'createdAt', width: 22 },
      ];

      // Build filter same as search
      const filter: FilterQuery<SystemLogDocument> = {};

      if (req.status) {
        const statusCodeRange = this.getStatusCodeRange(req.status as string);
        if (statusCodeRange) {
          filter.statusCode = {
            $gte: statusCodeRange[0],
            $lte: statusCodeRange[1],
          };
        }
      }

      if (req.textSearch) {
        const regex = new RegExp(req.textSearch, 'i');
        filter.$or = [{ method: regex }, { url: regex }, { ipAddress: regex }];
      }

      const createdAtFilter: FilterQuery<SystemLogDocument>['createdAt'] = {};
      if (req.fromDate) {
        createdAtFilter.$gte = new Date(req.fromDate);
      }
      if (req.toDate) {
        const toDate = new Date(req.toDate);
        toDate.setHours(23, 59, 59, 999);
        createdAtFilter.$lte = toDate;
      }
      if (Object.keys(createdAtFilter).length) {
        filter.createdAt = createdAtFilter;
      }

      // Get all logs matching filter (no pagination for export)
      const logs = await this.systemLogModel.find(filter).sort({ createdAt: -1 }).lean().exec();

      logs.forEach((log, index) => {
        worksheet.addRow({
          index: index + 1,
          method: log.method || '',
          url: log.url || '',
          statusCode: log.statusCode || '',
          ipAddress: log.ipAddress || '',
          responseTime: log.responseTime || 0,
          createdAt: log.createdAt
            ? new Date(log.createdAt).toLocaleString('vi-VN', {
                timeZone: 'Asia/Ho_Chi_Minh',
              })
            : '',
        });
      });

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };

      // Style data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.alignment = { vertical: 'middle' };
          // Color code status
          const statusCode = row.getCell(4).value as number;
          if (statusCode >= 200 && statusCode < 300) {
            row.getCell(4).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFC6EFCE' },
            };
          } else if (statusCode >= 400 && statusCode < 500) {
            row.getCell(4).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFEB9C' },
            };
          } else if (statusCode >= 500) {
            row.getCell(4).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC7CE' },
            };
          }
        }
      });

      const arrayBuffer = await workbook.xlsx.writeBuffer();
      const nodeBuffer = Buffer.from(new Uint8Array(arrayBuffer as ArrayBuffer));
      return {
        buffer: nodeBuffer,
        fileName: `system-logs-${Date.now()}.xlsx`,
      };
    } catch (error) {
      throw error;
    }
  }
}
