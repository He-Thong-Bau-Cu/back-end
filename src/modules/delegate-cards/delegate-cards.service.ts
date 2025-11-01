import { Injectable } from '@nestjs/common';
import { CreateDelegateCardDto } from './dto/create-delegate-card.dto';
import { UpdateDelegateCardDto } from './dto/update-delegate-card.dto';
import { InjectModel } from '@nestjs/mongoose';
import { DelegateCard } from 'src/database/schemas/delegateCard.schema';
import { Model } from 'mongoose';
import { Delegations } from 'src/database/schemas/delegations.schema';

@Injectable()
export class DelegateCardsService {
  constructor(
    @InjectModel(DelegateCard.name)
    private readonly delegateCardModel: Model<DelegateCard>, 
    @InjectModel(Delegations.name)
    private readonly delegationModel: Model<Delegations>,
  ) {}

  async getDelegateCardsActive(){
    try {
        const now = new Date();
        const delegateCards = await this.delegateCardModel.find({
            status: 'ACTIVE',
            expiresAt: { $gt: now }})
            .populate({
                path:'delegationId',
                populate:[
                    {path: "electionId", select: "name"},
                    {path:"delegatorId", select:"username fullName email position"},
                    {path:"delegateId", select:"username fullName email position"},
                    {path:"documentId", select:"title file_url status"},
                    {path:"confirmedBy", select:"username fullName email position"}
            ],
                select:"delegatorId delegateId confirmedBy"
            })
            .exec();
        return delegateCards;
    } catch (error) {
        throw error;
    }
  }
}
