import { Module } from '@nestjs/common';
import { SigningController } from './signature.controller';
import { SigningService } from './signature.service';

@Module({
  controllers: [SigningController],
  providers: [SigningService],
  exports: [SigningService]
})
export class SignatureModule {}
