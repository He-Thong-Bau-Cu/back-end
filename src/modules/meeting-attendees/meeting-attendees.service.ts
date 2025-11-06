import { Injectable } from '@nestjs/common';
import { CreateMeetingAttendeeDto } from './dto/create-meeting-attendee.dto';
import { UpdateMeetingAttendeeDto } from './dto/update-meeting-attendee.dto';
import { InjectModel } from '@nestjs/mongoose';
import { MeetingAttendees } from 'src/database/schemas/meetingAttendees.schema';
import { Model, Types } from 'mongoose';
import { Meetings } from 'src/database/schemas/meetings.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { MESSAGE } from 'src/common/enums/message.enum';

@Injectable()
export class MeetingAttendeesService {
  constructor(
    @InjectModel(MeetingAttendees.name)
    private readonly meetingAttendeesModel: Model<MeetingAttendees>,
    @InjectModel(Meetings.name)
    private readonly meetingsModel: Model<Meetings>,
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipantsModel: Model<ElectionsParticipants>,
  ) { }

  async findAll() {
    try {
      return await this.meetingAttendeesModel.find()
        .populate('meetingId')
        .populate({
          path: 'participantId',
          populate: [
            { path: 'electionId' },
            { path: 'userId', select: 'fullName username email phone position department' }
          ]
        })
        .exec();
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      return await this.meetingAttendeesModel.findById(id)
        .populate('meetingId')
        .populate({
          path: 'participantId',
          populate: [
            { path: 'electionId' },
            { path: 'userId', select: 'fullName username email phone position department' }
          ]
        })
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
        throw new Error(MESSAGE.MEETING_NOT_FOUND);
      }
      //Check if participantId is exist or IsNotEmpty
      const participantExist = await this.electionParticipantsModel.exists({ _id: createMeetingAttendee.participantId });
      if (!participantExist) {
        throw new Error(MESSAGE.PARTICIPANT_NOT_FOUND);
      }
      return await this.meetingAttendeesModel.create(createMeetingAttendee);
    } catch (error) {
      throw error;
    }
  }

  async updateStatusAttendance(meetingId: string, participantId: string, attended: boolean) {
    try {
      //Check if meetingId is exist or IsNotEmpty
      const meetingExist = await this.meetingsModel.exists({ _id: meetingId });
      if (!meetingExist) {
        throw new Error(MESSAGE.MEETING_NOT_FOUND);
      }
      //Check if participantId is exist or IsNotEmpty
      const participantExist = await this.electionParticipantsModel.exists({ _id: participantId });
      if (!participantExist) {
        throw new Error(MESSAGE.PARTICIPANT_NOT_FOUND);
      }
      return await this.meetingAttendeesModel.findOneAndUpdate(
        { meetingId: meetingId, participantId: participantId },
        { attended: attended },
        { new: true }).exec();

    } catch (error) {
      throw error;
    }
  }

  async update(meetingAttendeeId: string, updateMeetingAttendee: UpdateMeetingAttendeeDto) {
    try {
      //Check if meetingAttendeeId is exist or IsNotEmpty
      const meetingAttendeeExist = await this.meetingAttendeesModel.exists({ _id: meetingAttendeeId });
      if (!meetingAttendeeExist) {
        throw new Error(MESSAGE.MEETING_ATTENDEE_NOT_FOUND);
      }
      return await this.meetingAttendeesModel
        .findByIdAndUpdate(new Types.ObjectId(meetingAttendeeId), updateMeetingAttendee, { new: true })
        .exec();
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

      //

      const meetingAttendees = await this.meetingAttendeesModel.find({ meetingId })
        .populate('meetingId')
        .populate({
          path: 'participantId',
          populate: [
            { path: 'electionId' },
            { path: 'userId', select: 'fullName username email phone position department' },
            { path: 'roleId', select: 'roleName roleCode description status' }
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

    async getByParticipantId(participantId:string){
      try {
        //Check if participantId is exist or IsNotEmpty
        const participantExist = await this.electionParticipantsModel.exists({ _id: participantId });
        if (!participantExist) {
          throw new Error(MESSAGE.PARTICIPANT_NOT_FOUND);
        }

        const meetingAttendees = await this.meetingAttendeesModel.find({ participantId })
        .populate('meetingId')
        .populate({
          path: 'participantId',
          populate: [
            { path: 'electionId' },
            { path: 'userId', select: 'fullName username email phone position department' },
            { path: 'roleId', select: 'roleName roleCode description status' }
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
}
