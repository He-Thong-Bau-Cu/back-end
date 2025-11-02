import { Injectable } from '@nestjs/common';
import { CreateMeetingDto } from './dto/create-meeting.dto';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Meetings } from 'src/database/schemas/meetings.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meetings.name)
    private readonly meetingsModel: Model<Meetings>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
  ) { }

  async create(createMeeting: CreateMeetingDto) {
    try {
      // Check if the electionId exists in the database
      const electionExists = await this.electionsModel.exists({ _id: createMeeting.electionId });
      console.log("createMeeting", createMeeting);
      console.log("electionExists", electionExists);
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      const meeting = await this.meetingsModel.create(createMeeting);
      return meeting;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateMeeting: UpdateMeetingDto) {
    try {
      // Check if the meeting exists
      const meetingExists = await this.meetingsModel.exists({ _id: id });
      if (!meetingExists) {
        throw new Error(MESSAGE.MEETING_NOT_FOUND);
      }
      const updatedMeeting = await this.meetingsModel
        .findByIdAndUpdate(new Types.ObjectId(id), updateMeeting, { new: true })
        .exec();
      return updatedMeeting;
    }
    catch (error) {
      throw error;
    }
  }
}
