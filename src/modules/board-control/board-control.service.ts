import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Elections, ElectionsDocument } from 'src/database/schemas/elections.schema';
import { Voters, VotersDocument } from 'src/database/schemas/voters.schema';
import { Ballots, BallotsDocument } from 'src/database/schemas/ballots.schema';
import { Results, ResultsDocument } from 'src/database/schemas/results.schema';
import { AuditLogs, AuditLogsDocument } from 'src/database/schemas/auditLogs.schema';
import { SystemLog, SystemLogDocument } from 'src/database/schemas/systemLog.schema';
import { Reports, ReportsDocument } from 'src/database/schemas/reports.schema';
import { ElectionsParticipants, ElectionsParticipantsDocument } from 'src/database/schemas/electionParticipants.schema';
import { Roles, RolesDocument } from 'src/database/schemas/roles.schema';
import { Users, UserDocument } from 'src/database/schemas/users.schema';
import { Meetings, MeetingsDocument } from 'src/database/schemas/meetings.schema';
import { MeetingAttendees, MeetingAttendeesDocument } from 'src/database/schemas/meetingAttendees.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { REPORT_TYPE, STATUS } from 'src/common/enums/status.enum';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { createHash } from 'crypto';
import PdfPrinter from 'pdfmake';
import * as path from 'path';
import { getCurrentDateVN } from 'src/common/utils/format';
import { ElectionDocuments } from 'src/database/schemas/electionDocuments.schema';
import { MinioService } from '../minio/minio.service';
import { FileType } from 'src/common/enums/file-type.enum';

@Injectable()
export class BoardControlService {
  constructor(
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<ElectionsDocument>,
    @InjectModel(Voters.name)
    private readonly votersModel: Model<VotersDocument>,
    @InjectModel(Ballots.name)
    private readonly ballotsModel: Model<BallotsDocument>,
    @InjectModel(Results.name)
    private readonly resultsModel: Model<ResultsDocument>,
    @InjectModel(AuditLogs.name)
    private readonly auditLogsModel: Model<AuditLogsDocument>,
    @InjectModel(SystemLog.name)
    private readonly systemLogModel: Model<SystemLogDocument>,
    @InjectModel(Reports.name)
    private readonly reportsModel: Model<ReportsDocument>,
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipantsModel: Model<ElectionsParticipantsDocument>,
    @InjectModel(Roles.name)
    private readonly rolesModel: Model<RolesDocument>,
    @InjectModel(Users.name)
    private readonly usersModel: Model<UserDocument>,
    @InjectModel(Meetings.name)
    private readonly meetingsModel: Model<MeetingsDocument>,
    @InjectModel(MeetingAttendees.name)
    private readonly meetingAttendeesModel: Model<MeetingAttendeesDocument>,
    @InjectModel(ElectionDocuments.name)
    private readonly electionDocumentsModel: Model<ElectionDocuments>,
    private readonly minioService: MinioService,
  ) { }

  private ensureObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
    }
    return new Types.ObjectId(id);
  }

  private async getElectionOrThrow(electionId: string) {
    const election = await this.electionsModel.findById(electionId).lean();
    if (!election) {
      throw new NotFoundException(MESSAGE.ELECTION_NOT_FOUND);
    }
    return election;
  }

  private async getBoardControlRole() {
    const role = await this.rolesModel.findOne({ roleCode: USER_ROLE.BOARD_OF_CONTROL }).exec();
    if (!role) {
      throw new NotFoundException('Không tìm thấy role Ban Kiểm soát');
    }
    return role;
  }

  private async getOrCreateReport(electionObjectId: Types.ObjectId, type: string) {
    let report = await this.reportsModel
      .findOne({ electionId: electionObjectId, type })
      .exec();
    if (!report) {
      report = await this.reportsModel.create({
        electionId: electionObjectId,
        type,
        status: STATUS.ACTIVE,
      });
    }
    return report;
  }

  private async getOrCreateArchiveReport(electionObjectId: Types.ObjectId, reportData: any) {
    const archiveType = 'ARCHIVE';
    let report = await this.reportsModel
      .findOne({ electionId: electionObjectId, type: archiveType })
      .exec();

    if (!report) {
      // Lần đầu: tạo report mới với status PENDING
      report = await this.reportsModel.create({
        electionId: electionObjectId,
        type: archiveType,
        status: STATUS.PENDING,
        description: reportData.description || null,
        summary: reportData.summary || null,
        documentId: reportData.documentId ? new Types.ObjectId(reportData.documentId) : null,
        severity: reportData.severity || STATUS.ACTIVE,
      });
    } else {
      // Các lần sau: chỉ update nếu status là PENDING
      if (report.status === STATUS.PENDING) {
        report.description = reportData.description || report.description;
        report.summary = reportData.summary || report.summary;
        report.documentId = new Types.ObjectId(reportData.documentId) || new Types.ObjectId(report.documentId);
        report.severity = reportData.severity || report.severity;
        await report.save();
      }
      // Nếu status khác PENDING thì chỉ trả về, không update
    }

    return report;
  }

  private formatDate(date?: Date | null, withTime = false) {
    if (!date) return '--';

    const d = new Date(date);

    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();

    if (!withTime) {
      return `${day}/${month}/${year}`;
    }

    const hour = String(d.getUTCHours()).padStart(2, '0');
    const minute = String(d.getUTCMinutes()).padStart(2, '0');
    const second = String(d.getUTCSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  }

  private buildChecksum(source: string) {
    return createHash('sha256').update(source).digest('hex').slice(0, 16);
  }

  async getVotingOverview(electionId: string) {
    const election = await this.getElectionOrThrow(electionId);
    const electionObjectId = this.ensureObjectId(electionId);

    const [totalVoters, totalBallots, castBallots, invalidBallots] = await Promise.all([
      this.votersModel.countDocuments({ electionId: electionObjectId }),
      this.ballotsModel.countDocuments({ electionId: electionObjectId }),
      this.ballotsModel.countDocuments({ electionId: electionObjectId, status: STATUS.CAST }),
      this.ballotsModel.countDocuments({ electionId: electionObjectId, status: STATUS.INVALID }),
    ]);

    const percent = totalVoters ? +((castBallots / totalVoters) * 100).toFixed(2) : 0;
    const now = getCurrentDateVN();
    const endDate = election.endDate ? new Date(election.endDate) : null;
    const timeLeftSeconds =
      endDate && endDate.getTime() > now.getTime()
        ? Math.floor((endDate.getTime() - now.getTime()) / 1000)
        : 0;

    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const recentVotes = await this.ballotsModel.countDocuments({
      electionId: electionObjectId,
      status: STATUS.CAST,
      castAt: { $gte: tenMinutesAgo },
    });
    const speed = Math.max(0, Math.round(recentVotes / 10));

    return {
      election: {
        id: election._id,
        title: election.title,
        startDate: election.startDate,
        endDate: election.endDate,
        status: election.status,
      },
      timer: {
        timeLeftSeconds,
        endDate: election.endDate,
      },
      summary: {
        percent,
        voted: castBallots,
        total: totalVoters,
        validVotes: castBallots - invalidBallots,
        speed,
      },
      ballots: {
        total: totalBallots,
        cast: castBallots,
        invalid: invalidBallots,
      },
    };
  }

  async getVerificationReport(electionId: string) {
    const election = await this.getElectionOrThrow(electionId);
    const electionObjectId = this.ensureObjectId(electionId);
    const verificationReport = await this.getOrCreateReport(electionObjectId, REPORT_TYPE.VERIFICATION);
    if (!verificationReport.summary) {
      verificationReport.summary = `Báo cáo xác minh - ${election.title} - ${this.formatDate(getCurrentDateVN(), false)}`;
      await verificationReport.save();
    }

    const populatedReport = await this.reportsModel
      .findById(verificationReport._id)
      .populate('electionId', 'title decisionNumber decisionName status statusData startDate endDate delegationStart delegationEnd')
      .populate('reviewedBy', 'username fullName email position')
      .populate('createdBy', 'username fullName email position')
      .populate('updatedBy', 'username fullName email position')
      .lean();

    const meetings = await this.meetingsModel
      .find({ electionId: electionObjectId })
      .select('_id')
      .lean();
    const meetingIds = meetings.map(m => m._id);

    const totalCheckin = meetingIds.length > 0
      ? await this.meetingAttendeesModel.countDocuments({
        meetingId: { $in: meetingIds },
        attended: true,
      })
      : 0;

    const [totalVoters, castBallots, invalidBallots, results, blankVotesCount] = await Promise.all([
      this.votersModel.countDocuments({ electionId: electionObjectId, status: { $ne: STATUS.INACTIVE } }),
      this.ballotsModel.countDocuments({ electionId: electionObjectId, status: STATUS.CAST }),
      this.ballotsModel.countDocuments({ electionId: electionObjectId, status: STATUS.INVALID }),
      this.resultsModel
        .find({ electionId: electionObjectId })
        .populate('entityId', 'title')
        .lean(),
      this.ballotsModel.countDocuments({ electionId: electionObjectId, status: STATUS.BLANK }),
    ]);
    const totalVotesIncludingBlank = blankVotesCount + castBallots;

    const totalResultVotes = results.reduce((sum, item) => sum + (item.votesCount || 0), 0);
    const candidates = results.map((item) => ({
      name: (item.entityId as any)?.title || 'Ứng viên',
      votes: item.votesCount || 0,
      percent: totalResultVotes
        ? +(((item.votesCount || 0) / totalResultVotes) * 100).toFixed(2)
        : 0,
    }));

    const summaryCards = [
      { title: 'Tổng số Cử tri', value: totalVoters.toLocaleString('vi-VN') },
      { title: 'Số phiếu đã vào', value: totalVotesIncludingBlank.toLocaleString('vi-VN') },
      {
        title: 'Tỷ lệ Tham gia',
        value: totalVoters ? `${((totalVotesIncludingBlank / totalVoters) * 100).toFixed(1)}%` : '0%',
      },
      {
        title: 'Phiếu Hợp lệ',
        value: (totalVotesIncludingBlank).toLocaleString('vi-VN'),
        highlight: true,
      },
      {
        title: 'Phiếu Trắng',
        value: blankVotesCount.toLocaleString('vi-VN'),
      },
      {
        title: 'Phiếu không hợp lệ',
        value: invalidBallots.toLocaleString('vi-VN'),
      },
    ];

    const checksumBase = `${electionId}:${castBallots}:${invalidBallots}:${totalVoters}:${blankVotesCount}`;
    const defaultChecksum = this.buildChecksum(checksumBase);

    let checksumBefore = defaultChecksum;
    let checksumAfter = defaultChecksum;
    let isConfirmed = false;

    if (verificationReport.summary) {
      try {
        const summaryData = JSON.parse(verificationReport.summary);
        checksumBefore = summaryData.checksumBefore || defaultChecksum;
        checksumAfter = summaryData.checksumAfter || defaultChecksum;
        isConfirmed = !!verificationReport.reviewedBy && verificationReport.status === STATUS.SIGNED;
      } catch {
        // Nếu không parse được, dùng giá trị mặc định
      }
    }

    const verification = {
      totalCheckin: totalCheckin, // Sử dụng số check-in thực tế từ MeetingAttendees
      totalVotes: castBallots - invalidBallots,
      isDataValid: invalidBallots === 0,
      checksumBefore,
      checksumAfter,
      isConfirmed,
    };

    const ballots = await this.ballotsModel
      .find({ electionId: electionObjectId })
      .sort({ castAt: -1 })
      .limit(20)
      .lean();

    const logs = ballots.map((ballot) => ({
      id: ballot._id?.toString() || '',
      time: this.formatDate(ballot.castAt ?? ballot.issuedAt ?? ballot.createdAt, true),
      status: ballot.status === STATUS.CAST ? 'Hợp lệ' : 'Không hợp lệ',
    }));

    return {
      election: {
        id: election._id,
        title: election.title,
        decisionNumber: election.decisionNumber,
        decisionName: election.decisionName,
        status: election.status,
        statusData: election.statusData,
        startDate: election.startDate,
        endDate: election.endDate,
        delegationStart: election.delegationStart,
        delegationEnd: election.delegationEnd,
      },
      candidates,
      summaryCards,
      verification,
      logs,
      report: populatedReport ? {
        _id: populatedReport._id,
        type: populatedReport.type,
        description: populatedReport.description,
        summary: populatedReport.summary,
        documentId: populatedReport.documentId,
        status: populatedReport.status,
        severity: populatedReport.severity,
        createdAt: populatedReport.createdAt,
        updatedAt: populatedReport.updatedAt,
        reviewedAt: populatedReport.reviewedAt,
        createdBy: populatedReport.createdBy,
        updatedBy: populatedReport.updatedBy,
        reviewedBy: populatedReport.reviewedBy,
        electionId: populatedReport.electionId,
      } : null,
    };
  }

  async approveVerification(electionId: string, userId: string | undefined) {
    if (!userId) {
      throw new BadRequestException(MESSAGE.USER_NOT_FOUND);
    }
    const userIdObjectId = this.ensureObjectId(userId);
    const electionObjectId = this.ensureObjectId(electionId);
    const verificationReport = await this.getOrCreateReport(electionObjectId, 'VERIFICATION');

    const checksumBefore = this.buildChecksum(`${electionId}:${Date.now()}:before`);
    const checksumAfter = this.buildChecksum(`${electionId}:${Date.now()}:after`);

    verificationReport.reviewedBy = userIdObjectId;
    verificationReport.reviewedAt = getCurrentDateVN();
    verificationReport.summary = JSON.stringify({
      checksumBefore,
      checksumAfter,
      confirmedAt: getCurrentDateVN(),
    });

    await verificationReport.save();

    return {
      isConfirmed: true,
      confirmedAt: verificationReport.reviewedAt,
      confirmedBy: userIdObjectId,
      checksumBefore,
      checksumAfter,
    };
  }

  async getAuditReport(electionId: string, reportData?: any) {
    const election = await this.getElectionOrThrow(electionId);
    const electionObjectId = this.ensureObjectId(electionId);

    // Sử dụng logic tương tự archive report
    const auditType = 'AUDIT';
    let auditReport = await this.reportsModel
      .findOne({ electionId: electionObjectId, type: auditType })
      .exec();

    if (!auditReport) {
      // Lần đầu: tạo report mới với status PENDING
      auditReport = await this.reportsModel.create({
        electionId: electionObjectId,
        type: auditType,
        status: STATUS.PENDING,
        description: reportData?.description || null,
        summary: reportData?.summary || null,
        fileUrl: reportData?.fileUrl || null,
        severity: reportData?.severity || STATUS.ACTIVE,
      });
    } else {
      // Các lần sau: chỉ update nếu status là PENDING
      if (auditReport.status === STATUS.PENDING && reportData) {
        auditReport.description = reportData.description || auditReport.description;
        auditReport.summary = reportData.summary || auditReport.summary;
        auditReport.documentId = new Types.ObjectId(reportData.documentId || auditReport.documentId);
        auditReport.severity = reportData.severity || auditReport.severity;
        await auditReport.save();
      }
      // Nếu status khác PENDING thì chỉ trả về, không update
    }

    const [invalidBallots, auditLogs] = await Promise.all([
      this.ballotsModel.countDocuments({ electionId: electionObjectId, status: STATUS.INVALID }),
      this.auditLogsModel
        .find({
          $or: [
            { 'new_value.electionId': electionId },
            { 'old_value.electionId': electionId },
            { module: new RegExp(election.title, 'i') },
            { module: /ELECTION/i },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('userId', 'fullName email username')
        .lean(),
    ]);

    const startWindow = getCurrentDateVN();
    startWindow.setDate(startWindow.getDate() - 7);
    const [totalSystemLogs, healthySystemLogs] = await Promise.all([
      this.systemLogModel.countDocuments({ createdAt: { $gte: startWindow } }),
      this.systemLogModel.countDocuments({
        createdAt: { $gte: startWindow },
        statusCode: { $lt: 400 },
      }),
    ]);

    const uptime = totalSystemLogs
      ? +((healthySystemLogs / totalSystemLogs) * 100).toFixed(2)
      : 100;

    const managementActions = auditLogs.length;
    const securityEvents = invalidBallots;

    const summaryCards = [
      { title: 'Sự kiện An ninh', value: securityEvents },
      { title: 'Hành động Quản trị', value: managementActions },
      { title: 'Tỷ lệ Uptime', value: `${uptime}%` },
      {
        title: 'Toàn vẹn Dữ liệu',
        value: invalidBallots === 0 ? 'HỢP LỆ' : 'CẦN KIỂM TRA',
        highlight: invalidBallots === 0,
      },
    ];

    const logs = auditLogs.map((log) => ({
      time: this.formatDate(log.createdAt, true),
      user:
        (log.userId as any)?.fullName ||
        (log.userId as any)?.username ||
        (log.userId as any)?.email ||
        'Hệ thống',
      action: log.action,
      details: log.module,
    }));

    // Populate report để lấy đầy đủ thông tin
    const populatedReport = await this.reportsModel
      .findById(auditReport._id)
      .populate('electionId', 'title decisionNumber decisionName status statusData startDate endDate delegationStart delegationEnd')
      .populate('reviewedBy', 'username fullName email position')
      .populate('createdBy', 'username fullName email position')
      .populate('updatedBy', 'username fullName email position')
      .lean();

    const reportInfo = {
      id: populatedReport?._id ? `AUD-${populatedReport._id.toString().slice(-6).toUpperCase()}` : `AUD-${electionId.slice(-6).toUpperCase()}`,
      createdDate: populatedReport?.createdAt ? this.formatDate(populatedReport.createdAt, false) : this.formatDate(getCurrentDateVN(), false),
      reportPeriod: `${this.formatDate(election.startDate)} - ${this.formatDate(election.endDate)}`,
      status: populatedReport?.reviewedBy ? 'Đã ký số' : populatedReport?.status === STATUS.PENDING ? 'Chờ ký duyệt' : populatedReport?.status || 'Chờ ký duyệt',
    };

    // Lấy thông tin người ký từ report
    let signerName = 'Ban Kiểm soát';
    let signerRole = 'Trưởng ban kiểm soát';

    if (populatedReport?.reviewedBy && typeof populatedReport.reviewedBy === 'object') {
      signerName = (populatedReport.reviewedBy as any)?.fullName || signerName;
      // Có thể lấy role từ ElectionsParticipants nếu cần
    }

    return {
      info: reportInfo,
      summaryCards,
      logs,
      signature: {
        signerName,
        signerRole,
        isConfirmed: !!populatedReport?.reviewedBy,
      },
      // Thêm các trường từ report
      report: populatedReport ? {
        _id: populatedReport._id,
        type: populatedReport.type,
        description: populatedReport.description,
        summary: populatedReport.summary,
        documentId: populatedReport.documentId,
        status: populatedReport.status,
        severity: populatedReport.severity,
        createdAt: populatedReport.createdAt,
        updatedAt: populatedReport.updatedAt,
        reviewedAt: populatedReport.reviewedAt,
        createdBy: populatedReport.createdBy,
        updatedBy: populatedReport.updatedBy,
        reviewedBy: populatedReport.reviewedBy,
        electionId: populatedReport.electionId,
      } : null,
    };
  }

  async confirmAuditReport(electionId: string, userId: string | undefined) {
    if (!userId) {
      throw new BadRequestException(MESSAGE.USER_NOT_FOUND);
    }
    const userIdObjectId = this.ensureObjectId(userId);
    const electionObjectId = this.ensureObjectId(electionId);
    const auditReport = await this.getOrCreateReport(electionObjectId, 'AUDIT');

    auditReport.reviewedBy = userIdObjectId;
    auditReport.reviewedAt = getCurrentDateVN();

    await auditReport.save();

    // Lấy thông tin user để trả về
    const user = await this.usersModel.findById(userIdObjectId).lean();

    return {
      signerName: user?.fullName || 'Ban Kiểm soát',
      signerRole: 'Trưởng ban kiểm soát',
      isConfirmed: true,
      confirmedAt: auditReport.reviewedAt,
      confirmedBy: userIdObjectId,
    };
  }

  async rejectVerificationReport(electionId: string, userId: string | undefined, reason: string) {
    if (!userId) {
      throw new BadRequestException(MESSAGE.USER_NOT_FOUND);
    }
    const userIdObjectId = this.ensureObjectId(userId);
    const electionObjectId = this.ensureObjectId(electionId);
    const election = await this.getElectionOrThrow(electionId);

    const verificationReport = await this.getOrCreateReport(electionObjectId, REPORT_TYPE.VERIFICATION);
    verificationReport.status = STATUS.REJECTED;
    verificationReport.description = reason || 'Xác minh bị từ chối';
    verificationReport.reviewedBy = userIdObjectId;
    verificationReport.reviewedAt = getCurrentDateVN();
    if (!verificationReport.summary) {
      verificationReport.summary = `Báo cáo xác minh - ${election.title} - ${this.formatDate(getCurrentDateVN(), false)}`;
    }
    await verificationReport.save();

    // Tạo báo cáo bất thường
    const abnormalReport = await this.reportsModel.create({
      electionId: electionObjectId,
      type: REPORT_TYPE.ABNORMAL,
      status: STATUS.RESOLVED,
      description: reason || 'Báo cáo bất thường (từ chối)',
      summary: `Báo cáo bất thường - ${election.title} - ${this.formatDate(getCurrentDateVN(), false)}`,
      reviewedBy: userIdObjectId,
      reviewedAt: getCurrentDateVN(),
    });

    // Tạo pdf báo cáo bất thường
    const abnormalPdf = await this.generateAbnormalReportPdf(election, reason);

    // Upload pdf lên minio
    const upload = await this.minioService.uploadSignedPdf(
      FileType.SIGNED_REPORT,
      userId,
      abnormalPdf,
    );

    if (upload) {
      const doc = await this.electionDocumentsModel.create({
        electionId: electionObjectId,
        preparedBy: userIdObjectId,
        title: `Báo cáo bất thường - ${election.title}`,
        type: FileType.SIGNED_REPORT,
        fileUrl: upload.key,
        createdBy: userIdObjectId,
      });

      abnormalReport.documentId = doc._id as Types.ObjectId;
      await abnormalReport.save();
    }

    return { status: STATUS.REJECTED, reason, abnormalReportId: abnormalReport._id };
  }

  async checkRejectionStatus(electionId: string) {
    const electionObjectId = this.ensureObjectId(electionId);
    const election = await this.getElectionOrThrow(electionId);

    // Kiểm tra báo cáo xác minh có bị từ chối không
    const verificationReport = await this.reportsModel
      .findOne({ electionId: electionObjectId, type: REPORT_TYPE.VERIFICATION })
      .lean()
      .exec();

    const isRejected = verificationReport?.status === STATUS.REJECTED;

    // Kiểm tra báo cáo bất thường
    const abnormalReport = await this.reportsModel
      .findOne({ electionId: electionObjectId, type: REPORT_TYPE.ABNORMAL })
      .lean()
      .exec();

    return {
      isRejected,
      hasAbnormalReport: !!abnormalReport,
      abnormalReport: abnormalReport || null,
      verificationReport: verificationReport || null,
    };
  }

  async getAbnormalReport(electionId: string) {
    try {
      const electionObjectId = this.ensureObjectId(electionId);
      await this.getElectionOrThrow(electionId);

      const abnormalReport = await this.reportsModel
        .findOne({ electionId: electionObjectId, type: REPORT_TYPE.ABNORMAL })
        .populate('electionId', 'title decisionNumber decisionName status statusData startDate endDate')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .populate('documentId')
        .lean()
        .exec();

      if (!abnormalReport) {
        throw new NotFoundException('Không tìm thấy báo cáo bất thường cho cuộc bầu cử này');
      }

      return abnormalReport;
    } catch (error) {
      throw error;
    }
  }

  private async generateAbnormalReportPdf(election: any, reason: string) {
    const fonts = {
      Roboto: {
        normal: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Regular.ttf'),
        bold: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Bold.ttf'),
      },
    };
    const printer = new PdfPrinter(fonts);
    const now = getCurrentDateVN();

    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 60, 40, 60],
      content: [
        { text: 'BÁO CÁO BẤT THƯỜNG', style: 'header', alignment: 'center', margin: [0, 0, 0, 20] },
        {
          table: {
            widths: ['35%', '65%'],
            body: [
              ['Cuộc bầu cử', election?.title || '--'],
              ['Quyết định', election?.decisionNumber || '--'],
              ['Thời điểm', this.formatDate(now, true)],
              ['Trạng thái', 'TỪ CHỐI'],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 16],
        },
        { text: 'Lý do từ chối', style: 'subHeader', margin: [0, 0, 0, 8] },
        { text: reason || 'Không cung cấp lý do', margin: [0, 0, 0, 12] },
      ],
      styles: {
        header: { fontSize: 20, bold: true },
        subHeader: { fontSize: 13, bold: true },
      },
      defaultStyle: {
        fontSize: 11,
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    return await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err) => reject(err));
      pdfDoc.end();
    });
  }

  async getOrUpdateArchiveReport(electionId: string, reportData?: any) {
    const election = await this.getElectionOrThrow(electionId);
    const electionObjectId = this.ensureObjectId(electionId);

    const report = await this.getOrCreateArchiveReport(electionObjectId, reportData || {});

    // Populate các thông tin liên quan đầy đủ
    const populatedReport = await this.reportsModel
      .findById(report._id)
      .populate('electionId', 'title decisionNumber decisionName status statusData startDate endDate delegationStart delegationEnd createdAt updatedAt')
      .populate('reviewedBy', 'username fullName email position')
      .populate('signedBy', 'username fullName email position')
      .populate('createdBy', 'username fullName email position')
      .populate('updatedBy', 'username fullName email position')
      .lean();

    return populatedReport;
  }

  async generateAuditReportPdf(electionId: string): Promise<Buffer> {
    const reportData = await this.getAuditReport(electionId);
    const election = await this.getElectionOrThrow(electionId);

    const fonts = {
      Roboto: {
        normal: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Regular.ttf'),
        bold: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Bold.ttf'),
      },
    };
    const printer = new PdfPrinter(fonts);

    const currentDate = getCurrentDateVN();
    const formattedDate = this.formatDate(currentDate, false);

    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 60, 40, 60],
      content: [
        // Header
        {
          text: 'BÁO CÁO KIỂM SOÁT HỆ THỐNG',
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        // Thông tin báo cáo
        {
          columns: [
            {
              text: [
                { text: 'Mã báo cáo: ', bold: true },
                { text: reportData.info.id },
              ],
              margin: [0, 0, 0, 5],
            },
            {
              text: [
                { text: 'Ngày tạo: ', bold: true },
                { text: reportData.info.createdDate },
              ],
              margin: [0, 0, 0, 5],
            },
          ],
        },
        {
          text: [
            { text: 'Kỳ báo cáo: ', bold: true },
            { text: reportData.info.reportPeriod },
          ],
          margin: [0, 0, 0, 5],
        },
        {
          text: [
            { text: 'Trạng thái: ', bold: true },
            { text: reportData.info.status },
          ],
          margin: [0, 0, 0, 20],
        },
        // Tổng quan
        {
          text: 'TỔNG QUAN & CÁC CHỈ SỐ CHÍNH',
          style: 'subheader',
          margin: [0, 20, 0, 10],
        },
        {
          table: {
            widths: ['*', '*'],
            body: reportData.summaryCards.map((card) => [
              { text: card.title, bold: true },
              { text: String(card.value) },
            ]),
          },
          margin: [0, 0, 0, 20],
        },
        // Nhật ký
        {
          text: 'NHẬT KÝ HOẠT ĐỘNG',
          style: 'subheader',
          margin: [0, 20, 0, 10],
        },
        {
          table: {
            widths: ['20%', '25%', '20%', '35%'],
            headerRows: 1,
            body: [
              [
                { text: 'Thời gian', bold: true },
                { text: 'Người thực hiện', bold: true },
                { text: 'Hành động', bold: true },
                { text: 'Chi tiết', bold: true },
              ],
              ...reportData.logs.slice(0, 20).map((log) => [
                log.time,
                log.user,
                log.action,
                log.details,
              ]),
            ],
          },
          margin: [0, 0, 0, 20],
        },
        // Footer
        {
          text: `Báo cáo được tạo vào: ${formattedDate}`,
          style: 'footer',
          alignment: 'center',
          margin: [0, 20, 0, 0],
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
        },
        subheader: {
          fontSize: 14,
          bold: true,
        },
        footer: {
          fontSize: 10,
          italics: true,
        },
      },
    };

    return new Promise((resolve, reject) => {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err) => reject(err));
      pdfDoc.end();
    });
  }

  async generateArchiveReportPdf(electionId: string, reportId?: string): Promise<Buffer> {
    const election = await this.getElectionOrThrow(electionId);

    let report;
    if (reportId) {
      report = await this.reportsModel
        .findById(reportId)
        .populate('electionId', 'title decisionNumber decisionName')
        .populate('signedBy', 'fullName username')
        .populate('createdBy', 'fullName username')
        .lean();
    } else {
      const archiveReport = await this.getOrUpdateArchiveReport(electionId, {});
      if (!archiveReport || !archiveReport._id) {
        throw new NotFoundException('Không tìm thấy báo cáo lưu trữ');
      }
      report = await this.reportsModel
        .findById(archiveReport._id)
        .populate('electionId', 'title decisionNumber decisionName')
        .populate('signedBy', 'fullName username')
        .populate('createdBy', 'fullName username')
        .lean();
    }

    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo lưu trữ');
    }

    const fonts = {
      Roboto: {
        normal: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Regular.ttf'),
        bold: path.join(process.cwd(), 'src', 'fonts', 'Roboto-Bold.ttf'),
      },
    };
    const printer = new PdfPrinter(fonts);

    const currentDate = getCurrentDateVN();
    const formattedDate = this.formatDate(currentDate, false);

    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 60, 40, 60],
      content: [
        // Header
        {
          text: 'BÁO CÁO LƯU TRỮ',
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },
        // Thông tin báo cáo
        {
          text: [
            { text: 'Tên báo cáo: ', bold: true },
            { text: (report as any).description || 'Báo cáo lưu trữ' },
          ],
          margin: [0, 0, 0, 5],
        },
        {
          text: [
            { text: 'Cuộc bầu cử: ', bold: true },
            { text: (report.electionId as any)?.title || '-' },
          ],
          margin: [0, 0, 0, 5],
        },
        {
          text: [
            { text: 'Loại báo cáo: ', bold: true },
            { text: (report as any).type || 'ARCHIVE' },
          ],
          margin: [0, 0, 0, 5],
        },
        {
          text: [
            { text: 'Trạng thái: ', bold: true },
            { text: (report as any).status || '-' },
          ],
          margin: [0, 0, 0, 5],
        },
        {
          text: [
            { text: 'Ngày tạo: ', bold: true },
            { text: (report as any).createdAt ? this.formatDate((report as any).createdAt, false) : '-' },
          ],
          margin: [0, 0, 0, 5],
        },
        {
          text: [
            { text: 'Người tạo: ', bold: true },
            { text: (report.createdBy as any)?.fullName || (report.createdBy as any)?.username || '-' },
          ],
          margin: [0, 0, 0, 5],
        },
        {
          text: [
            { text: 'Người ký: ', bold: true },
            { text: (report.signedBy as any)?.fullName || (report.signedBy as any)?.username || 'Chưa ký' },
          ],
          margin: [0, 0, 0, 20],
        },
        // Mô tả
        ...((report as any).description ? [{
          text: 'MÔ TẢ',
          style: 'subheader',
          margin: [0, 20, 0, 10],
        }, {
          text: (report as any).description,
          margin: [0, 0, 0, 20],
        }] : []),
        // Tóm tắt
        ...((report as any).summary ? [{
          text: 'TÓM TẮT',
          style: 'subheader',
          margin: [0, 20, 0, 10],
        }, {
          text: (report as any).summary,
          margin: [0, 0, 0, 20],
        }] : []),
        // Footer
        {
          text: `Báo cáo được tạo vào: ${formattedDate}`,
          style: 'footer',
          alignment: 'center',
          margin: [0, 20, 0, 0],
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
        },
        subheader: {
          fontSize: 14,
          bold: true,
        },
        footer: {
          fontSize: 10,
          italics: true,
        },
      },
    };

    return new Promise((resolve, reject) => {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err) => reject(err));
      pdfDoc.end();
    });
  }
}

