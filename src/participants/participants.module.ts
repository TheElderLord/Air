import { Module } from '@nestjs/common';
import { ParticipantsController } from './controllers/participants.controller';
import { ParticipantsService } from './services/participants.service';
import { OtpService } from 'src/utils/otp.service';

@Module({
  controllers: [ParticipantsController],
  providers: [ParticipantsService, OtpService],
})
export class ParticipantsModule {}
