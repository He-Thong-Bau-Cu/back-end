import { Injectable } from '@nestjs/common';
import { CreateElectionTypeDto } from './dto/create-election-type.dto';
import { UpdateElectionTypeDto } from './dto/update-election-type.dto';
import { ElectionTypes } from 'src/database/schemas/electionTypes.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ElectionTypesService {
  constructor(
    @InjectModel(ElectionTypes.name)
    private readonly electionTypesModel: Model<ElectionTypes>,
  ){}

  async findOne(typeCode:string){
    try {
      const electionType = await this.electionTypesModel.findOne({typeCode}).exec();
      if(!electionType){
        throw new Error('ElectionType Code not found');
      }
      return electionType;
    } catch (error) {
      throw error;
    }
  }
}
