import { Injectable } from '@nestjs/common';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Meetings } from 'src/database/schemas/meetings.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { MeetingAttendees } from 'src/database/schemas/meetingAttendees.schema';
import { Ballots } from 'src/database/schemas/ballots.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { SearchDTO } from 'src/common/dto/search.dto';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';
import { STATUS } from 'src/common/enums/status.enum';
import { NotificationService } from '../notification/notification.service';
@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meetings.name)
    private readonly meetingsModel: Model<Meetings>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(MeetingAttendees.name)
    private readonly meetingAttendeesModel: Model<MeetingAttendees>,
    @InjectModel(Ballots.name)
    private readonly ballotsModel: Model<Ballots>,
    private readonly notificationService: NotificationService,
  ) { }



  async getById(id: string) {
    try {
      const meeting = await this.meetingsModel
        .findById(new Types.ObjectId(id))
        .populate({
          path: 'electionId',
          select: 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
          populate: [
            { path: "typeId", select: "typeName typeNameCode description status" },
            { path: "votingMethodId", select: "methodName methodCode description status" },
            { path: "thresholdId", select: "thresholdName thresholdCode value description status" },
            { path: 'createdBy', select: 'username fullName position department' },
            { path: 'updatedBy', select: 'username fullName position department' }
          ]
        })
        .exec();
      if (!meeting) {
        throw new Error(MESSAGE.MEETING_NOT_FOUND);
      }
      return meeting;
    } catch (error) {
      throw error;
    }
  }


  async getByElectionId(electionId: string) {
    try {
      // Check if the electionId exists in the database
      const electionExists = await this.electionsModel.exists({ _id: electionId });
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      const meetings = await this.meetingsModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate({
          path: 'electionId',
          select: 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
          populate: [
            { path: "typeId", select: "typeName typeNameCode description status" },
            { path: "votingMethodId", select: "methodName methodCode description status" },
            { path: "thresholdId", select: "thresholdName thresholdCode value description status" },
            { path: 'createdBy', select: 'username fullName position department' },
            { path: 'updatedBy', select: 'username fullName position department' }
          ]
        })
        .exec();
      return meetings;
    } catch (error) {
      throw error;
    }
  }


  async create(createMeeting: CreateMeetingDto, userId: string) {
    try {
      // Check if the electionId exists in the database
      const electionExists = await this.electionsModel.exists({ _id: createMeeting.electionId });
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      //Check meeting is exist
      const meetingExists = await this.meetingsModel.exists({
        electionId: new Types.ObjectId(createMeeting.electionId),
      });
      if (meetingExists) {
        throw new Error(MESSAGE.MEETING_ALREADY_EXISTS);
      }

      const meeting = await this.meetingsModel.create({
        ...createMeeting,
        electionId: new Types.ObjectId(createMeeting.electionId),
        createdBy: userId ? new Types.ObjectId(userId) : null,
      });
      return meeting;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateMeeting: UpdateMeetingDto, userId: string) {
    try {
      // Check if the meeting exists
      const meetingExists = await this.meetingsModel.exists({ _id: id });
      if (!meetingExists) {
        throw new Error(MESSAGE.MEETING_NOT_FOUND);
      }
      const updatedMeeting = await this.meetingsModel
        .findByIdAndUpdate(new Types.ObjectId(id), {
          ...updateMeeting,
          electionId: updateMeeting.electionId ? new Types.ObjectId(updateMeeting.electionId) : null,
          updatedBy: userId ? new Types.ObjectId(userId) : null,
        }, { new: true })
        .populate({
          path: "electionId",
          select: 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
          populate: [
            { path: "typeId", select: "typeName typeNameCode description status" },
            { path: "votingMethodId", select: "methodName methodCode description status" },
            { path: "thresholdId", select: "thresholdName thresholdCode value description status" },
            { path: 'createdBy', select: 'username fullName position department' },
            { path: 'updatedBy', select: 'username fullName position department' }
          ]
        })
        .exec();
      //Kiểm tra nếu updatedMeeting tồn tại
      if (!updatedMeeting) {
        throw new Error(MESSAGE.MEETING_NOT_FOUND);
      }

      const electionId = this.extractElectionId(updatedMeeting.electionId);
      if (electionId) {
        await this.emitEventManagementUpdate(electionId, 'meeting-updated');
      }

      return updatedMeeting;
    }
    catch (error) {
      throw error;
    }
  }

  async search(req: BaseSearchDTO) {
    try {
      const keyword = req.keyword.normalize("NFC");
      //search theo election
      const matchedElections = await this.electionsModel
        .find({
          title: { $regex: keyword, $options: 'i' },
          decisionName: { $regex: keyword, $options: 'i' },
        })
        .exec();
      const electionIds = matchedElections.map(election => election._id);
      //search theo meeting
      const matchedMeetings = await this.meetingsModel
        .find({
          $or: [
            { title: { $regex: keyword, $options: 'i' } },
            { location: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
            { status: { $regex: keyword, $options: 'i' } },
          ]
        })
        .exec();
      const meetingIds = matchedMeetings.map(meeting => meeting._id);
      let OR: any[] = [];
      if (electionIds.length > 0) {
        OR.push({ electionId: { $in: electionIds } });
      }
      if (meetingIds.length > 0) {
        OR.push({ _id: { $in: meetingIds } });
      }
      const meetings = await this.meetingsModel
        .find({ $or: OR })
        .populate({
          path: 'electionId',
          select: 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
          populate: [
            { path: "typeId", select: "typeName typeNameCode description status" },
            { path: "votingMethodId", select: "methodName methodCode description status" },
            { path: "thresholdId", select: "thresholdName thresholdCode value description status" },
            { path: 'createdBy', select: 'username fullName position department' },
            { path: 'updatedBy', select: 'username fullName position department' }
          ]
        })
        .exec();
      return meetings;


    } catch (error) {
      throw error;
    }
  }

  async getEventManagementStats(electionId: string) {
    try {
      // Check if the electionId exists
      const electionExists = await this.electionsModel.exists({ _id: electionId });
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      // Get meeting by electionId
      const meeting = await this.meetingsModel
        .findOne({ electionId: new Types.ObjectId(electionId) })
        .populate({
          path: 'electionId',
          select: 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        })
        .exec();

      if (!meeting) {
        throw new Error(MESSAGE.MEETING_NOT_FOUND);
      }

      // Get total attendees count
      const totalAttendees = await this.meetingAttendeesModel.countDocuments({
        meetingId: meeting._id,
      });

      // Get checked-in count (attended = true)
      const checkedInCount = await this.meetingAttendeesModel.countDocuments({
        meetingId: meeting._id,
        attended: true,
      });

      // Get voted count (ballots with status = CAST)
      const votedCount = await this.ballotsModel.countDocuments({
        electionId: new Types.ObjectId(electionId),
        status: STATUS.CAST,
      });

      // Calculate percentages
      const checkinPercent = totalAttendees > 0
        ? Math.round((checkedInCount / totalAttendees) * 100)
        : 0;

      const votePercent = totalAttendees > 0
        ? Math.round((votedCount / totalAttendees) * 100)
        : 0;

      // Get election info
      const election = await this.electionsModel.findById(electionId).exec();

      // Calculate time left (if meeting is in progress)
      let timeLeft = 0;
      let isRunning = false;
      if (meeting.meetingDate && election?.endDate) {
        const now = new Date();
        const endDate = new Date(election.endDate);
        if (endDate > now) {
          timeLeft = Math.floor((endDate.getTime() - now.getTime()) / 1000);
          // Check if meeting is running (ONGOING status means active)
          isRunning = meeting.status === STATUS.ONGOING ||
                     meeting.status === STATUS.ACTIVE ||
                     meeting.status === 'ONGOING' ||
                     meeting.status === 'in_progress';
        }
      }

      return {
        meeting: {
          _id: meeting._id,
          title: meeting.title,
          meetingDate: meeting.meetingDate,
          location: meeting.location,
          status: meeting.status,
          electionId: meeting.electionId,
        },
        election: {
          _id: election?._id,
          title: election?.title,
          startDate: election?.startDate,
          endDate: election?.endDate,
          status: election?.status,
          statusData: election?.statusData,
          timeline: election?.timeline || {},
          stages: election?.stages || {},
        },
        stats: {
          totalAttendees,
          checkedInCount,
          votedCount,
          checkinPercent,
          votePercent,
          timeLeft,
          isRunning,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async updateStatus(meetingId: string, status: string, userId: string) {
    try {
      const meetingExists = await this.meetingsModel.exists({ _id: meetingId });
      if (!meetingExists) {
        throw new Error(MESSAGE.MEETING_NOT_FOUND);
      }

      const updatedMeeting = await this.meetingsModel
        .findByIdAndUpdate(
          new Types.ObjectId(meetingId),
          {
            status: status,
            updatedBy: userId ? new Types.ObjectId(userId) : null,
          },
          { new: true }
        )
        .populate({
          path: 'electionId',
          select: 'title startDate endDate delegationStart delegationEnd status statusData decisionNumber decisionName',
        })
        .exec();

      if (!updatedMeeting) {
        throw new Error(MESSAGE.MEETING_NOT_FOUND);
      }

      const electionId = this.extractElectionId(updatedMeeting.electionId);
      if (electionId) {
        await this.emitEventManagementUpdate(electionId, 'meeting-status-updated');

        // Gọi socket transferStateDataRT sau khi đổi trạng thái
        try {
          const statsData = await this.getEventManagementStats(electionId);
          await this.notificationService.transferStateDataRT(electionId, {
            type: 'meeting-status-changed',
            electionId,
            payload: statsData,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to emit transferStateDataRT:', error.message || error);
        }
      }

      return updatedMeeting;
    } catch (error) {
      throw error;
    }
  }

  private extractElectionId(electionId: any): string | null {
    if (!electionId) {
      return null;
    }

    if (typeof electionId === 'string') {
      return electionId;
    }

    if (electionId instanceof Types.ObjectId) {
      return electionId.toString();
    }

    if (typeof electionId === 'object' && '_id' in electionId) {
      return String((electionId as any)._id);
    }

    return null;
  }

  private async emitEventManagementUpdate(electionId: string, eventType: string) {
    try {
      const snapshot = await this.getEventManagementStats(electionId);
      this.notificationService.transferDataRealTime(electionId, {
        type: eventType,
        electionId,
        payload: snapshot,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Failed to emit realtime update (${eventType}):`, error.message || error);
    }
  }
}
