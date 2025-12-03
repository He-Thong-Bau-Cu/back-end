import { Injectable } from '@nestjs/common';
import { CreateMeetingAttendeeDto } from './dto/create-meeting-attendee.dto';
import { UpdateMeetingAttendeeDto } from './dto/update-meeting-attendee.dto';
import { InjectModel } from '@nestjs/mongoose';
import { MeetingAttendees } from 'src/database/schemas/meetingAttendees.schema';
import { Model, Types } from 'mongoose';
import { Meetings } from 'src/database/schemas/meetings.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { paginate } from 'src/common/dto/paignation';
import { Elections } from 'src/database/schemas/elections.schema';
import { NotificationGateway } from '../notification/notification.gateway';
import { Ballots } from 'src/database/schemas/ballots.schema';
import { STATUS } from 'src/common/enums/status.enum';
import { Voters } from 'src/database/schemas/voters.schema';
import { getCurrentDateVN } from 'src/common/utils/format';

@Injectable()
export class MeetingAttendeesService {
  constructor(
    @InjectModel(MeetingAttendees.name)
    private readonly meetingAttendeesModel: Model<MeetingAttendees>,
    @InjectModel(Meetings.name)
    private readonly meetingsModel: Model<Meetings>,
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipantsModel: Model<ElectionsParticipants>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    private readonly notificationGateway: NotificationGateway,
    @InjectModel(Ballots.name)
    private readonly ballotsModel: Model<Ballots>,
    @InjectModel(Voters.name)
    private readonly voterModels: Model<Voters>,
  ) { }

  async findAll() {
    try {
      const meetingAttendees = await this.meetingAttendeesModel.find()
        .populate('meetingId')
        .populate({
          path: 'participantId',
          populate: [
            { path: 'electionId' },
            { path: 'userId', select: 'fullName username email phone position department' }
          ]
        })
        .exec();
      return paginate(meetingAttendees);
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      return await this.meetingAttendeesModel.findById(new Types.ObjectId(id))
        .populate('meetingId')
        .populate({
          path: 'participantId',
          populate: [
            { path: 'electionId' },
            { path: 'userId', select: 'fullName username email phone position department' },
            { path: 'createdBy', select: 'username fullName position department' },
            { path: 'updatedBy', select: 'username fullName position department' }
          ]
        })
        .exec();
    } catch (error) {
      throw error;
    }
  }

  async create(createMeetingAttendee: CreateMeetingAttendeeDto, userId: string) {
    try {
      //Check if meetingId is exist or IsNotEmpty
      const meetingExist = await this.meetingsModel.exists({ _id: createMeetingAttendee.meetingId });
      if (!meetingExist) {
        throw new Error(MESSAGE.MEETING_NOT_FOUND);
      }
      //Check if participantId is exist or IsNotEmpty
      const participantExist = await this.electionParticipantsModel.exists({ _id: createMeetingAttendee.participantId });
      if (!participantExist) {
        throw new Error(MESSAGE.ELECTION_PARTICIPANT_NOT_FOUND);
      }
      const meetingAttendee = await this.meetingAttendeesModel.create({
        ...createMeetingAttendee,
        meetingId: new Types.ObjectId(createMeetingAttendee.meetingId),
        participantId: new Types.ObjectId(createMeetingAttendee.participantId),
        createdBy: userId ? new Types.ObjectId(userId) : null,
      });

      // Populate để có đầy đủ thông tin
      const populatedAttendee = await this.meetingAttendeesModel
        .findById(meetingAttendee._id)
        .populate('meetingId')
        .populate({
          path: 'participantId',
          populate: [
            { path: 'electionId' },
            { path: 'userId', select: 'fullName username email phone position department' }
          ]
        })
        .exec();

      // Emit socket để cập nhật thống kê realtime
      try {
        const meeting = await this.meetingsModel.findById(createMeetingAttendee.meetingId).lean();
        if (meeting && meeting.electionId) {
          const electionId = meeting.electionId.toString();
          // Lấy thống kê mới nhất
          const totalAttendees = await this.meetingAttendeesModel.countDocuments({
            meetingId: new Types.ObjectId(createMeetingAttendee.meetingId),
          });
          const attendedCount = await this.meetingAttendeesModel.countDocuments({
            meetingId: new Types.ObjectId(createMeetingAttendee.meetingId),
            attended: true,
          });

          // Emit socket để cập nhật thống kê
          this.notificationGateway.dataToElectionId(electionId, {
            type: 'checkin-update',
            meetingId: createMeetingAttendee.meetingId,
            stats: {
              total: totalAttendees,
              attended: attendedCount,
              notAttended: totalAttendees - attendedCount,
            },
            attendee: populatedAttendee,
          });
        }
      } catch (socketError) {
        console.error('Error emitting socket:', socketError);
        // Không throw error vì đây chỉ là thông báo realtime
      }

      return populatedAttendee || meetingAttendee;
    } catch (error) {
      throw error;
    }
  }

  async checkIn(electionId: string, userId: string, updatedBy: string) {
    try {
      const electionParticipant = await this.electionParticipantsModel.findOne({
        electionId: new Types.ObjectId(electionId),
        userId: new Types.ObjectId(userId),
      }).exec();

      if (!electionParticipant) {
        throw new Error(MESSAGE.ELECTION_PARTICIPANT_NOT_FOUND || "Không tìm thấy người tham gia trong cuộc bầu cử");
      }

      const meeting = await this.meetingsModel.findOne({
        electionId: new Types.ObjectId(electionId),
      }).exec();

      if (!meeting) {
        throw new Error(MESSAGE.MEETING_NOT_FOUND || "Không tìm thấy cuộc họp");
      }

      const meetingAttendee = await this.meetingAttendeesModel.findOneAndUpdate(
        {
          meetingId: meeting._id,
          participantId: electionParticipant._id,
        },
        {
          attended: true,
          checkInTime: getCurrentDateVN(),
          updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : null,
        },
        { new: true }
      )
        .populate('meetingId')
        .populate({
          path: 'participantId',
          populate: [
            { path: 'electionId' },
            { path: 'userId', select: 'fullName username email phone position department' }
          ]
        })
        .exec();

      if (!meetingAttendee) {
        throw new Error(MESSAGE.MEETING_ATTENDEE_NOT_FOUND || "Không tìm thấy bản ghi tham gia cuộc họp");
      }

      const voter = await this.voterModels.findOne({
        electionId: electionParticipant.electionId,
        userId: electionParticipant.userId
      });
      if (!voter) {
        throw new Error("Không tìm thấy cử tri tương ứng với người tham dự cuộc họp để tạo phiếu bầu");
      }

      if (meetingAttendee) {
        const ballot = await this.ballotsModel.create({
          electionId: electionParticipant.electionId,
          voterId: voter._id,
          status: STATUS.PENDING,
          issuedAt: getCurrentDateVN(),
          createdBy: userId ? new Types.ObjectId(userId) : null,
        });
        if (!ballot) {
          throw new Error("Không thể tạo phiếu bầu");
        }

      } else {
        throw new Error(MESSAGE.MEETING_ATTENDEE_NOT_FOUND);
      }

      // Emit socket để cập nhật thống kê realtime
      try {
        const electionIdStr = electionId.toString();
        // Lấy thống kê mới nhất
        const totalAttendees = await this.meetingAttendeesModel.countDocuments({
          meetingId: meeting._id,
        });
        const attendedCount = await this.meetingAttendeesModel.countDocuments({
          meetingId: meeting._id,
          attended: true,
        });

        // Emit socket để cập nhật thống kê
        this.notificationGateway.dataToElectionId(electionIdStr, {
          type: 'checkin-update',
          meetingId: meeting._id,
          stats: {
            total: totalAttendees,
            attended: attendedCount,
            notAttended: totalAttendees - attendedCount,
          },
          attendee: meetingAttendee,
        });
      } catch (socketError) {
        console.error('Error emitting socket:', socketError);
        // Không throw error vì đây chỉ là thông báo realtime
      }

      return meetingAttendee;
    } catch (error) {
      throw error;
    }
  }

  async updateStatusAttendance(meetingId: string, participantId: string, attended: boolean, userId: string) {
    try {
      console.log("attended", attended);
      //Check if meetingId is exist or IsNotEmpty
      const meetingExist = await this.meetingsModel.exists({ _id: meetingId });
      if (!meetingExist) {
        throw new Error(MESSAGE.MEETING_NOT_FOUND);
      }
      //Check if participantId is exist or IsNotEmpty
      const participantExist = await this.electionParticipantsModel.exists({ _id: participantId });
      if (!participantExist) {
        throw new Error(MESSAGE.ELECTION_PARTICIPANT_NOT_FOUND);
      }
      const meetingAttendee = await this.meetingAttendeesModel.findOneAndUpdate(
        {
          meetingId: new Types.ObjectId(meetingId),
          participantId: new Types.ObjectId(participantId)
        },
        {
          attended: attended,
          updatedBy: userId ? new Types.ObjectId(userId) : null,
        },
        { new: true })
        .populate('meetingId')
        .populate({
          path: 'participantId',
          populate: [
            { path: 'electionId' },
            { path: 'userId', select: 'fullName username email phone position department' }
          ]
        })
        .exec();
      //Check if meetingAttendee is exist or IsNotEmpty
      if (!meetingAttendee) {
        throw new Error(MESSAGE.MEETING_ATTENDEE_NOT_FOUND);
      }

      // Emit socket để cập nhật thống kê realtime
      try {
        const meeting = await this.meetingsModel.findById(meetingId).lean();
        if (meeting && meeting.electionId) {
          const electionId = meeting.electionId.toString();
          // Lấy thống kê mới nhất
          const totalAttendees = await this.meetingAttendeesModel.countDocuments({
            meetingId: new Types.ObjectId(meetingId),
          });
          const attendedCount = await this.meetingAttendeesModel.countDocuments({
            meetingId: new Types.ObjectId(meetingId),
            attended: true,
          });

          // Emit socket để cập nhật thống kê
          this.notificationGateway.dataToElectionId(electionId, {
            type: 'checkin-update',
            meetingId: meetingId,
            stats: {
              total: totalAttendees,
              attended: attendedCount,
              notAttended: totalAttendees - attendedCount,
            },
            attendee: meetingAttendee,
          });
        }
      } catch (socketError) {
        console.error('Error emitting socket:', socketError);
        // Không throw error vì đây chỉ là thông báo realtime
      }

      return meetingAttendee;
    } catch (error) {
      throw error;
    }
  }

  async updateAttendedTrue(meetingId: string, participantId: string, userId: string) {
    try {
      //Check if meetingId is exist or IsNotEmpty
      const meetingExist = await this.meetingsModel.findById(new Types.ObjectId(meetingId));
      if (!meetingExist) {
        throw new Error(MESSAGE.MEETING_NOT_FOUND);
      }
      //Check if participantId is exist or IsNotEmpty
      const participantExist = await this.electionParticipantsModel.findById(new Types.ObjectId(participantId));
      if (!participantExist) {
        throw new Error(MESSAGE.ELECTION_PARTICIPANT_NOT_FOUND);
      }
      console.log("meeting: ", meetingExist);
      console.log("participantExist: ", participantExist);

      //Tìm voter tương ứng với participantId và electionId
      const voter = await this.voterModels.findOne({
        electionId: participantExist.electionId,
        userId: participantExist.userId
      });
      if (!voter) {
        throw new Error("Không tìm thấy cử tri tương ứng với người tham dự cuộc họp để tạo phiếu bầu");
      }


      const meetingAttendee = await this.meetingAttendeesModel.findOneAndUpdate(
        {
          meetingId: new Types.ObjectId(meetingId),
          participantId: new Types.ObjectId(participantId)
        },
        {

          attended: true,
          checkInTime: getCurrentDateVN(),
          updatedBy: userId ? new Types.ObjectId(userId) : null,
        },
        { new: true })
        .populate('meetingId')
        .populate({
          path: 'participantId',
          populate: [
            { path: 'electionId' },
            { path: 'userId', select: 'fullName username email phone position department' }
          ]
        })
        .exec();
      //Check if meetingAttendee is exist or IsNotEmpty
      if (meetingAttendee) {
        const ballot = await this.ballotsModel.create({
          electionId: participantExist.electionId,
          voterId: voter._id,
          status: STATUS.PENDING,
          issuedAt: getCurrentDateVN(),
          createdBy: userId ? new Types.ObjectId(userId) : null,
        });
        if (!ballot) {
          throw new Error("Không thể tạo phiếu bầu");
        }

      } else {
        throw new Error(MESSAGE.MEETING_ATTENDEE_NOT_FOUND);
      }
      return meetingAttendee;
    } catch (error) {
      throw error;
    }
  }

  async update(meetingAttendeeId: string, updateMeetingAttendee: UpdateMeetingAttendeeDto, userId: string) {
    try {
      //Check if meetingAttendeeId is exist or IsNotEmpty
      const meetingAttendeeExist = await this.meetingAttendeesModel.exists({ _id: meetingAttendeeId });
      if (!meetingAttendeeExist) {
        throw new Error(MESSAGE.MEETING_ATTENDEE_NOT_FOUND);
      }
      const meetingAttendee = await this.meetingAttendeesModel
        .findByIdAndUpdate(new Types.ObjectId(meetingAttendeeId), {
          ...updateMeetingAttendee,
          meetingId: updateMeetingAttendee.meetingId ? new Types.ObjectId(updateMeetingAttendee.meetingId) : null,
          participantId: updateMeetingAttendee.participantId ? new Types.ObjectId(updateMeetingAttendee.participantId) : null,
          updatedBy: userId ? new Types.ObjectId(userId) : null,
        }, { new: true })
        .populate('meetingId')
        .populate({
          path: 'participantId',
          populate: [
            { path: 'electionId' },
            { path: 'userId', select: 'fullName username email phone position department' }
          ]
        })
        .exec();
      //Kiểm tra nếu meetingAttendee tồn tại
      if (!meetingAttendee) {
        throw new Error(MESSAGE.MEETING_ATTENDEE_NOT_FOUND);
      }
      return meetingAttendee;
    } catch (error) {
      throw error;
    }
  }

  async getByMeetingId(meetingId: string) {
    try {
      //Check if meetingId is exist or IsNotEmpty
      const meetingExist = await this.meetingsModel.exists({ _id: meetingId });
      if (!meetingExist) {
        throw new Error(MESSAGE.MEETING_NOT_FOUND);
      }


      const meetingAttendees = await this.meetingAttendeesModel
        .find({ meetingId: new Types.ObjectId(meetingId) })
        .populate({
          path: 'meetingId',
          select: 'title meetingDate location status electionId',
          populate: {
            path: 'electionId',
            select: 'title decisionName decisionNumber'
          }
        })
        .populate({
          path: 'participantId',
          populate: [
            {
              path: 'electionId',
              select: 'title decisionName decisionNumber startDate endDate'
            },
            {
              path: 'userId',
              select: 'fullName username email phone position department'
            },
            {
              path: 'roleId',
              select: 'roleName roleCode description status'
            },
            {
              path: 'createdBy',
              select: 'username fullName position department'
            },
            {
              path: 'updatedBy',
              select: 'username fullName position department'
            }
          ]
        })
        .sort({ createdAt: -1 }) // Sắp xếp theo thời gian tạo mới nhất
        .exec();

      // Trả về mảng rỗng nếu không có dữ liệu thay vì throw error
      return meetingAttendees || [];
    } catch (error) {
      throw error;
    }

  }

  async getByParticipantId(participantId: string) {
    try {
      //Check if participantId is exist or IsNotEmpty
      const participantExist = await this.electionParticipantsModel.exists({ _id: participantId });
      if (!participantExist) {
        throw new Error(MESSAGE.ELECTION_PARTICIPANT_NOT_FOUND);
      }

      const meetingAttendees = await this.meetingAttendeesModel
        .find({ participantId: new Types.ObjectId(participantId) })
        .populate('meetingId')
        .populate({
          path: 'participantId',
          populate: [
            { path: 'electionId' },
            { path: 'userId', select: 'fullName username email phone position department' },
            { path: 'roleId', select: 'roleName roleCode description status' },
            { path: 'createdBy', select: 'username fullName position department' },
            { path: 'updatedBy', select: 'username fullName position department' }
          ]
        })
        .exec();

      //Check if meetingAttendees is exist or IsNotEmpty
      if (!meetingAttendees) {
        throw new Error(MESSAGE.MEETING_ATTENDEE_NOT_FOUND);
      }

      return meetingAttendees;

    } catch (error) {
      throw error;
    }
  }

  async getParticipantsNotAttended(electionId: string) {
    try {
      //Kiểm tra xem electionId có tồn tại không
      const electionExist = await this.electionsModel.exists({ _id: electionId });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      //Kiểm tra xem election đấy có cuộc họp nào không
      const meeting = await this.meetingsModel.findOne({ electionId: new Types.ObjectId(electionId) });
      if (!meeting) {
        throw new Error("Không tìm thấy cuộc họp nào cho kỳ bầu cử này");
      }
      //Tìm những participant chưa tham gia cuộc họp
      const attendees = await this.meetingAttendeesModel.find({ meetingId: meeting._id, attended: false })
        .populate('participantId')
        .populate({
          path: 'meetingId',
          populate: [
            {
              path: 'electionId',
              select: 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName'
            },]
        })
        .exec();
      return paginate(attendees);
    } catch (error) {
      throw error;
    }
  }

  async getParticipantsAttended(electionId: string) {
    try {
      //Kiểm tra xem electionId có tồn tại không
      const electionExist = await this.electionsModel.exists({ _id: electionId });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      //Kiểm tra xem election đấy có cuộc họp nào không
      const meeting = await this.meetingsModel.findOne({ electionId: new Types.ObjectId(electionId) });
      if (!meeting) {
        throw new Error("Không tìm thấy cuộc họp nào cho kỳ bầu cử này");
      }
      //Tìm những participant đã tham gia cuộc họp
      const attendees = await this.meetingAttendeesModel.find({ meetingId: meeting._id, attended: true })
        .populate({
          path: 'participantId',
          populate: [
            { path: 'electionId' },
            { path: 'userId', select: 'fullName username email phone position department' },
            { path: 'roleId', select: 'roleName roleCode description status' },
            { path: 'createdBy', select: 'username fullName position department' },
            { path: 'updatedBy', select: 'username fullName position department' }
          ]
        })
        .populate({
          path: 'meetingId',
          populate: [
            {
              path: 'electionId',
              select: 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName'
            },
          ]
        })
        .exec();
      return paginate(attendees);
    } catch (error) {
      throw error;
    }
  }
}
