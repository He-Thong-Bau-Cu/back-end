import { Injectable } from '@nestjs/common';
import { CreateElectionTypeDto } from './dto/create-election-type.dto';
import { UpdateElectionTypeDto } from './dto/update-election-type.dto';
import { ElectionTypes } from 'src/database/schemas/electionTypes.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { MESSAGE } from 'src/common/enums/message.enum';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';
import { paginate } from 'src/common/dto/paignation';

@Injectable()
export class ElectionTypesService {
  constructor(
    @InjectModel(ElectionTypes.name)
    private readonly electionTypesModel: Model<ElectionTypes>,
  ) { }

  async search(req: BaseSearchDTO) {
    try {
      const types = await this.electionTypesModel.find({
        $or: [
          { title: { $regex: req.keyword || '', $options: 'i' } },
          { typeCode: { $regex: req.keyword || '', $options: 'i' } },
          { description: { $regex: req.keyword || '', $options: 'i' } },
          { status: { $regex: req.keyword || '', $options: 'i' } },
        ]
      })
        .collation({ locale: 'vi', strength: 1 }).lean();
      return paginate(
        types,
        req.page,
        req.limit
      )
    } catch (error) {
      throw error;
    }
  }

  async findOne(typeCode: string) {
    try {
      const electionType = await this.electionTypesModel
        .findOne({ typeCode })
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      if (!electionType) {
        throw new Error(MESSAGE.ELECTION_TYPE_CODE_NOT_FOUND);
      }
      return electionType;
    } catch (error) {
      throw error;
    }
  }

  async create(createElectionTypeDto: CreateElectionTypeDto, userId: string) {
    try {
      const electionType = await this.electionTypesModel.create({
        ...createElectionTypeDto,
        createdBy: new Types.ObjectId(userId) || null,
      });
      return electionType;
    } catch (error) {
      throw error;
    }
  }
}
