import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { paginate } from 'src/common/dto/paignation';
import { SearchDTO } from 'src/common/dto/search.dto';
import { STATUS, STATUS_SYSTEM } from 'src/common/enums/status.enum';
import { formatDateVN } from 'src/common/utils/format';
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

@Injectable()
export class SystemService {
  constructor(
    @InjectModel(AuditLogs.name) private readonly auditLogsModel: Model<AuditLogsDocument>,
    @InjectModel(Elections.name) private readonly electionsModel: Model<ElectionsDocument>,
    @InjectModel(Voters.name) private readonly votersModel: Model<VotersDocument>,
    @InjectModel(Users.name) private readonly usersModel: Model<UserDocument>,
    @InjectModel(Results.name) private readonly resultsModel: Model<ResultsDocument>,
    @InjectModel(SystemLog.name) private readonly systemLogModel: Model<SystemLogDocument>,
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipantsModel: Model<ElectionsParticipantsDocument>,
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
      const systemLogData = await this.systemLogModel
        .find({
          createdAt: { $gte: from, $lte: to },
          statusCode: { $gte: statusCodeRange[0], $lte: statusCodeRange[1] },
        })
        .exec();
      return paginate(systemLogData, req.page, req.limit);
    } catch (e) {
      throw e;
    }
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
      const remainingTime = poll.endDate ? formatDateVN(new Date(poll.endDate)) : 'N/A';
      return {
        name: poll.title,
        remainingTime: remainingTime,
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
}
