import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { Voters } from 'src/database/schemas/voters.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { Roles } from 'src/database/schemas/roles.schema';
import { Ballots } from 'src/database/schemas/ballots.schema';
import { SystemLog } from 'src/database/schemas/systemLog.schema';
import { STATUS } from 'src/common/enums/status.enum';
import { USER_ROLE } from 'src/common/enums/config.enum';
import { MESSAGE } from 'src/common/enums/message.enum';
import { CLIENT_RENEG_LIMIT } from 'tls';
import { Delegations } from 'src/database/schemas/delegations.schema';
import { MeetingAttendees } from 'src/database/schemas/meetingAttendees.schema';
import { VotingMethods } from 'src/database/schemas/votingMethods.schema';
import { Meetings } from 'src/database/schemas/meetings.schema';
import { AuditLogs } from 'src/database/schemas/auditLogs.schema';
import { getCurrentDateVN } from 'src/common/utils/format';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(Voters.name)
    private readonly votersModel: Model<Voters>,
    @InjectModel(ElectionsParticipants.name)
    private readonly participantsModel: Model<ElectionsParticipants>,
    @InjectModel(Roles.name)
    private readonly rolesModel: Model<Roles>,
    @InjectModel(Ballots.name)
    private readonly ballotsModel: Model<Ballots>,
    @InjectModel(SystemLog.name)
    private readonly systemLogModel: Model<SystemLog>,
    @InjectModel(Delegations.name)
    private readonly delegationsModel: Model<Delegations>,
    @InjectModel(MeetingAttendees.name)
    private readonly meetingAttendeeModel: Model<MeetingAttendees>,
    @InjectModel(VotingMethods.name)
    private readonly votingMethodsModel: Model<VotingMethods>,
    @InjectModel(Meetings.name)
    private readonly meetingsModel: Model<Meetings>,
    @InjectModel(AuditLogs.name)
    private readonly auditLogsModel: Model<AuditLogs>,
  ) { }

  async getDashboardPreside() {
    try {
      const [
        totalElections,
        totalVoters,
        pendingApprovals,
      ] = await Promise.all([
        this.electionsModel.countDocuments(),
        this.votersModel.countDocuments(),
        this.electionsModel.countDocuments({ statusData: STATUS.WAIT_APPROVAL }),
      ]);

      //Lấy tông số hoạt động trong tháng
      let totalActivitiesThisMonth: number | null = null;
      try {
        const now = getCurrentDateVN();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
        totalActivitiesThisMonth = await this.systemLogModel.countDocuments({
          createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
        });
      } catch (error) {
        totalActivitiesThisMonth = null;
      }

      //Tỷ lệ tham gia bầu cử
      let participationRate = 0;
      try {
        const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });
        if (voterRole) {
          const participationActive = await this.participantsModel.countDocuments({
            status: STATUS.ACTIVE,
            roleId: voterRole._id
          });
          const totalParticipants = await this.participantsModel.countDocuments({ roleId: voterRole._id });
          participationRate = (participationActive / totalParticipants) * 100;
        }
      } catch (error) {
        participationRate = 0;
      }




      return {
        totalElections,
        totalVoters,
        pendingApprovals,
        totalActivitiesThisMonth,
        participationRate,
      };
    } catch (error) {
      throw error;
    }
  }

  async getDashboardPresideByElectionId(electionId: string) {
    try {
      const electionObjectId = new Types.ObjectId(electionId);

      // Kiểm tra election có tồn tại không
      const election = await this.electionsModel.findById(electionObjectId).exec();
      if (!election) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      // Tổng số kỳ bầu cử (chỉ tính election này, nên = 1)
      const totalElections = 1;

      // Tổng số cử tri trong election này
      const totalVoters = await this.votersModel.countDocuments({
        electionId: electionObjectId,
      });

      // Quyết định chờ duyệt (chỉ tính election này)
      const pendingApprovals = await this.electionsModel.countDocuments({
        _id: electionObjectId,
        statusData: STATUS.WAIT_APPROVAL,
      });

      // Lấy tổng số hoạt động trong tháng (có thể filter theo electionId nếu có trong systemLog)
      let totalActivitiesThisMonth: number | null = null;
      try {
        const now = getCurrentDateVN();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
        // Nếu systemLog có electionId thì filter, nếu không thì lấy tất cả
        totalActivitiesThisMonth = await this.systemLogModel.countDocuments({
          createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
        });
      } catch (error) {
        totalActivitiesThisMonth = null;
      }

      // Tỷ lệ tham gia bầu cử (chỉ tính trong election này)
      let participationRate = 0;
      try {
        const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });
        if (voterRole) {
          const participationActive = await this.participantsModel.countDocuments({
            electionId: electionObjectId,
            status: STATUS.ACTIVE,
            roleId: voterRole._id
          });
          const totalParticipants = await this.participantsModel.countDocuments({
            electionId: electionObjectId,
            roleId: voterRole._id
          });
          participationRate = totalParticipants > 0
            ? (participationActive / totalParticipants) * 100
            : 0;
        }
      } catch (error) {
        participationRate = 0;
      }

      return {
        totalElections,
        totalVoters,
        pendingApprovals,
        totalActivitiesThisMonth,
        participationRate,
      };
    } catch (error) {
      throw error;
    }
  }

  async getRecentParticipation() {
    try {
      // Lấy 5 cuộc bầu cử gần nhất (không filter theo status để luôn có data)
      const elections = await this.electionsModel
        .find({ status: { $ne: STATUS.DELETED } }) // Lấy tất cả trừ DELETED
        .sort({ createdAt: -1 }) // Sắp xếp theo ngày tạo mới nhất
        .limit(5)
        .lean();

      const result: any = [];

      for (const election of elections) {
        // Đếm tổng số participants trong election này (đơn giản hơn)
        const totalParticipants = await this.participantsModel.countDocuments({
          electionId: election._id,
        });

        // Đếm số voters (participants có role là VOTER)
        const voterRole = await this.rolesModel.findOne({ roleCode: USER_ROLE.VOTER });
        const totalVoters = voterRole
          ? await this.participantsModel.countDocuments({
              electionId: election._id,
              roleId: voterRole._id,
            })
          : 0;

        result.push({
          title: election.title || election.decisionName || 'Chưa có tên',
          totalParticipants: totalParticipants,
          totalVoters: totalVoters,
        });
      }

      // Nếu không có election nào, trả về data mẫu để luôn có biểu đồ
      if (result.length === 0) {
        result.push({
          title: 'Chưa có cuộc bầu cử',
          totalParticipants: 0,
          totalVoters: 0,
        });
      }

      return result;

    } catch (error) {
      throw error;
    }
  }

  async getBoardOfControlDashboard(electionId: string) {
    try {
      // lấy thông tin cuộc bầu cử
      const election = await this.electionsModel
        .findById(new Types.ObjectId(electionId))
        .exec();
      if (!election) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      // lấy tổng số người tham gia
      const totalVoters = await this.votersModel.countDocuments({
        electionId: election._id,
      });
      const voterActiveCount = await this.votersModel.countDocuments({
        electionId: election._id,
        status: STATUS.ACTIVE,
      });

      // lấy tổng số phiếu hợp lệ và không hợp lệ
      const [validVotes, invalidVotes] = await Promise.all([
        this.ballotsModel.countDocuments({
          electionId: election._id,
          status: { $in: [STATUS.ACTIVE, STATUS.PENDING, STATUS.CAST] }
        }),
        this.ballotsModel.countDocuments({
          electionId: election._id,
          status: { $in: [STATUS.INVALID, STATUS.LOCKED] }
        }),
      ]);
      return {
        electionName: election.title,
        totalVotes: validVotes + invalidVotes,
        totalValidVotes: validVotes,
        totalInvalidVotes: invalidVotes,
        totalVoters,
        voterActiveCount,
      };
    } catch (error) {
      throw error;
    }
  }

  async statisticsDelegations() {
    try {
      //Lấy tất cả ủy Quyền
      const totalDelegations = await this.delegationsModel.find()
        .populate(
          'electionId',
          'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        )
        .populate('delegatorId', 'username fullName email position')
        .populate('delegateId', 'username fullName email position')
        .populate('confirmedBy', 'username fullName email position')
        .populate('documentId', 'title file_url status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      //Tổng số đã phê duyện status = SIGNED
      const totalSigned = await this.delegationsModel.countDocuments({ status: STATUS.SIGNED });
      //Tổng số đang chờ phê duyệt status = CONFIRMED
      const totalConfirmed = await this.delegationsModel.countDocuments({ status: STATUS.CONFIRMED });
      //Tổng số bị từ chối status = REJECTED
      const totalRejected = await this.delegationsModel.countDocuments({ status: STATUS.REJECTED });
      return {
        totalDelegations,
        totalSigned,
        totalConfirmed,
        totalRejected,
      };
    } catch (error) {
      throw error;
    }
  }

  //Thống kế cho thư kí
  async getSecretaryDashboard(electionId: string, userId: string) {
    //tổng số voter tham giao election
    const totalVoters = await this.votersModel.countDocuments({
      electionId: new Types.ObjectId(electionId)
    });

    //Tống số ủy quyền chờ phê duyệt
    const totalConfirmed = await this.delegationsModel.countDocuments({
      electionId: new Types.ObjectId(electionId),
      status: STATUS.CONFIRMED
    });

    //Tổng số cuộc bầu cử user tham gia
    const totalElectionsParticipated = await this.participantsModel.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    return {
      totalVoters,
      totalConfirmed,
      totalElectionsParticipated,
    };

  }

  //Thống kê phiếu bầu cho từng đối tượng trong cuộc bầu cử với votingMethods = CUMULATIVE
  async getCumulativeEntityResults(electionId: string) {
    //kiểm tra electionId có tồn tại không
    const election = await this.electionsModel.findById(new Types.ObjectId(electionId));
    if (!election) {
      throw new Error(MESSAGE.ELECTION_NOT_FOUND);
    }
    const votingMehtod = await this.votingMethodsModel.findById(election.votingMethodId);
    if (!votingMehtod || votingMehtod.methodCode !== 'CUMULATIVE') {
      throw new Error("Api này chỉ áp dụng cho phương thức bầu cử CUMULATIVE.");
    }
    const results = await this.ballotsModel.aggregate([
      {
        $match: {
          electionId: new Types.ObjectId(electionId),
          status: STATUS.CAST
        }
      },
      {
        $unwind: "$allocations"
      },
      {
        $group: {
          _id: "$allocations.entityId",
          totalVotes: { $sum: "$allocations.voteValue" }
        }
      },
      {
        $lookup: {
          from: "electionentities",
          localField: "_id",
          foreignField: "_id",
          as: "entityInfo"
        }
      },
      { $unwind: "$entityInfo" },
      {
        $project: {
          _id: 0,
          entityId: "$_id",
          entityTitle: "$entityInfo.title",
          entityData: "$entityInfo.metaData",
          totalVotes: 1
        }
      }
    ]);

    // Tính tổng của tất cả entity để tính %
    const sumVotes = results.reduce((acc, item) => acc + item.totalVotes, 0);

    // Thêm phần trăm
    const finalResults = results.map(r => ({
      ...r,
      percentage: sumVotes === 0
        ? 0
        : Number(((r.totalVotes / sumVotes) * 100).toFixed(2))
    }));

    return finalResults;
  }

  //Thống kê phiếu bầu cho từng đối tượng trong cuộc bầu cử với votingMethods = YES_NO_ABSTAIN
  async getYesNoEntityResults(electionId: string) {
    //kiểm tra electionId có tồn tại không
    const election = await this.electionsModel.findById(new Types.ObjectId(electionId));
    if (!election) {
      throw new Error(MESSAGE.ELECTION_NOT_FOUND);
    }
    const votingMehtod = await this.votingMethodsModel.findById(election.votingMethodId);
    if (!votingMehtod || votingMehtod.methodCode !== 'YES_NO_ABSTAIN') {
      throw new Error("Api này chỉ áp dụng cho phương thức bầu cử YES_NO_ABSTAIN.");
    }
    const results = await this.ballotsModel.aggregate([
      {
        $match: {
          electionId: new Types.ObjectId(electionId),
          status: STATUS.CAST
        }
      },
      {
        $unwind: "$allocations"
      },
      {
        $group: {
          _id: "$allocations.voteValue",
          total: { $sum: 1 }
        }
      }
    ]);

    // Chuẩn hóa kết quả
    let agree = 0;
    let disagree = 0;
    let abstain = 0;

    for (const r of results) {
      if (r._id == 1) agree = r.total;
      else if (r._id == 0) disagree = r.total;
      else abstain = r.total;  // -1 hoặc null
    }

    const totalVotes = agree + disagree + abstain;

    return {
      agree: {
        votes: agree,
        percentage: totalVotes ? Number(((agree / totalVotes) * 100).toFixed(2)) : 0
      },
      disagree: {
        votes: disagree,
        percentage: totalVotes ? Number(((disagree / totalVotes) * 100).toFixed(2)) : 0
      },
      abstain: {
        votes: abstain,
        percentage: totalVotes ? Number(((abstain / totalVotes) * 100).toFixed(2)) : 0
      }
      };
  }

  // Dashboard cho trưởng ban tổ chức
  async getOrganizerDashboard() {
    try {
      const now = getCurrentDateVN();

      // 1. Đếm sự kiện sắp diễn ra (startDate > now và status = ACTIVE)
      const upcomingEventsCount = await this.electionsModel.countDocuments({
        startDate: { $gt: now },
        status: STATUS.ACTIVE,
      });

      // 2. Đếm sự kiện đang hoạt động (startDate <= now <= endDate và status = ACTIVE, statusData = ONGOING hoặc SCHEDULED)
      const activeEventsCount = await this.electionsModel.countDocuments({
        startDate: { $lte: now },
        endDate: { $gte: now },
        status: STATUS.ACTIVE,
        $or: [
          { statusData: 'ONGOING' },
          { statusData: 'SCHEDULED' },
        ],
      });

      // 3. Tổng số đại biểu/cử tri (tổng số voters trong tất cả elections)
      const totalAttendees = await this.votersModel.countDocuments();

      // 4. Vấn đề cần xử lý (có thể là elections có statusData = WAIT_APPROVAL hoặc có vấn đề)
      const issuesCount = await this.electionsModel.countDocuments({
        statusData: STATUS.WAIT_APPROVAL,
      });

      // 5. Lấy sự kiện đang diễn ra (để hiển thị progress)
      const activeElection = await this.electionsModel
        .findOne({
          startDate: { $lte: now },
          endDate: { $gte: now },
          status: STATUS.ACTIVE,
          $or: [
            { statusData: 'ONGOING' },
            { statusData: 'SCHEDULED' },
          ],
        })
        .sort({ startDate: -1 })
        .lean();

      let eventProgress: {
        title: string;
        checkinPercent: number;
        votePercent: number;
        checkinText: string;
        voteText: string;
      } | null = null;

      if (activeElection) {
        // Lấy meeting của election này
        const meeting = await this.meetingsModel
          .findOne({ electionId: activeElection._id })
          .lean();

        if (meeting) {
          // Đếm attendees
          const totalAttendeesForElection = await this.meetingAttendeeModel.countDocuments({
            meetingId: meeting._id,
          });

          const checkedInCount = await this.meetingAttendeeModel.countDocuments({
            meetingId: meeting._id,
            attended: true,
          });

          // Đếm ballots đã cast
          const votedCount = await this.ballotsModel.countDocuments({
            electionId: activeElection._id,
            status: STATUS.CAST,
          });

          const checkinPercent = totalAttendeesForElection > 0
            ? Math.round((checkedInCount / totalAttendeesForElection) * 100)
            : 0;

          const votePercent = totalAttendeesForElection > 0
            ? Math.round((votedCount / totalAttendeesForElection) * 100)
            : 0;

          eventProgress = {
            title: activeElection.title,
            checkinPercent,
            votePercent,
            checkinText: `${checkedInCount} / ${totalAttendeesForElection} đã check-in`,
            voteText: `${votedCount} / ${totalAttendeesForElection} đã bỏ phiếu`,
          };
        }
      }

      // 6. Lấy danh sách sự kiện sắp diễn ra (5 sự kiện gần nhất)
      const upcomingEvents = await this.electionsModel
        .find({
          startDate: { $gt: now },
          status: STATUS.ACTIVE,
        })
        .sort({ startDate: 1 })
        .limit(5)
        .select('title startDate endDate status statusData')
        .lean();

      const upcomingEventsList = upcomingEvents.map((election) => {
        const startDate = election.startDate ? new Date(election.startDate) : null;
        const formattedTime = startDate
          ? startDate.toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : 'Chưa có thông tin';

        return {
          id: election._id.toString(),
          name: election.title,
          time: `Bắt đầu: ${formattedTime}`,
          status: 'Chưa bắt đầu',
          linkText: 'Chuẩn bị',
        };
      });

      // 7. Lấy hoạt động gần đây từ audit logs (20 hoạt động gần nhất)
      const recentAuditLogs = await this.auditLogsModel
        .find({
          $or: [
            { module: 'MEETING-ATTENDEES' },
            { module: 'MEETINGS' },
            { module: 'ELECTIONS' },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('userId', 'fullName username email')
        .lean();

      const activities = recentAuditLogs.map((log, index) => {
        const userName = (log.userId as any)?.fullName || (log.userId as any)?.username || 'Hệ thống';
        let content = '';
        let type: 'start' | 'group' | 'notify' = 'notify';

        if (log.module === 'MEETING-ATTENDEES' && log.action === 'POST') {
          content = `Đại biểu đã check-in thành công.`;
          type = 'group';
        } else if (log.module === 'MEETINGS' && log.action === 'PATCH') {
          const status = log.new_value?.status || '';
          if (status === 'ONGOING') {
            content = `Bạn đã Bắt đầu sự kiện "${(log.new_value as any)?.title || 'Sự kiện'}".`;
            type = 'start';
          } else if (status === 'POSTPONED') {
            content = `Bạn đã Tạm dừng sự kiện.`;
            type = 'notify';
          }
        } else if (log.module === 'ELECTIONS') {
          content = `Bạn đã thực hiện thao tác trên cuộc bầu cử.`;
          type = 'notify';
        } else {
          content = `Hoạt động hệ thống: ${log.module}`;
        }

        return {
          id: `a${index + 1}`,
          content,
          type,
        };
      });

      return {
        stats: {
          upcomingEvents: upcomingEventsCount,
          activeEvents: activeEventsCount,
          totalAttendees,
          issues: issuesCount,
        },
        eventProgress,
        upcomingEvents: upcomingEventsList,
        activities: activities.slice(0, 10), // Chỉ lấy 10 hoạt động gần nhất
      };
    } catch (error) {
      throw error;
    }
  }

}
