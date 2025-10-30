import { Injectable } from '@nestjs/common';
import { CreateVoterInvitationDto } from './dto/create-voter-invitation.dto';
import { UpdateVoterInvitationDto } from './dto/update-voter-invitation.dto';
import { InjectModel } from '@nestjs/mongoose';
import { VoterInvitations } from 'src/database/schemas/voterInvitations.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class VoterInvitationsService {
  constructor(
    @InjectModel(VoterInvitations.name)
    private readonly voterInvitationsModel: Model<VoterInvitations>,
    private readonly jwtService: JwtService,
  ) {}

  generateToken(voterId: string, electionId: string): string {
   const payload = { voterId, electionId };
   const token = this.jwtService.sign(payload, { expiresIn: '24h' });
   return token;
  }

  async create(voterInvitation: CreateVoterInvitationDto){
    try {
      const createdInvitation = await this.voterInvitationsModel.create(voterInvitation);
      return createdInvitation;
    } catch (error) {
      throw error;
    }
  } 
}
