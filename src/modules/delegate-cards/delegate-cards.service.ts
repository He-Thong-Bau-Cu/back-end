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
  ) { }

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
