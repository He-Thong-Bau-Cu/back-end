import { Injectable } from '@nestjs/common';
import { CreateElectionEntityDto } from './dto/create-election-entity.dto';
import { UpdateElectionEntityDto } from './dto/update-election-entity.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ElectionEntities } from 'src/database/schemas/electionEntities.schema';
import { Model, Types } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { ElectionTypes } from 'src/database/schemas/electionTypes.schema';
import { User } from 'src/database/schemas/users.schema';
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


  async create(electionEntity: CreateElectionEntityDto) {
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

      const entity = await this.electionEntityModel.create(electionEntity);
      return entity;
    } catch (error) {
      throw error;
    }
  }



  async update(id: string, electionEntity: UpdateElectionEntityDto) {
    try {
      const updateElectionsEntity = await this.electionEntityModel
        .findByIdAndUpdate(new Types.ObjectId(id), electionEntity, { new: true })
        .exec();
      return updateElectionsEntity;
    } catch (error) {
      throw error;
    }
  }

}
