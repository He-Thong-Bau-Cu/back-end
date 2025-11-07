import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { CreateTwilioDto } from './dto/create-twilio.dto';
import { UpdateTwilioDto } from './dto/update-twilio.dto';

@Controller('twilio')
export class TwilioController {
  constructor(private readonly twilioService: TwilioService) {}

  @Post()
  create(@Body() createTwilioDto: CreateTwilioDto) {
    return this.twilioService.create(createTwilioDto);
  }

  @Get()
  findAll() {
    return this.twilioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.twilioService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTwilioDto: UpdateTwilioDto) {
    return this.twilioService.update(+id, updateTwilioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.twilioService.remove(+id);
  }
}
