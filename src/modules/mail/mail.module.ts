import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { Voters, VotersSchema } from 'src/database/schemas/voters.schema';
import { MongooseModule } from '@nestjs/mongoose';
@Module({
  imports: [
      MongooseModule.forFeature([
      {name:Voters.name,schema:VotersSchema},
        
      ])
    ],
  providers: [MailService],
  exports: [MailService]
})
export class MailModule {}
