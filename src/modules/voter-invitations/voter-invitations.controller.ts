import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VoterInvitationsService } from './voter-invitations.service';
import { CreateVoterInvitationDto } from './dto/create-voter-invitation.dto';
import { UpdateVoterInvitationDto } from './dto/update-voter-invitation.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import Api from 'twilio/lib/rest/Api';
import { BaseResponse } from 'src/common/dto/base-response.dto';

@Controller('voter-invitations')
export class VoterInvitationsController {
  constructor(private readonly voterInvitationsService: VoterInvitationsService) {}

  // @Post()
  // @ApiOperation({ summary: 'Tạo lời mời mới tới cử tri' })
  // @ApiResponse({ status: 201, description: 'Lời mời được tạo thành công.' })
  // @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  // @ApiResponse({ status: 500, description: 'Lỗi máy chủ nội bộ.' })
  // async create(@Body() createVoterInvitation: CreateVoterInvitationDto):Promise<BaseResponse>{
  //   try {
      
  //   } catch (error) {
      
  //   }
  // }
}
