import { Injectable } from '@nestjs/common';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Meetings } from 'src/database/schemas/meetings.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { SearchDTO } from 'src/common/dto/search.dto';
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
            {path:'createdBy', select:'username fullName position department'},
            {path:'updatedBy', select:'username fullName position department'}
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
            {path:'createdBy', select:'username fullName position department'},
            {path:'updatedBy', select:'username fullName position department'}
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
}
