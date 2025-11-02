import { Injectable } from '@nestjs/common';
import { CreateThresholdDto } from './dto/create-threshold.dto';
import { UpdateThresholdDto } from './dto/update-threshold.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Thresholds } from 'src/database/schemas/thresholds.schema';
import { Model } from 'mongoose';

@Injectable()
export class ThresholdsService {
  constructor(
    @InjectModel(Thresholds.name)
    private readonly thresholdsModel: Model<Thresholds>) { }

  async findOne(thresholdCode: string) {
    try {
      const threshold = await this.thresholdsModel.findOne({ thresholdCode }).exec();
      if (!threshold) {
        throw new Error('Không tìm thấy mã ngưỡng thông qua');
      }
      return threshold;
    } catch (error) {
      throw error;
    }
  }
}
