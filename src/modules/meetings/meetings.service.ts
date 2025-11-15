import { Injectable } from '@nestjs/common';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Meetings } from 'src/database/schemas/meetings.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { SearchDTO } from 'src/common/dto/search.dto';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';
@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meetings.name)
    private readonly meetingsModel: Model<Meetings>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
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
        .exec();

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
}
