import { Module } from '@nestjs/common';
import { VotingMethodsService } from './voting-methods.service';
import { VotingMethodsController } from './voting-methods.controller';
import { VotingMethods, VotingMethodsSchema } from 'src/database/schemas/votingMethods.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{name:VotingMethods.name, schema:VotingMethodsSchema}] )
  ],
  controllers: [VotingMethodsController],
  providers: [VotingMethodsService],
})
export class VotingMethodsModule {}
