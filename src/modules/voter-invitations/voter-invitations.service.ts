import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { VoterInvitations } from 'src/database/schemas/voterInvitations.schema';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Voters } from 'src/database/schemas/voters.schema';
import { Elections } from 'src/database/schemas/elections.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { UserDto } from 'src/common/dto/user.dto';
import { CreateVoterInvitationDto } from './dto/create-voter-invitation.dto';
import { STATUS } from 'src/common/enums/status.enum';
import { Users } from 'src/database/schemas/users.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class VoterInvitationsService {
  constructor(
    @InjectModel(VoterInvitations.name)
    private readonly voterInvitationsModel: Model<VoterInvitations>,
    @InjectModel(Voters.name)
    private readonly votersModel: Model<Voters>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(Users.name)
    private readonly usersModel: Model<Users>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) { }

  generateToken(voterId: string, electionId: string): string {
    const payload = { voterId, electionId };
    const token = this.jwtService.sign(payload, { expiresIn: '24h' });
    return token;
  }

  async create(voterInvitation: CreateVoterInvitationDto, userId: string) {
    try {
      // Check if the voterId exists in the database
      const voterExists = await this.votersModel
        .findById(new Types.ObjectId(voterInvitation.voterId))
        .populate<{ userId: Users }>('userId', '_id email fullName username password')
        .exec();

      if (!voterExists) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      // Check if the electionId exists in the database
      const electionExists = await this.electionsModel.exists({ _id: voterInvitation.electionId });
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      //kiểm tra election của voter và trong create voterInvitation có trùng nhau không
      if (voterExists.electionId.toString() !== voterInvitation.electionId) {
        throw new Error("Cuộc bầu cử mà voter tham gia không trùng khớp với cuộc bầu cử mà bạn muốn mời");
      }

      const token = this.generateToken(voterInvitation.voterId, voterInvitation.electionId);
      const sentAt = new Date();
      const expiresAt = new Date(sentAt.getTime() + 24 * 60 * 60 * 1000);

      //send email and create user
      const userIdObj = voterExists.userId as Users & { _id: string };

      const password = this.usersService.generateRandomPassword(8);
      const passwordHash = await bcrypt.hash(password, 10);
      await this.usersModel.findByIdAndUpdate(
        new Types.ObjectId(userIdObj._id),
        { password: passwordHash },
      );

      await this.mailService.sendMailInvitation(
        voterExists.userId.email,
        voterExists.userId.fullName,
        voterExists.userId.username,
        password,
        token
      );

      await this.votersModel.findByIdAndUpdate(new Types.ObjectId(voterInvitation.voterId), { status: STATUS.INVITED });

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

  //Xác nhận voter vào hệ thống qua mail
  async confirmationVoterInvitation(token: string) {
    try {
      const decodedToken = this.jwtService.decode(token);
      const voterId = decodedToken.voterId;
      const electionId = decodedToken.electionId;
      const voterInvitation = await this.voterInvitationsModel.findOne({
        voterId: new Types.ObjectId(voterId),
        electionId: new Types.ObjectId(electionId),
      });
      if (!voterInvitation) {
        throw new Error(MESSAGE.VOTER_INVITATION_NOT_FOUND);
      }
      const voter = await this.votersModel.findById(new Types.ObjectId(voterId)).exec();
      if (!voter) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      const user = await this.usersService.getById(voter.userId.toString());
      if (!user) {
        throw new Error(MESSAGE.USER_NOT_FOUND);
      }

      await this.votersModel.findByIdAndUpdate(new Types.ObjectId(voterId), { status: STATUS.CONFIRMED });


      return { user, valid: true };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { valid: false, reason: 'Token đã hết hạn. Vui lòng liên hệ với người quản lý' };
      }
      return { valid: false, reason: 'invalid' };
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
        .lean();

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
