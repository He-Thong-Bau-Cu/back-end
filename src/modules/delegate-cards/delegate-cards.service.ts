import { Injectable } from '@nestjs/common';
import { CreateDelegateCardDto } from './dto/create-delegate-card.dto';
import { UpdateDelegateCardDto } from './dto/update-delegate-card.dto';
import { InjectModel } from '@nestjs/mongoose';
import { DelegateCard } from 'src/database/schemas/delegateCard.schema';
import { Model, Types } from 'mongoose';
import { Delegations } from 'src/database/schemas/delegations.schema';
import { MESSAGE } from 'src/common/enums/message.enum';
import { Elections } from 'src/database/schemas/elections.schema';
import { Voters } from 'src/database/schemas/voters.schema';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';


@Injectable()
export class DelegateCardsService {
  constructor(
    @InjectModel(DelegateCard.name)
    private readonly delegateCardModel: Model<DelegateCard>,
    @InjectModel(Delegations.name)
    private readonly delegationModel: Model<Delegations>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(Voters.name)
    private readonly votersModel: Model<Voters>,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) { }

  private generateToken(electionId: string, voterId: string): string {
    const payload = { electionId, voterId };
    const token = this.jwtService.sign(payload, { expiresIn: '24h' });
    return token;
  }

  async generateDelegateCardQRCode(delegateCardId: string) {
    try {
      // Check if the delegate card exists
      const delegateCard = await this.delegateCardModel.findById(new Types.ObjectId(delegateCardId)).exec();
      if (!delegateCard) {
        throw new Error(MESSAGE.DELEGATE_CARD_NOT_FOUND);
      }
      const qrCode = await this.authService.generateQRCode(delegateCard.token);
      return qrCode;
    } catch (error) {
      throw error;
    }
  }

  async create(createDelegateCardDto: CreateDelegateCardDto, userId: string) {
    try {
      // Check if the delegationId exists in the database
      const delegationExists = await this.delegationModel
        .findById(new Types.ObjectId(createDelegateCardDto.delegationId))
        .exec();
      if (!delegationExists) {
        throw new Error(MESSAGE.DELEGATION_NOT_FOUND);
      }
      // Check if the electionId exists in the database
      const electionExists = await this.electionsModel.exists({ _id: createDelegateCardDto.electionId });
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      // Check if the voterId exists in the database
      const voterExists = await this.votersModel.findById(new Types.ObjectId(createDelegateCardDto.voterId)).exec();
      if (!voterExists) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }

      //check delegateCard is exist 
      const delegateCardExists = await this.delegateCardModel.exists({
        delegationId: new Types.ObjectId(createDelegateCardDto.delegationId),
        electionId: new Types.ObjectId(createDelegateCardDto.electionId),
        voterId: new Types.ObjectId(createDelegateCardDto.voterId),
      });
      if (delegateCardExists) {
        throw new Error(MESSAGE.DELEGATE_CARD_ALREADY_EXISTS);
      }
      const issuedAt = new Date();
      const expiresAt = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000);

      const token = this.generateToken(createDelegateCardDto.electionId, createDelegateCardDto.voterId);



      const createdDelegateCard = new this.delegateCardModel({
        token: token,
        electionId: new Types.ObjectId(createDelegateCardDto.electionId),
        voterId: new Types.ObjectId(createDelegateCardDto.voterId),
        delegationId: new Types.ObjectId(createDelegateCardDto.delegationId),
        issuedAt,
        expiresAt,
        status,
        createdBy: new Types.ObjectId(userId),
        updatedBy: new Types.ObjectId(userId),
      });
      return await createdDelegateCard.save();
    } catch (error) {
      throw error;
    }
  }

  async getByToken(token: string) {
    try {
      const delegateCard = await this.delegateCardModel
        .findOne({ token: token })
        .populate('electionId')
        .populate('voterId')
        .populate('delegationId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      if (!delegateCard) {
        throw new Error(MESSAGE.DELEGATE_CARD_NOT_FOUND);
      }
      return delegateCard;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const delegateCard = await this.delegateCardModel
        .findById(new Types.ObjectId(id))
        .populate('electionId')
        .populate('voterId')
        .populate('delegationId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      if (!delegateCard) {
        throw new Error(MESSAGE.DELEGATE_CARD_NOT_FOUND);
      }
      return delegateCard;
    } catch (error) {
      throw error;
    }
  }

  async getByElectionId(electionId: string) {
    try {
      //Check if the election exists
      const election = await this.electionsModel.exists({ _id: electionId });
      if (!election) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      const delegateCards = await this.delegateCardModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('electionId')
        .populate('voterId')
        .populate('delegationId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      if (!delegateCards) {
        throw new Error(MESSAGE.DELEGATE_CARD_NOT_FOUND);
      }
      return delegateCards;
    } catch (error) {
      throw error;
    }
  }

  async getByVoterId(voterId: string) {
    try {
      const voter = await this.votersModel.exists({ _id: voterId });
      if (!voter) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      const delegateCards = await this.delegateCardModel
        .find({ voterId: new Types.ObjectId(voterId) })
        .populate('electionId')
        .populate('voterId')
        .populate('delegationId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      if (!delegateCards) {
        throw new Error(MESSAGE.DELEGATE_CARD_NOT_FOUND);
      }
      return delegateCards;
    } catch (error) {
      throw error;
    }
  }

  async getDelegateCardsActive() {
    try {
      const now = new Date();
      const delegateCards = await this.delegateCardModel.find({
        status: 'ACTIVE',
        expiresAt: { $gt: now }
      })
        .populate({
          path: 'delegationId',
          populate: [
            { path: "electionId", select: "name" },
            { path: "delegatorId", select: "username fullName email position" },
            { path: "delegateId", select: "username fullName email position" },
            { path: "documentId", select: "title file_url status" },
            { path: "confirmedBy", select: "username fullName email position" },
            { path: "createdBy", select: "username fullName email position" },
            { path: "updatedBy", select: "username fullName email position" },
          ],
          select: "delegatorId delegateId confirmedBy"
        })

        .exec();
      return delegateCards;
    } catch (error) {
      throw error;
    }
  }


}
