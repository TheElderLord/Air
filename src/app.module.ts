import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParticipantsModule } from './participants/participants.module';
import { RedisModule } from './global/redis.module';
import { ControllersController } from './requests/controllers/requests.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ParticipantsModule,
    RedisModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, ControllersController],
  providers: [AppService],
})
export class AppModule {}
