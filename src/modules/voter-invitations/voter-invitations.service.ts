import { Injectable } from '@nestjs/common';
import { CreateVoterInvitationDto } from './dto/create-voter-invitation.dto';
import { UpdateVoterInvitationDto } from './dto/update-voter-invitation.dto';
import { InjectModel } from '@nestjs/mongoose';
import { VoterInvitations } from 'src/database/schemas/voterInvitations.schema';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Voters } from 'src/database/schemas/voters.schema';
import { Elections } from 'src/database/schemas/elections.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { MailService } from '../mail/mail.service';

@Injectable()
export class VoterInvitationsService {
  constructor(
    @InjectModel(VoterInvitations.name)
    private readonly voterInvitationsModel: Model<VoterInvitations>,
    @InjectModel(Voters.name)
    private readonly votersModel: Model<Voters>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) { }

  generateToken(voterId: string, electionId: string): string {
    const payload = { voterId, electionId };
    const token = this.jwtService.sign(payload, { expiresIn: '24h' });
    return token;
  }

  async create(voterInvitation: CreateVoterInvitationDto, userId:string) {
    try {
      // Check if the voterId exists in the database
      const voterExists = await this.votersModel
        .findOne({ _id: voterInvitation.voterId })
        .populate('userId')
        .exec();
      if (!voterExists) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      // Check if the electionId exists in the database
      const electionExists = await this.electionsModel.exists({ _id: voterInvitation.electionId });
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      const token = this.generateToken(voterInvitation.voterId, voterInvitation.electionId);
      const sentAt = new Date();
      const expiresAt = new Date(sentAt.getTime() + 24 * 60 * 60 * 1000);

      //send email
      // await this.mailService.sendMail(
      //   voterExists.userId.email,
      //   voterExists.userId.fullName,
      //   voterExists.userId.username,
      //   voterExists.userId.password,
      // );

      const invitation = await this.voterInvitationsModel.create({
        ...voterInvitation,
        voterId: new Types.ObjectId(voterInvitation.voterId),
        electionId: new Types.ObjectId(voterInvitation.electionId),
        token,
        sentAt,
        expiresAt,
        createdBy: new Types.ObjectId(userId),
      });

      return invitation;
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
      const invitations = await this.voterInvitationsModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('voterId')
        .populate('electionId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      //check if voter invitation not exist
      if (!invitations) {
        throw new Error(MESSAGE.VOTER_INVITATION_NOT_FOUND);
      }
      return invitations;
    } catch (error) {
      throw error;
    }
  }

  async getByVoterId(voterId: string) {
    try {
      // Check if the voterId exists in the database
      const voterExists = await this.votersModel.exists({ _id: voterId });
      if (!voterExists) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      const invitations = await this.voterInvitationsModel
        .find({ voterId: new Types.ObjectId(voterId) })
        .populate('voterId')
        .populate('electionId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      //check if voter invitation not exist
      if (!invitations) {
        throw new Error(MESSAGE.VOTER_INVITATION_NOT_FOUND);
      }
      return invitations;
    } catch (error) {
      throw error;
    }
  }


  async getById(id: string) {
    try {
      const invitation = await this.voterInvitationsModel
        .findById(new Types.ObjectId(id))
        .populate('voterId')
        .populate('electionId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      //check if voter invitation not exist
      if (!invitation) {
        throw new Error(MESSAGE.VOTER_INVITATION_NOT_FOUND);
      }
      return invitation;
    } catch (error) {
      throw error;
    }
  }
}
