import { Injectable } from '@nestjs/common';
import { CreateThresholdDto } from './dto/create-threshold.dto';
import { UpdateThresholdDto } from './dto/update-threshold.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Thresholds } from 'src/database/schemas/thresholds.schema';
import { Model, Types } from 'mongoose';
import { MESSAGE } from 'src/common/enums/message.enum';
import { BaseSearchDTO } from 'src/common/dto/base-search.dto';
import { paginate } from 'src/common/dto/paignation';

@Injectable()
export class ThresholdsService {
  constructor(
    @InjectModel(Thresholds.name)
    private readonly thresholdsModel: Model<Thresholds>) { }

  async findOne(thresholdCode: string) {
    try {
      const threshold = await this.thresholdsModel
        .findOne({ thresholdCode })
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      if (!threshold) {
        throw new Error(MESSAGE.THRESHOLD_CODE_NOT_FOUND);
      }
      return threshold;
    } catch (error) {
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const threshold = await this.thresholdsModel
        .findById(new Types.ObjectId(id))
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      if (!threshold) {
        throw new Error(MESSAGE.THRESHOLD_NOT_FOUND);
      }
      return threshold;
    } catch (error) {
      throw error;
    }
  }

  async search(req: BaseSearchDTO) {
    try {
      const query: any = {};

      if (req.keyword) {
        query.$or = [
          { thresholdName: { $regex: req.keyword, $options: 'i' } },
          { thresholdCode: { $regex: req.keyword, $options: 'i' } },
          { thresholdType: { $regex: req.keyword, $options: 'i' } },
          { description: { $regex: req.keyword, $options: 'i' } },
          { status: { $regex: req.keyword, $options: 'i' } },
        ];
      }
      const thresholds = await this.thresholdsModel.find(query)
        .populate('createdBy', 'username fullName email position')
        .populate('updatedBy', 'username fullName email position')
        .exec();
      return paginate(
        thresholds,
        req.page,
        req.limit
      );
    } catch (error) {
      throw error;
    }
  }

  async create(createThresholdDto: CreateThresholdDto, userId: string) {
    try {
      const createdThreshold = await this.thresholdsModel.create(createThresholdDto);
      return { ...createdThreshold, createdBy: userId };
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateThresholdDto: UpdateThresholdDto, userId: string) {
    try {
      const updatedThreshold = await this.thresholdsModel.findByIdAndUpdate(
        new Types.ObjectId(id),
        { ...updateThresholdDto, updatedBy: userId },
        { new: true },
      );
      return updatedThreshold;
    } catch (error) {
      throw error;
    }
  }
}