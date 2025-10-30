import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateElectionParticipantDto } from './dto/create-election-participant.dto';
import { UpdateElectionParticipantDto } from './dto/update-election-participant.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ElectionsParticipants } from 'src/database/schemas/electionParticipants.schema';
import { Model } from 'mongoose';
import { Elections } from 'src/database/schemas/elections.schema';
import { User } from 'src/database/schemas/users.schema';
import { Roles } from 'src/database/schemas/roles.schema';

@Injectable()
export class ElectionParticipantsService {
 
  constructor(
    @InjectModel(ElectionsParticipants.name)
    private readonly electionParticipantsModel:Model<ElectionsParticipants>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    @InjectModel(User.name)
    private readonly usersModel: Model<User>,
    @InjectModel(Roles.name)
    private readonly rolesModel: Model<Roles>
  ) {}

  async create(electionParticipants: CreateElectionParticipantDto) {
    try {
      console.log('Incoming DTO:', electionParticipants);

    //Kiểm tra electionId có tồn tại không
    const electionExists = await this.electionsModel.exists({ _id: electionParticipants.electionId });
    if (!electionExists) {
      throw new NotFoundException('Election not found');
    }

    //Kiểm tra userId có tồn tại không
    const userExists = await this.usersModel.exists({ _id: electionParticipants.userId });
    if (!userExists) {
      throw new NotFoundException('User not found');
    }

    // 3. Kiểm tra roleId có tồn tại không
    const roleExists = await this.rolesModel.exists({ _id: electionParticipants.roleId });
    if (!roleExists) {
      throw new NotFoundException('Role not found');
    }

      const electionParticipant = await this.electionParticipantsModel.create(electionParticipants);
      return electionParticipant;
    } catch (error) {
      throw error;
    }
  }
}
