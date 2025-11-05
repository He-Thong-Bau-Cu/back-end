import { Injectable } from '@nestjs/common';
import { CreateVoterInvitationDto } from './dto/create-voter-invitation.dto';
import { UpdateVoterInvitationDto } from './dto/update-voter-invitation.dto';
import { InjectModel } from '@nestjs/mongoose';
import { VoterInvitations } from 'src/database/schemas/voterInvitations.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Voters } from 'src/database/schemas/voters.schema';
import { Elections } from 'src/database/schemas/elections.schema';
import { MESSAGE } from 'src/common/enums/message.enum';

@Injectable()
export class VoterInvitationsService {
  constructor(
    @InjectModel(VoterInvitations.name)
    private readonly voterInvitationsModel: Model<VoterInvitations>,
    @InjectModel(Voters.name)
    private readonly votersModel: Model<Voters>,
    @InjectModel(Elections.name)
    private readonly electionsModel: Model<Elections>,
    private readonly jwtService: JwtService,
  ) { }

  generateToken(voterId: string, electionId: string): string {
    const payload = { voterId, electionId };
    const token = this.jwtService.sign(payload, { expiresIn: '24h' });
    return token;
  }

  async create(voterInvitation: CreateVoterInvitationDto) {
    try {
      // Check if the voterId exists in the database
      const voterExists = await this.votersModel.exists({ _id: voterInvitation.voterId });
      if (!voterExists) {
        throw new Error(MESSAGE.VOTER_NOT_FOUND);
      }
      // Check if the electionId exists in the database
      const electionExists = await this.electionsModel.exists({ _id: voterInvitation.electionId });
      if (!electionExists) {
        throw new Error(MESSAGE.ELECTION_NOT_FOUND);
      }
      const createdInvitation = await this.voterInvitationsModel.create(voterInvitation);
      return createdInvitation;
    } catch (error) {
      throw error;
    }
  }
}
