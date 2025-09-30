import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { BaseResponse } from 'src/common/dto/base-response.dto';
import { ElectionsService } from './elections.service';
import { METHOD } from 'src/common/enums/method.enum';
import { ElectionsDto } from './dto/elections.dto';
import { ElectionsDocumentDto } from './dto/electionsDocument.dto';

@Controller('elections')
export class ElectionsController {
  constructor(private readonly electionsService: ElectionsService) {}

  @Post(METHOD.SEARCH)
  async searchElections(@Body() req: ElectionsDto): Promise<BaseResponse> {
    try{
      const resData = await this.electionsService.searchElections(req);
      return BaseResponse.success(resData, 'Success', HttpStatus.OK);
    }catch(e){
      throw new HttpException({message: e.message}, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(`${METHOD.GET}/:id`)
  async getElectionById(@Param('id') id: string): Promise<BaseResponse> {
    try{
      const resData = await this.electionsService.getElectionById(id);
      return BaseResponse.success(resData, 'Success', HttpStatus.OK);
    }catch(e){
      throw new HttpException({message: e.message}, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(`${METHOD.GET}-by-election-id/:id`)
  async searchElectionDocumentsByElectionId(@Param('id') id: string): Promise<BaseResponse> {
    try{
      const resData = await this.electionsService.searchElectionDocumentsByElectionId(id);
      return BaseResponse.success(resData, 'Success', HttpStatus.OK);
    }catch(e){
      throw new HttpException({message: e.message}, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Put(`${METHOD.UPDATE}/:id`)
  async updateElections(@Param('id') id: string, @Body() req: ElectionsDto): Promise<BaseResponse> {
    try{
      const resData = await this.electionsService.updateElections(id, req);
      return BaseResponse.success(resData, 'Success', HttpStatus.OK);
    }catch(e){
      throw new HttpException({message: e.message}, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(`${METHOD.DELETE}/:id`)
  async deleteElection(@Param('id') id: string): Promise<BaseResponse> {
    try{
      const resData = await this.electionsService.deleteElection(id);
      return BaseResponse.success(resData, 'Success', HttpStatus.OK);
    }catch(e){
      throw new HttpException({message: e.message}, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(`/document/${METHOD.CREATE}`)
  async createElectionDocuments(@Body() req: ElectionsDocumentDto): Promise<BaseResponse> {
    try{
      const resData = await this.electionsService.createElectionDocuments(req);
      return BaseResponse.success(resData, 'Success', HttpStatus.OK);
    }catch(e){
      throw new HttpException({message: e.message}, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(`/document/${METHOD.DELETE}/:electionId`)
  async deleteDocumentByElectionId(@Param('electionId') electionId: string): Promise<BaseResponse> {
    try{
      const resData = await this.electionsService.deleteDocumentByElectionId(electionId);
      return BaseResponse.success(resData, 'Success', HttpStatus.OK);
    }catch(e){
      throw new HttpException({message: e.message}, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
