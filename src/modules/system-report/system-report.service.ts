import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemLog, SystemLogDocument } from 'src/database/schemas/systemLog.schema';
import { AuditLogs, AuditLogsDocument } from 'src/database/schemas/auditLogs.schema';
import { Backups, BackupsDocument } from 'src/database/schemas/backups.schema';
import { SystemReportQueryDto } from './dto/system-report-query.dto';
import { getCurrentDateVN } from 'src/common/utils/format';

interface TimelineBucket {
  key: string;
  label: string;
  timestamp: number;
  requests: number;
  errors: number;
  totalResponseTime: number;
}

interface EndpointBucket {
  method: string;
  url: string;
  count: number;
  totalResponseTime: number;
  errorCount: number;
}

interface SystemReportOverview {
  range: { fromDate: Date; toDate: Date };
  summary: {
    totalRequests: number;
    successCount: number;
    errorCount: number;
    successRate: number;
    errorRate: number;
    avgResponseTime: number;
  };
  timeline: { label: string; requests: number; errors: number; avgResponseTime: number }[];
  topEndpoints: {
    endpoint: string;
    method: string;
    requests: number;
    avgResponseTime: number;
    errorRate: number;
  }[];
  auditSummary: {
    totalAudits: number;
    topModules: { module: string; count: number }[];
    latestActivities: { module: string; action: string; user?: string | null; at: Date }[];
  };
  backupSummary: {
    totalBackups: number;
    actions: Record<string, number>;
    lastBackupAt: Date | null;
  };
}

@Injectable()
export class SystemReportService {
  constructor(
    @InjectModel(SystemLog.name) private readonly systemLogModel: Model<SystemLogDocument>,
    @InjectModel(AuditLogs.name) private readonly auditLogModel: Model<AuditLogsDocument>,
    @InjectModel(Backups.name) private readonly backupModel: Model<BackupsDocument>,
  ) {}

  async getOverview(query: SystemReportQueryDto): Promise<SystemReportOverview> {
    const { fromDate, toDate } = this.resolveDateRange(query.fromDate, query.toDate);
    const interval = query.interval || 'day';
    const timeFilter = {
      createdAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    };

    const logsPromise = this.systemLogModel
      .find(timeFilter)
      .sort({ createdAt: 1 })
      .lean()
      .exec() as Promise<SystemLog[]>;

    const auditsPromise = this.auditLogModel
      .find(timeFilter)
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName email')
      .lean()
      .exec() as Promise<AuditLogs[]>;

    const backupsPromise = this.backupModel
      .find(timeFilter)
      .sort({ createdAt: -1 })
      .lean()
      .exec() as Promise<Backups[]>;

    const [logs, audits, backups] = await Promise.all([logsPromise, auditsPromise, backupsPromise]);

    const summary = this.buildSummary(logs);
    const timeline = this.buildTimeline(logs, interval);
    const topEndpoints = this.buildTopEndpoints(logs);
    const auditSummary = this.buildAuditSummary(audits);
    const backupSummary = this.buildBackupSummary(backups);

    return {
      range: { fromDate, toDate },
      summary,
      timeline,
      topEndpoints,
      auditSummary,
      backupSummary,
    };
  }

  async exportReport(query: SystemReportQueryDto) {
    const overview = await this.getOverview(query);
    const format = query.format || 'json';

    if (format === 'csv') {
      const csvContent = this.buildCsvReport(overview);
      return {
        buffer: Buffer.from(csvContent, 'utf-8'),
        mimeType: 'text/csv; charset=utf-8',
        fileName: `system-report-${Date.now()}.csv`,
      };
    }

    return {
      buffer: Buffer.from(JSON.stringify(overview, null, 2), 'utf-8'),
      mimeType: 'application/json',
      fileName: `system-report-${Date.now()}.json`,
    };
  }

  private resolveDateRange(from?: Date, to?: Date) {
    const now = getCurrentDateVN();
    const toDate = to ? new Date(to) : now;
    const fromDate = from ? new Date(from) : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (fromDate > toDate) {
      throw new Error('fromDate không thể lớn hơn toDate');
    }

    return { fromDate, toDate };
  }

  private buildSummary(logs: SystemLog[]) {
    const totalRequests = logs.length;
    const successCount = logs.filter((log) => (log.statusCode || 0) < 400).length;
    const errorCount = totalRequests - successCount;
    const totalResponseTime = logs.reduce((acc, log) => acc + (log.responseTime || 0), 0);
    const avgResponseTime = totalRequests ? Math.round(totalResponseTime / totalRequests) : 0;

    return {
      totalRequests,
      successCount,
      errorCount,
      successRate: totalRequests ? +((successCount / totalRequests) * 100).toFixed(2) : 0,
      errorRate: totalRequests ? +((errorCount / totalRequests) * 100).toFixed(2) : 0,
      avgResponseTime,
    };
  }

  private buildTimeline(logs: SystemLog[], interval: 'day' | 'week' | 'month') {
    const map = new Map<string, TimelineBucket>();

    logs.forEach((log) => {
      const createdAt = new Date(log.createdAt);
      const bucketMeta = this.getTimelineBucket(createdAt, interval);
      let bucket = map.get(bucketMeta.key);

      if (!bucket) {
        bucket = {
          key: bucketMeta.key,
          label: bucketMeta.label,
          timestamp: bucketMeta.timestamp,
          requests: 0,
          errors: 0,
          totalResponseTime: 0,
        };
        map.set(bucketMeta.key, bucket);
      }

      bucket.requests += 1;
      if ((log.statusCode || 0) >= 400) {
        bucket.errors += 1;
      }
      bucket.totalResponseTime += log.responseTime || 0;
    });

    return Array.from(map.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((bucket) => ({
        label: bucket.label,
        requests: bucket.requests,
        errors: bucket.errors,
        avgResponseTime: bucket.requests
          ? Math.round(bucket.totalResponseTime / bucket.requests)
          : 0,
      }));
  }

  private buildTopEndpoints(logs: SystemLog[]) {
    const map = new Map<string, EndpointBucket>();

    logs.forEach((log) => {
      const key = `${log.method || 'GET'} ${log.url || '/'}`;
      let bucket = map.get(key);
      if (!bucket) {
        bucket = {
          method: log.method,
          url: log.url,
          count: 0,
          totalResponseTime: 0,
          errorCount: 0,
        };
        map.set(key, bucket);
      }

      bucket.count += 1;
      bucket.totalResponseTime += log.responseTime || 0;
      if ((log.statusCode || 0) >= 400) {
        bucket.errorCount += 1;
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((bucket) => ({
        endpoint: bucket.url,
        method: bucket.method,
        requests: bucket.count,
        avgResponseTime: bucket.count ? Math.round(bucket.totalResponseTime / bucket.count) : 0,
        errorRate: bucket.count ? +((bucket.errorCount / bucket.count) * 100).toFixed(2) : 0,
      }));
  }

  private buildAuditSummary(audits: AuditLogs[]) {
    const moduleCounter: Record<string, number> = {};

    audits.forEach((audit) => {
      moduleCounter[audit.module] = (moduleCounter[audit.module] || 0) + 1;
    });

    const topModules = Object.entries(moduleCounter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([module, count]) => ({ module, count }));

    const latestActivities = audits.slice(0, 5).map((audit) => {
      const user =
        typeof audit.userId === 'object' && audit.userId
          ? ((audit.userId as any).fullName as string) ||
            ((audit.userId as any).email as string)
          : null;
      return {
        module: audit.module,
        action: audit.action,
        user,
        at: audit.createdAt,
      };
    });

    return {
      totalAudits: audits.length,
      topModules,
      latestActivities,
    };
  }

  private buildBackupSummary(backups: Backups[]) {
    const actions: Record<string, number> = {};
    backups.forEach((backup) => {
      const key = backup.action || 'UNKNOWN';
      actions[key] = (actions[key] || 0) + 1;
    });

    return {
      totalBackups: backups.length,
      actions,
      lastBackupAt: backups.length ? backups[0].createdAt : null,
    };
  }

  private getTimelineBucket(date: Date, interval: 'day' | 'week' | 'month') {
    const year = date.getFullYear();
    if (interval === 'week') {
      const week = this.getWeekNumber(date);
      const key = `${year}-W${week}`;
      return {
        key,
        label: `Tuần ${week}/${year}`,
        timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
      };
    }

    if (interval === 'month') {
      const month = date.getMonth() + 1;
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      return {
        key,
        label: `Th${month}/${year}`,
        timestamp: new Date(year, date.getMonth(), 1).getTime(),
      };
    }

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const key = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return {
      key,
      label: `${day}/${month}`,
      timestamp: new Date(year, date.getMonth(), day).getTime(),
    };
  }

  private getWeekNumber(date: Date) {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return week;
  }

  private buildCsvReport(report: SystemReportOverview) {
    const lines: string[] = [];
    lines.push('Mục,Chỉ số,Giá trị');
    lines.push(`Tổng quan,Tổng request,${report.summary.totalRequests}`);
    lines.push(`Tổng quan,Thành công,${report.summary.successCount}`);
    lines.push(`Tổng quan,Lỗi,${report.summary.errorCount}`);
    lines.push(`Tổng quan,Tỷ lệ thành công (%),${report.summary.successRate}`);
    lines.push(`Tổng quan,Tỷ lệ lỗi (%),${report.summary.errorRate}`);
    lines.push(`Tổng quan,Thời gian phản hồi TB (ms),${report.summary.avgResponseTime}`);
    lines.push('');
    lines.push('Timeline,Thời điểm,Số request,Số lỗi,Thời gian phản hồi TB');
    report.timeline.forEach((item) => {
      lines.push(`Timeline,${item.label},${item.requests},${item.errors},${item.avgResponseTime}`);
    });
    lines.push('');
    lines.push('Endpoint,Đường dẫn,Method,Số request,Tỷ lệ lỗi (%),Thời gian phản hồi TB');
    report.topEndpoints.forEach((endpoint) => {
      lines.push(
        [
          'Endpoint',
          endpoint.endpoint,
          endpoint.method,
          endpoint.requests,
          endpoint.errorRate,
          endpoint.avgResponseTime,
        ].join(','),
      );
    });
    lines.push('');
    lines.push('Audit,Module,Số lần');
    report.auditSummary.topModules.forEach((module) => {
      lines.push(['Audit', module.module, module.count].join(','));
    });
    lines.push('');
    lines.push('Backup,Hành động,Số lần');
    Object.entries(report.backupSummary.actions).forEach(([action, count]) => {
      lines.push(['Backup', action, count].join(','));
    });
    return lines.join('\n');
  }
}

