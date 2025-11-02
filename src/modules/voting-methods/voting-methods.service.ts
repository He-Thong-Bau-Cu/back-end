import { Injectable } from '@nestjs/common';
import { CreateVotingMethodDto } from './dto/create-voting-method.dto';
import { UpdateVotingMethodDto } from './dto/update-voting-method.dto';
import { VotingMethods } from 'src/database/schemas/votingMethods.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class VotingMethodsService {
  constructor(
    @InjectModel(VotingMethods.name)
    private readonly votingMethodsModel: Model<VotingMethods>
  ) { }

  async findOne(methodCode: string) {
    try {
      const votingMethod = await this.votingMethodsModel.findOne
        ({ methodCode }).exec();
      if (!votingMethod) {
        throw new Error('Không tìm thấy mã phương thức bầu cử thông qua');
      }
      return votingMethod;
    } catch (error) {
      throw error;
    }
  }

}
