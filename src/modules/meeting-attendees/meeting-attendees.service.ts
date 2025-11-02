import { Injectable } from '@nestjs/common';
import { CreateMeetingAttendeeDto } from './dto/create-meeting-attendee.dto';
import { UpdateMeetingAttendeeDto } from './dto/update-meeting-attendee.dto';
import { InjectModel } from '@nestjs/mongoose';
import { MeetingAttendees } from 'src/database/schemas/meetingAttendees.schema';
import { Model, Types } from 'mongoose';
import { Meetings } from 'src/database/schemas/meetings.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';

@Injectable()
export class MeetingAttendeesService {
  constructor(
    @InjectModel(MeetingAttendees.name)
    private readonly meetingAttendeesModel: Model<MeetingAttendees>,
    @InjectModel(Meetings.name)
    private readonly meetingsModel: Model<Meetings>,
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipantsModel: Model<ElectionsParticipants>,
  ) {}

  async findAll(){
    try {
      return await this.meetingAttendeesModel.find()
      .populate('meetingId')
      .populate('participantId')
      .exec();
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      return await this.meetingAttendeesModel.findById(id)
      .populate('meetingId')
      .populate('participantId')
      .exec();
    } catch (error) {
      throw error;
    }
  }

  async create(createMeetingAttendee: CreateMeetingAttendeeDto) {
    try {
      //Check if meetingId is exist or IsNotEmpty
      const meetingExist = await this.meetingsModel.exists({ _id: createMeetingAttendee.meetingId });
      if (!meetingExist) {
        throw new Error('Meeting not found');
      }
      //Check if participantId is exist or IsNotEmpty
      const participantExist = await this.electionParticipantsModel.exists({ _id: createMeetingAttendee.participantId });
      if (!participantExist) {
        throw new Error('Participant not found');
      }
      return await this.meetingAttendeesModel.create(createMeetingAttendee);
    } catch (error) {
      throw error;
    }
  }

  async updateStatusAttendance(meetingId:string, participantId:string, attended:boolean) {
    try {
      //Check if meetingId is exist or IsNotEmpty
      const meetingExist = await this.meetingsModel.exists({ _id: meetingId });
      if (!meetingExist) {
        throw new Error('Meeting not found');
      }
      //Check if participantId is exist or IsNotEmpty
      const participantExist = await this.electionParticipantsModel.exists({ _id: participantId });
      if (!participantExist) {
        throw new Error('Participant not found');
      }
     return await this.meetingAttendeesModel.findOneAndUpdate(
      {meetingId:meetingId, participantId:participantId},
      {attended:attended},
      {new: true}).exec();
      
    } catch (error) {
      throw error;
    }
  }

  async update(meetingAttendeeId:string, updateMeetingAttendee: UpdateMeetingAttendeeDto) {
    try {
      //Check if meetingAttendeeId is exist or IsNotEmpty
      const meetingAttendeeExist = await this.meetingAttendeesModel.exists({ _id: meetingAttendeeId });
      if (!meetingAttendeeExist) {
        throw new Error('Meeting Attendee not found');
      }
      return await this.meetingAttendeesModel
      .findByIdAndUpdate(new Types.ObjectId(meetingAttendeeId), updateMeetingAttendee,{ new: true })
      .exec();
    } catch (error) {
      throw error;
    }
  }
}
