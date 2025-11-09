import { Injectable } from '@nestjs/common';
import { CreateElectionEntityDto } from './dto/create-election-entity.dto';
import { UpdateElectionEntityDto } from './dto/update-election-entity.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ElectionEntities } from 'src/database/schemas/electionEntities.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { ElectionTypes } from 'src/database/schemas/electionTypes.schema';
import { Users } from 'src/database/schemas/users.schema';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { MESSAGE } from 'src/common/enums/message.enum';

@Injectable()
export class ElectionEntitiesService {
  constructor(
    @InjectModel(ElectionEntities.name)
    private readonly electionEntityModel: Model<ElectionEntities>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(ElectionTypes.name)
    private readonly electionTypesModel: Model<ElectionTypes>,
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipants: Model<ElectionsParticipants>,
  ) { }

  async getById(id: string) {
    try {
      const entity = await this.electionEntityModel
        .findById(new Types.ObjectId(id))
        .populate('electionId')
        .populate('electionTypeId')
        .populate('proposerId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      // Kiểm tra entity có tồn tại không
      if (!entity) {
        throw new Error(MESSAGE.ELECTION_ENTITY_NOT_FOUND);
      }
      return entity;
    } catch (error) {
      throw error;
    }
  }

  async getByElectionId(electionId: string) {
    try {
      // Kiểm tra electionId có tồn tại không
      const electionExists = await this.electionsModel.exists({ _id: electionId });
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      const entities = await this.electionEntityModel
        .find({ electionId: new Types.ObjectId(electionId) })
        .populate('electionId')
        .populate('electionTypeId')
        .populate('proposerId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();

      // Kiểm tra entities có tồn tại không
      if (!entities) {
        throw new Error(MESSAGE.ELECTION_ENTITY_NOT_FOUND);
      }
      return entities;
    } catch (error) {
      throw error;
    }
  }

  async create(electionEntity: CreateElectionEntityDto, userId:string) {
    try {
      // Kiểm tra electionId có tồn tại không
      const electionExists = await this.electionsModel.exists({ _id: electionEntity.electionId });
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }

      // Kiểm tra electionTypeId có tồn tại không
      const electionTypeExists = await this.electionTypesModel.exists({ _id: electionEntity.electionTypeId });
      if (!electionTypeExists) {
        throw new Error(MESSAGE.ELECTION_TYPE_NOT_FOUND);
      }

      //Kiểm tra xem có participant nào liên kết với electionId không
      const participantExists = await this.electionParticipants.exists({ electionId: electionEntity.electionId });
      if (!participantExists) {
        throw new Error(MESSAGE.NO_PARTICIPANTS_LINKED);
      }

      const entity = await this.electionEntityModel.create({
        ...electionEntity,
        electionId: new Types.ObjectId(electionEntity.electionId),
        electionTypeId: new Types.ObjectId(electionEntity.electionTypeId),
        proposerId: new Types.ObjectId(electionEntity.proposerId),
        createdBy: new Types.ObjectId(userId) || null,
      });
      return entity;
    } catch (error) {
      throw error;
    }
  }



  async update(id: string, electionEntity: UpdateElectionEntityDto, userId:string) {
    try {
      // Kiểm tra entity có tồn tại không
      const entityExists = await this.electionEntityModel.exists({ _id: id });
      if (!entityExists) {
        throw new Error(MESSAGE.ELECTION_ENTITY_NOT_FOUND);
      }
      const updateElectionsEntity = await this.electionEntityModel
        .findByIdAndUpdate(new Types.ObjectId(id), {
          ...electionEntity,
          electionId: electionEntity.electionId ? new Types.ObjectId(electionEntity.electionId) : null,
          electionTypeId: electionEntity.electionTypeId ? new Types.ObjectId(electionEntity.electionTypeId) : null,
          proposerId: electionEntity.proposerId ? new Types.ObjectId(electionEntity.proposerId) : null,
          updatedBy: new Types.ObjectId(userId) || null,
        }, { new: true })
        .populate('electionId')
        .populate('electionTypeId')
        .populate('proposerId')
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return updateElectionsEntity;
    } catch (error) {
      throw error;
    }
  }

}
