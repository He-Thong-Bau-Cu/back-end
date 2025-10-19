import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ElectionsDocument = Elections & Document;

export class Elections {
  @Prop()
  title: string;

  @Prop()
  electionType: string;

  @Prop()
  votingMethod: string;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop()
  status: string;

  @Prop()
  createdBy: number;

  @Prop()
  companyType: string;
}

export const ElectionsSchema = SchemaFactory.createForClass(Elections);
