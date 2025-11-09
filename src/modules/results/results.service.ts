import { Injectable } from '@nestjs/common';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Results } from 'src/database/schemas/results.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { ElectionEntities } from 'src/database/schemas/electionEntities.schema';
import { MESSAGE } from 'src/common/enums/message.enum';

@Injectable()
export class ResultsService {
  constructor(
    @InjectModel(Results.name)
    private readonly resultsModel: Model<Results>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(ElectionEntities.name)
    private readonly electionEntitiesModel: Model<ElectionEntities>,
  ) { }

  async findAll() {
    try {
      const results = await this.resultsModel.find()
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status decisionNumber decisionName')
        .populate('entityId', 'title description metaData fileUrl proposerId status')
        .exec();
      return results;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string) {
    try {
      //Check if the result is exist
      const resultExist = await this.resultsModel.exists({ _id: id });
      if (!resultExist) {
        throw new Error(MESSAGE.RESULT_NOT_FOUND);
      }
      const result = await this.resultsModel.findById(id)
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status decisionNumber decisionName')
        .populate('entityId', 'title description metaData fileUrl proposerId status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return result;
    } catch (error) {
      throw error;
    }
  }



  async getByElectionId(electionId: string) {
    try {
      //Check if the election is exist
      const electionExist = await this.electionsModel.exists({ _id: electionId });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      const result = await this.resultsModel.find({ electionId })
        .populate('electionId', 'title startDate endDate delegationStart delegationEnd status decisionNumber decisionName')
        .populate('entityId', 'title description metaData fileUrl proposerId status')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return result;
    } catch (error) {
      throw error;
    }
  }

  async create(createResultDto: CreateResultDto, userId:string) {
    try {
      //Check if elections is exists
      const electionExist = await this.electionsModel.exists({ _id: createResultDto.electionId });
      if (!electionExist) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      //Check if entity is exists
      const entityExist = await this.electionEntitiesModel.exists({ _id: createResultDto.entityId });
      if (!entityExist) {
        throw new Error(MESSAGE.ENTITY_NOT_FOUND);
      }

      const result = await this.resultsModel.create({
        ...createResultDto,
        electionId: new Types.ObjectId(createResultDto.electionId),
        entityId: new Types.ObjectId(createResultDto.entityId),
        createdBy: userId ? new Types.ObjectId(userId) : null,
      });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateResultDto: UpdateResultDto, userId:string) {
    try {
      //Check if the result is exist
      const resultExist = await this.resultsModel.exists({ _id: id });
      if (!resultExist) {
        throw new Error(MESSAGE.RESULT_NOT_FOUND);
      }
      const result = await this.resultsModel
        .findByIdAndUpdate(new Types.ObjectId(id), {
          ...updateResultDto,
          electionId: updateResultDto.electionId ? new Types.ObjectId(updateResultDto.electionId) : null,
          entityId: updateResultDto.entityId ? new Types.ObjectId(updateResultDto.entityId) : null,
          updatedBy: userId ? new Types.ObjectId(userId) : null,
        }, { new: true })
        .exec();
      return result;
    } catch (error) {
      throw error;
    }
  }
}
