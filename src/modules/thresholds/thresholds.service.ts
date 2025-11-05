import { Injectable } from '@nestjs/common';
import { CreateThresholdDto } from './dto/create-threshold.dto';
import { UpdateThresholdDto } from './dto/update-threshold.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Thresholds } from 'src/database/schemas/thresholds.schema';
import { Model } from 'mongoose';
import { MESSAGE } from 'src/common/enums/message.enum';

@Injectable()
export class ThresholdsService {
  constructor(
    @InjectModel(Thresholds.name)
    private readonly thresholdsModel: Model<Thresholds>) { }

  async findOne(thresholdCode: string) {
    try {
      const threshold = await this.thresholdsModel.findOne({ thresholdCode }).exec();
      if (!threshold) {
        throw new Error(MESSAGE.THRESHOLD_CODE_NOT_FOUND);
      }
      return threshold;
    } catch (error) {
      throw error;
    }
  }
}
